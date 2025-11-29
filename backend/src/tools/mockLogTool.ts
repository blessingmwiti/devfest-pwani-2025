/**
 * Mock Log Tool - For local development without GCP
 * Simulates realistic log data for testing the AI assistant
 */

import { z } from 'zod';

// Mock log entries that simulate real Cloud Logging data
const mockLogs = [
  {
    timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
    severity: 'ERROR',
    service: 'payment-service',
    log_message: 'Payment gateway timeout after 30s',
    error_details: 'Connection timeout to payment-gateway.example.com',
    trace_id: 'trace-abc123',
    http_status: 504
  },
  {
    timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
    severity: 'ERROR',
    service: 'checkout-service',
    log_message: 'Failed to process checkout request',
    error_details: 'Database connection pool exhausted',
    trace_id: 'trace-def456',
    http_status: 500
  },
  {
    timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
    severity: 'WARNING',
    service: 'auth-service',
    log_message: 'High latency detected on authentication endpoint',
    error_details: 'Response time: 2500ms (threshold: 1000ms)',
    trace_id: 'trace-ghi789',
    http_status: 200
  },
  {
    timestamp: new Date(Date.now() - 20 * 60000).toISOString(),
    severity: 'ERROR',
    service: 'payment-service',
    log_message: 'Payment declined by processor',
    error_details: 'Insufficient funds',
    trace_id: 'trace-jkl012',
    http_status: 402
  },
  {
    timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
    severity: 'ERROR',
    service: 'checkout-service',
    log_message: 'Checkout validation failed',
    error_details: 'Invalid shipping address format',
    trace_id: 'trace-mno345',
    http_status: 400
  },
  {
    timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
    severity: 'ERROR',
    service: 'api-gateway',
    log_message: 'Rate limit exceeded',
    error_details: 'Client exceeded 100 requests per minute',
    trace_id: 'trace-pqr678',
    http_status: 429
  },
  {
    timestamp: new Date(Date.now() - 35 * 60000).toISOString(),
    severity: 'WARNING',
    service: 'database-proxy',
    log_message: 'Slow query detected',
    error_details: 'Query execution time: 5.2s',
    trace_id: 'trace-stu901',
    http_status: null
  },
  {
    timestamp: new Date(Date.now() - 40 * 60000).toISOString(),
    severity: 'ERROR',
    service: 'payment-service',
    log_message: 'Payment gateway connection refused',
    error_details: 'ECONNREFUSED 10.0.1.5:8443',
    trace_id: 'trace-vwx234',
    http_status: 503
  },
  {
    timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
    severity: 'INFO',
    service: 'checkout-service',
    log_message: 'Checkout completed successfully',
    error_details: null,
    trace_id: 'trace-yza567',
    http_status: 200
  },
  {
    timestamp: new Date(Date.now() - 50 * 60000).toISOString(),
    severity: 'ERROR',
    service: 'auth-service',
    log_message: 'JWT token validation failed',
    error_details: 'Token expired at 2025-11-28T10:30:00Z',
    trace_id: 'trace-bcd890',
    http_status: 401
  }
];

// Schema for the mock query tool
const MockLogQuerySchema = z.object({
  query: z.string().describe('A SQL-like query string (will be simulated with mock data)')
});

/**
 * Mock tool that simulates BigQuery log queries
 * Filters mock data based on keywords in the query
 * This is exported as a function that takes the ai instance
 */
export function createQueryMockLogsTool(ai: any) {
  return ai.defineTool({
    name: 'querySystemLogs',
    description: 'Executes a simulated SQL query against mock system logs to find errors, latency issues, or specific request IDs. This is a MOCK tool for testing.',
    inputSchema: MockLogQuerySchema,
    outputSchema: z.string(),
  }, async ({ query }: { query: string }) => {
    console.log('🔧 MOCK MODE: Simulating log query:', query);
    
    try {
      // Simple filtering based on query keywords
      let filteredLogs = [...mockLogs];
      
      const queryLower = query.toLowerCase();
      
      // Filter by severity
      if (queryLower.includes("severity = 'error'") || queryLower.includes('error')) {
        filteredLogs = filteredLogs.filter(log => log.severity === 'ERROR');
      } else if (queryLower.includes("severity = 'warning'") || queryLower.includes('warning')) {
        filteredLogs = filteredLogs.filter(log => log.severity === 'WARNING');
      }
      
      // Filter by service
      if (queryLower.includes('payment')) {
        filteredLogs = filteredLogs.filter(log => log.service.includes('payment'));
      } else if (queryLower.includes('checkout')) {
        filteredLogs = filteredLogs.filter(log => log.service.includes('checkout'));
      } else if (queryLower.includes('auth')) {
        filteredLogs = filteredLogs.filter(log => log.service.includes('auth'));
      }
      
      // Filter by time (last 30 minutes, etc.)
      if (queryLower.includes('30 minute')) {
        const thirtyMinAgo = Date.now() - 30 * 60000;
        filteredLogs = filteredLogs.filter(log => 
          new Date(log.timestamp).getTime() > thirtyMinAgo
        );
      } else if (queryLower.includes('1 hour')) {
        const oneHourAgo = Date.now() - 60 * 60000;
        filteredLogs = filteredLogs.filter(log => 
          new Date(log.timestamp).getTime() > oneHourAgo
        );
      }
      
      // Apply LIMIT if specified
      let limit = 50; // default
      const limitMatch = queryLower.match(/limit\s+(\d+)/);
      if (limitMatch) {
        limit = parseInt(limitMatch[1], 10);
      }
      
      filteredLogs = filteredLogs.slice(0, limit);
      
      // Sort by timestamp descending (most recent first)
      filteredLogs.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      console.log(`✓ MOCK: Returning ${filteredLogs.length} log entries`);
      
      return JSON.stringify(filteredLogs, null, 2);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('✗ MOCK: Error simulating query:', errorMessage);
      return `Error simulating log query: ${errorMessage}`;
    }
  });
}

