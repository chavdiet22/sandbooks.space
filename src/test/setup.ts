import { afterEach, afterAll, beforeAll, vi, expect } from 'vitest';
import { cleanup, configure } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as matchers from 'vitest-axe/matchers';
import { setupServer } from 'msw/node';
import { handlers } from './mocks/handlers';

// Extend Vitest matchers with axe accessibility matchers
expect.extend(matchers);

// Configure React Testing Library to suppress act() warnings
configure({
  testIdAttribute: 'data-testid',
  // Suppress act() warnings by default
  asyncUtilTimeout: 5000,
});

// Setup MSW server for API mocking
export const server = setupServer(...handlers);

// Start MSW server before all tests
beforeAll(() => {
  server.listen({
    onUnhandledRequest: 'warn', // Warn about unhandled requests
  });
});

// Reset handlers after each test to ensure test isolation
afterEach(() => {
  server.resetHandlers();
  cleanup();
});

// Close server after all tests
afterAll(() => {
  server.close();
});

// Suppress expected console output in tests
const originalError = console.error;
const originalWarn = console.warn;
const originalLog = console.log;

// Suppress expected error logs from error handling paths
// These are legitimate - we're testing error handlers, not hiding bugs
console.error = vi.fn((...args) => {
  const message = String(args[0] || '');
  const expectedErrors = [
    // Error handler tests
    'Failed to save note',
    'Failed to update note',
    'Failed to delete note',
    'Failed to import notes',
    'Execution failed',
    'Failed to process queued execution',
    'Auto-heal failed',
    'Failed to initialize global terminal session',
    'Failed to connect to local folder',
    'Failed to restore offline queue',
    'Service Worker registration error',
    // Terminal SSE errors are expected in tests (mocked connections)
    '[TerminalService] SSE connection error',
  ];

  if (expectedErrors.some(err => message.includes(err))) {
    return;
  }
  originalError(...args);
});

// Suppress expected warnings
console.warn = vi.fn((...args) => {
  const message = String(args[0] || '');
  if (
    // Queue test edge case
    message.includes('not found for queued execution') ||
    // Happy-dom limitation with React act() - properly handled with waitFor/act
    message.includes('not configured to support act') ||
    message.includes('The current testing environment is not configured to support act') ||
    // KaTeX library warnings - can't fix, happy-dom doesn't fully emulate browser
    message.includes('No quirks-mode-compatible') ||
    message.includes('KaTeX')
  ) {
    return;
  }
  originalWarn(...args);
});

// Also suppress React's internal warnings via process.stderr if available
if (typeof process !== 'undefined' && process.stderr) {
  const originalStderrWrite = process.stderr.write.bind(process.stderr);
  process.stderr.write = function(chunk: string | Uint8Array, ...args: unknown[]) {
    if (typeof chunk === 'string' && chunk.includes('not configured to support act')) {
      return true;
    }
    return originalStderrWrite(chunk, ...args);
  };
}

// Suppress expected debug logs
console.log = vi.fn((...args) => {
  const message = String(args[0] || '');
  // PWA service worker logs during tests
  if (message.includes('[PWA]')) {
    return;
  }
  originalLog(...args);
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver (needed for some components)
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: MockResizeObserver,
});

// Mock IntersectionObserver (needed for virtualized lists)
class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  root = null;
  rootMargin = '';
  thresholds = [];
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: MockIntersectionObserver,
});
