/**
 * Real BigQuery Log Tool - For production use with Cloud Logging
 * Queries actual log data from Log Analytics
 */

import { z } from 'zod';
import { BigQuery } from '@google-cloud/bigquery';
import { config } from '../config.js';

// Initialize BigQuery client
const bigquery = new BigQuery({
  projectId: config.gcpProjectId,
});

// Schema for the log query tool
const LogQuerySchema = z.object({
  query: z.string().describe(
    `A BigQuery SQL query to fetch logs. Use table \`${config.bigQueryTable}\`. ` +
    'ALWAYS include a LIMIT clause (max 50 rows). ' +
    'Use TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL X MINUTE/HOUR) for time filtering.'
  )
});

/**
 * Real tool that executes BigQuery SQL against Cloud Logging
 * This is exported as a function that takes the ai instance
 */
export function createQueryLogsTool(ai: any) {
  return ai.defineTool({
    name: 'querySystemLogs',
    description: 'Executes a BigQuery SQL query against Cloud Logging to find system errors, latency issues, or specific request IDs. Returns structured log data.',
    inputSchema: LogQuerySchema,
    outputSchema: z.string(),
  }, async ({ query }: { query: string }) => {
    console.log('🔍 Executing BigQuery log query...');
    console.log('Query:', query);
    
    try {
      // Safety check: Ensure query has a LIMIT clause
      if (!query.toLowerCase().includes('limit')) {
        console.warn('⚠️  Query missing LIMIT clause, adding LIMIT 50');
        query = query.trim();
        if (query.endsWith(';')) {
          query = query.slice(0, -1);
        }
        query += ' LIMIT 50';
      }
      
      // Safety check: Prevent queries with LIMIT > 100
      const limitMatch = query.match(/limit\s+(\d+)/i);
      if (limitMatch) {
        const limit = parseInt(limitMatch[1], 10);
        if (limit > 100) {
          console.warn('⚠️  LIMIT too high, reducing to 50');
          query = query.replace(/limit\s+\d+/i, 'LIMIT 50');
        }
      }
      
      // Execute the query
      const options = {
        query: query,
        location: 'US', // Log Analytics uses US location by default
      };
      
      const [job] = await bigquery.createQueryJob(options);
      console.log(`✓ BigQuery job created: ${job.id}`);
      
      // Wait for the query to complete
      const [rows] = await job.getQueryResults();
      
      console.log(`✓ Query completed: ${rows.length} rows returned`);
      
      if (rows.length === 0) {
        return JSON.stringify({
          message: 'No logs found matching the query criteria.',
          rowCount: 0,
          data: []
        });
      }
      
      // Return the results as formatted JSON
      return JSON.stringify({
        rowCount: rows.length,
        data: rows
      }, null, 2);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('✗ BigQuery error:', errorMessage);
      
      // Provide helpful error messages
      if (errorMessage.includes('Not found: Table')) {
        return JSON.stringify({
          error: 'Log Analytics table not found. Please ensure Log Analytics is enabled and has data.',
          hint: 'Go to Cloud Console → Logging → Log Storage → Upgrade _Default bucket to Log Analytics',
          details: errorMessage
        });
      }
      
      if (errorMessage.includes('permission')) {
        return JSON.stringify({
          error: 'Permission denied. The service account needs BigQuery permissions.',
          hint: 'Grant roles/bigquery.jobUser and roles/logging.viewer to the service account',
          details: errorMessage
        });
      }
      
      return JSON.stringify({
        error: 'Error querying logs',
        details: errorMessage
      });
    }
  });
}

