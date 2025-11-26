/**
 * Test factories for Terminal-related types.
 */
import { faker } from '@faker-js/faker';

/**
 * Terminal session status types.
 */
export type TerminalSessionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

/**
 * Mock terminal session response from API.
 */
export interface MockTerminalSession {
  sessionId: string;
  status: TerminalSessionStatus;
  workingDir?: string;
  createdAt?: string;
}

/**
 * Creates a mock terminal session.
 */
export const createTerminalSession = (
  overrides: Partial<MockTerminalSession> = {}
): MockTerminalSession => ({
  sessionId: overrides.sessionId ?? faker.string.uuid(),
  status: overrides.status ?? 'connected',
  workingDir: overrides.workingDir ?? '/home/user',
  createdAt: overrides.createdAt ?? new Date().toISOString(),
  ...overrides,
});

/**
 * Creates terminal output data.
 */
export const createTerminalOutput = (
  type: 'stdout' | 'stderr' = 'stdout',
  data = 'Hello from terminal\r\n'
): { type: string; data: string } => ({
  type,
  data,
});

/**
 * Creates a mock SSE event for terminal streaming.
 */
export const createSSEEvent = (
  eventType: 'output' | 'status' | 'error' | 'heartbeat',
  data: unknown = {}
): string => {
  const payload = JSON.stringify(data);
  return `event: ${eventType}\ndata: ${payload}\n\n`;
};

/**
 * Creates terminal resize dimensions.
 */
export const createTerminalDimensions = (
  cols = 80,
  rows = 24
): { cols: number; rows: number } => ({
  cols,
  rows,
});

/**
 * Creates a terminal input payload.
 */
export const createTerminalInput = (data: string): { data: string } => ({
  data,
});

/**
 * Mock terminal stats response.
 */
export interface MockTerminalStats {
  activeSessions: number;
  totalCreated: number;
  totalDestroyed: number;
}

/**
 * Creates mock terminal statistics.
 */
export const createTerminalStats = (
  overrides: Partial<MockTerminalStats> = {}
): MockTerminalStats => ({
  activeSessions: overrides.activeSessions ?? 1,
  totalCreated: overrides.totalCreated ?? 10,
  totalDestroyed: overrides.totalDestroyed ?? 9,
  ...overrides,
});
