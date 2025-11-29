/**
 * Configuration management for AI DevOps Assistant
 * Handles environment variables and GCP settings
 */

// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

export const config = {
  // GCP Settings
  gcpProjectId: process.env.GCP_PROJECT_ID || '',
  gcpRegion: process.env.GCP_REGION || 'us-central1',
  
  // BigQuery Settings
  get bigQueryDataset() {
    return `${this.gcpProjectId}.global._Default`;
  },
  
  get bigQueryTable() {
    return `${this.bigQueryDataset}._AllLogs`;
  },
  
  // Feature Flags
  useMockData: process.env.USE_MOCK_DATA === 'true',
  
  // Server Settings
  port: parseInt(process.env.PORT || '3400', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Validation
  isValid(): boolean {
    if (this.useMockData) {
      console.log('✓ Running in MOCK mode - no GCP credentials needed');
      return true;
    }
    
    if (!this.gcpProjectId) {
      console.error('✗ GCP_PROJECT_ID is required when USE_MOCK_DATA=false');
      return false;
    }
    
    console.log(`✓ GCP Project: ${this.gcpProjectId}`);
    console.log(`✓ BigQuery Table: ${this.bigQueryTable}`);
    return true;
  }
};

// Validate on load
if (!config.isValid()) {
  console.error('\n⚠️  Configuration Error!');
  console.error('Set USE_MOCK_DATA=true for local testing without GCP');
  console.error('Or set GCP_PROJECT_ID for production mode\n');
}

