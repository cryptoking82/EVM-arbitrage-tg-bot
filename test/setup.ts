/**
 * Test setup and configuration
 */

import 'reflect-metadata';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';

// Mock external services for testing
jest.mock('../src/services/telegram/bot', () => ({
  TelegramBot: jest.fn().mockImplementation(() => ({
    start: jest.fn(),
    stop: jest.fn(),
    sendMessage: jest.fn(),
    broadcast: jest.fn(),
    isAlive: jest.fn().mockReturnValue(true),
  })),
}));

jest.mock('../src/services/notification/service', () => ({
  NotificationService: jest.fn().mockImplementation(() => ({
    sendTelegramNotification: jest.fn(),
    sendEmailNotification: jest.fn(),
    sendSMSNotification: jest.fn(),
  })),
}));

// Increase timeout for integration tests
jest.setTimeout(30000);

// Global test helpers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidAddress(): R;
      toBeValidTransactionHash(): R;
    }
  }
}

// Custom matchers
expect.extend({
  toBeValidAddress(received: string) {
    const isValid = /^0x[a-fA-F0-9]{40}$/.test(received);
    return {
      message: () => `expected ${received} to be a valid Ethereum address`,
      pass: isValid,
    };
  },
  
  toBeValidTransactionHash(received: string) {
    const isValid = /^0x[a-fA-F0-9]{64}$/.test(received);
    return {
      message: () => `expected ${received} to be a valid transaction hash`,
      pass: isValid,
    };
  },
});

// Clean up after tests
afterAll(async () => {
  // Close any open connections, clean up resources
  await new Promise(resolve => setTimeout(resolve, 1000));
});

export {}; 