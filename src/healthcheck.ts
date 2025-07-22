#!/usr/bin/env node

/**
 * Health check script for Docker container
 * This script is used by Docker's HEALTHCHECK instruction
 */

import http from 'http';

const options = {
  hostname: 'localhost',
  port: process.env.PORT || 3000,
  path: '/api/health',
  timeout: 2000,
};

const healthCheck = http.request(options, (res) => {
  console.log(`Health check status: ${res.statusCode}`);
  
  if (res.statusCode === 200) {
    process.exit(0); // Success
  } else {
    process.exit(1); // Failure
  }
});

healthCheck.on('error', (error) => {
  console.error('Health check failed:', error.message);
  process.exit(1); // Failure
});

healthCheck.on('timeout', () => {
  console.error('Health check timed out');
  healthCheck.destroy();
  process.exit(1); // Failure
});

healthCheck.end(); 