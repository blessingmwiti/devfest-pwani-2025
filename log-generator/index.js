/**
 * Simple Log Generator Service
 * Generates realistic error logs to populate Log Analytics for demo
 */

const express = require('express');
const app = express();

const PORT = process.env.PORT || 8080;

// Sample error messages
const errorMessages = [
  { service: 'payment-service', message: 'Payment gateway timeout', severity: 'ERROR' },
  { service: 'checkout-service', message: 'Database connection pool exhausted', severity: 'ERROR' },
  { service: 'auth-service', message: 'JWT token validation failed', severity: 'ERROR' },
  { service: 'payment-service', message: 'Payment processor connection refused', severity: 'ERROR' },
  { service: 'api-gateway', message: 'Rate limit exceeded', severity: 'WARNING' },
  { service: 'checkout-service', message: 'Checkout validation failed', severity: 'ERROR' },
  { service: 'database-proxy', message: 'Slow query detected', severity: 'WARNING' },
  { service: 'auth-service', message: 'High latency on authentication endpoint', severity: 'WARNING' },
];

// Generate a random log entry
function generateLog() {
  const log = errorMessages[Math.floor(Math.random() * errorMessages.length)];
  const traceId = `trace-${Math.random().toString(36).substring(7)}`;
  
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    severity: log.severity,
    service: log.service,
    message: log.message,
    trace_id: traceId,
    environment: 'demo',
  }));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Endpoint that generates errors
app.get('/generate-error', (req, res) => {
  generateLog();
  res.json({ message: 'Error log generated' });
});

// Generate logs every 2 minutes
setInterval(() => {
  generateLog();
}, 2 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`Log Generator running on port ${PORT}`);
  console.log('Generating logs every 2 minutes...');
  
  // Generate initial log
  generateLog();
});

