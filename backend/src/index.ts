/**
 * AI DevOps Assistant - Main Genkit Application
 * DevFest Pwani 2025
 */

// Load environment variables FIRST
import dotenv from 'dotenv';
dotenv.config();

import { genkit, z } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { config } from './config.js';
import { createQueryLogsTool } from './tools/logTool.js';
import { createQueryMockLogsTool } from './tools/mockLogTool.js';
import express from 'express';
import cors from 'cors';

// Initialize Genkit with Google AI plugin
const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY,
    }),
  ],
});

// Define tools statically (Genkit 0.9 requirement)
const queryLogsTool = createQueryLogsTool(ai);
const queryMockLogsTool = createQueryMockLogsTool(ai);

// System prompt with few-shot examples for SQL generation
const SYSTEM_INSTRUCTION = `You are a Senior Site Reliability Engineer (SRE) Assistant specializing in DevOps and system debugging.
Your goal is to help developers debug production issues by analyzing system logs.

CRITICAL RULES:
1. ALWAYS use the 'querySystemLogs' tool to verify your hypothesis before making conclusions
2. When querying logs, focus on the most recent time period (last 30-60 minutes) unless specified otherwise
3. Provide actionable insights, not just raw data
4. If you find errors, identify patterns and suggest root causes

DATABASE SCHEMA (BigQuery Log Analytics):
- Table: \`${config.bigQueryTable}\`
- Key columns:
  * timestamp: TIMESTAMP - when the log was created
  * severity: STRING - 'INFO', 'WARNING', 'ERROR', 'CRITICAL'
  * jsonPayload.message: STRING - the log message
  * jsonPayload.error: STRING - error details if present
  * resource.labels.service_name: STRING - which service generated the log
  * httpRequest.status: INTEGER - HTTP status code
  * httpRequest.latency: STRING - request latency
  * trace: STRING - trace ID for distributed tracing

QUERY RULES:
1. ALWAYS include "LIMIT 50" or less in your queries
2. Use TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL X MINUTE) for time filtering
3. Order by timestamp DESC to get most recent logs first
4. Use WHERE clauses to filter by severity, service, or other criteria

EXAMPLE QUERIES:

User: "Show me recent errors in the payment service"
SQL:
SELECT 
  timestamp, 
  jsonPayload.message AS log_message,
  jsonPayload.error AS error_details,
  trace
FROM \`${config.bigQueryTable}\`
WHERE resource.labels.service_name = 'payment-service'
  AND severity = 'ERROR'
  AND timestamp > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 HOUR)
ORDER BY timestamp DESC 
LIMIT 50;

User: "Why is the API slow?"
SQL:
SELECT 
  timestamp,
  httpRequest.latency,
  httpRequest.requestUrl,
  resource.labels.service_name AS service
FROM \`${config.bigQueryTable}\`
WHERE httpRequest.latency IS NOT NULL
  AND timestamp > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 MINUTE)
ORDER BY httpRequest.latency DESC 
LIMIT 50;

User: "Find checkout failures in the last 30 minutes"
SQL:
SELECT 
  timestamp,
  severity,
  jsonPayload.message AS log_message,
  httpRequest.status,
  trace
FROM \`${config.bigQueryTable}\`
WHERE (jsonPayload.message LIKE '%checkout%' OR resource.labels.service_name LIKE '%checkout%')
  AND severity IN ('ERROR', 'WARNING')
  AND timestamp > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 MINUTE)
ORDER BY timestamp DESC 
LIMIT 50;

RESPONSE FORMAT:
1. First, explain what you're going to check
2. Use the tool to query the logs
3. Analyze the results
4. Provide a clear summary with:
   - What you found (number of errors, patterns)
   - Root cause hypothesis
   - Specific trace IDs or timestamps for investigation
   - Recommended next steps

Be concise but thorough. Developers are under pressure - give them answers fast.`;

// Define the main assistant flow using Genkit 0.9 API
const devAssistantFlow = ai.defineFlow(
  {
    name: 'devAssistant',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (userPrompt: string) => {
    console.log('\n📝 User Query:', userPrompt);
    console.log(`🔧 Mode: ${config.useMockData ? 'MOCK DATA' : 'REAL BIGQUERY'}`);
    
    // Select the appropriate tool based on configuration
    const tool = config.useMockData ? queryMockLogsTool : queryLogsTool;
    
    try {
      // Generate response using Gemini with tool calling
      const llmResponse = await ai.generate({
        model: 'googleai/gemini-2.5-flash',
        prompt: userPrompt,
        system: SYSTEM_INSTRUCTION,
        tools: [tool],
        config: {
          temperature: 0.3,
          maxOutputTokens: 2048,
        },
      });
      
      const responseText = llmResponse.text;
      console.log('✓ Response generated:', responseText.substring(0, 100) + '...');
      
      return responseText;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('✗ Error in devAssistantFlow:', errorMessage);
      
      return `I encountered an error while processing your request: ${errorMessage}\n\n` +
             `Please check the logs and try again. If this persists, contact support.`;
    }
  }
);

// Create Express server for HTTP endpoints
const app = express();
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    mode: config.useMockData ? 'mock' : 'production',
    timestamp: new Date().toISOString(),
  });
});

// Main assistant endpoint
app.post('/devAssistant', async (req, res) => {
  try {
    const { data } = req.body;
    
    if (!data || typeof data !== 'string') {
      return res.status(400).json({
        error: 'Invalid request. Expected { data: "your question" }',
      });
    }
    
    console.log('\n🌐 HTTP Request received');
    const response = await devAssistantFlow(data);
    
    res.json({ result: response });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('✗ HTTP Error:', errorMessage);
    
    res.status(500).json({
      error: 'Internal server error',
      details: errorMessage,
    });
  }
});

// Start the server
const PORT = config.port;
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 AI DevOps Assistant - Backend Started');
  console.log('='.repeat(60));
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`🔧 Mode: ${config.useMockData ? '🧪 MOCK DATA' : '☁️  PRODUCTION (BigQuery)'}`);
  console.log(`📊 Project: ${config.gcpProjectId || 'N/A'}`);
  console.log(`🏥 Health: http://localhost:${PORT}/health`);
  console.log(`💬 Endpoint: POST http://localhost:${PORT}/devAssistant`);
  console.log('='.repeat(60) + '\n');
  
  if (config.useMockData) {
    console.log('💡 TIP: Set USE_MOCK_DATA=false to use real BigQuery logs\n');
  }
});

// Export for Genkit CLI
export default ai;

