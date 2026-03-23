// ==================== Test Setup ====================
// Vitest 测试环境配置

import { beforeAll, afterAll, vi } from 'vitest';

// Mock console methods to reduce noise during tests
const originalConsole = { ...console };

beforeAll(() => {
  // Suppress console output in tests unless DEBUG is set
  if (!process.env.DEBUG) {
    console.log = vi.fn();
    console.info = vi.fn();
    console.debug = vi.fn();
  }
  console.warn = vi.fn((message: string) => {
    // Still show warnings but not all info messages
    if (message.includes('[WARN]') || message.includes('Warning')) {
      originalConsole.warn(message);
    }
  });
});

afterAll(() => {
  // Restore console
  console.log = originalConsole.log;
  console.info = originalConsole.info;
  console.debug = originalConsole.debug;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
});

// Global test utilities
export const mockSession = {
  user: {
    id: 'test-user-id',
    tenantId: 'test-tenant-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'admin' as const,
  },
};

// Helper to create mock auth session
export function createMockSession(overrides?: Partial<typeof mockSession>) {
  return {
    ...mockSession,
    ...overrides,
  };
}
