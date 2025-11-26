/**
 * Test factories for terminal session types.
 */
import { faker } from '@faker-js/faker';
import type {
  TerminalSession,
  SessionStatus,
  CommandHistoryEntry,
  CreateSessionResponse,
  GetSessionResponse,
  SessionStats,
  SSEEvent,
  SSEEventType,
} from '../../types/terminal.types';

/**
 * Creates a mock CommandHistoryEntry.
 */
export const createCommandHistoryEntry = (
  overrides: Partial<CommandHistoryEntry> = {}
): CommandHistoryEntry => ({
  commandId: overrides.commandId ?? faker.string.uuid(),
  command: overrides.command ?? 'ls -la',
  timestamp: overrides.timestamp ?? Date.now(),
  exitCode: overrides.exitCode ?? 0,
  duration: overrides.duration ?? faker.number.int({ min: 10, max: 500 }),
  ...overrides,
});

/**
 * Creates a mock TerminalSession.
 */
export const createTerminalSession = (
  overrides: Partial<TerminalSession> = {}
): TerminalSession => ({
  sessionId: overrides.sessionId ?? faker.string.uuid(),
  sandboxId: overrides.sandboxId ?? faker.string.uuid(),
  status: overrides.status ?? 'active',
  createdAt: overrides.createdAt ?? Date.now(),
  lastActivityAt: overrides.lastActivityAt ?? Date.now(),
  commandHistory: overrides.commandHistory ?? [],
  ...overrides,
});

/**
 * Creates a mock CreateSessionResponse.
 */
export const createCreateSessionResponse = (
  overrides: Partial<CreateSessionResponse> = {}
): CreateSessionResponse => ({
  sessionId: overrides.sessionId ?? faker.string.uuid(),
  sandboxId: overrides.sandboxId ?? faker.string.uuid(),
  status: overrides.status ?? 'active',
  createdAt: overrides.createdAt ?? Date.now(),
  expiresIn: overrides.expiresIn ?? 1800000, // 30 minutes
  ...overrides,
});

/**
 * Creates a mock GetSessionResponse.
 */
export const createGetSessionResponse = (
  overrides: Partial<GetSessionResponse> = {}
): GetSessionResponse => {
  const createdAt = overrides.createdAt ?? Date.now() - 60000;
  return {
    sessionId: overrides.sessionId ?? faker.string.uuid(),
    sandboxId: overrides.sandboxId ?? faker.string.uuid(),
    status: overrides.status ?? 'active',
    createdAt,
    lastActivityAt: overrides.lastActivityAt ?? Date.now(),
    commandHistory: overrides.commandHistory ?? [],
    uptime: overrides.uptime ?? Date.now() - createdAt,
    ...overrides,
  };
};

/**
 * Creates a mock SessionStats.
 */
export const createSessionStats = (
  overrides: Partial<SessionStats> = {}
): SessionStats => ({
  totalSessions: overrides.totalSessions ?? 10,
  activeSessions: overrides.activeSessions ?? 3,
  idleSessions: overrides.idleSessions ?? 2,
  destroyedSessions: overrides.destroyedSessions ?? 5,
  totalCommands: overrides.totalCommands ?? 100,
  connectedClients: overrides.connectedClients ?? 2,
  ...overrides,
});

/**
 * Creates a mock SSEEvent.
 */
export const createSSEEvent = (
  type: SSEEventType = 'output',
  data: unknown = { content: 'test output' }
): SSEEvent => ({
  type,
  data,
  timestamp: Date.now(),
});

/**
 * Creates a session with history for testing.
 */
export const createSessionWithHistory = (
  historyCount = 3
): TerminalSession => {
  const history = Array.from({ length: historyCount }, (_, i) =>
    createCommandHistoryEntry({ command: `command-${i + 1}` })
  );
  return createTerminalSession({ commandHistory: history });
};

/**
 * Session status options for testing.
 */
export const SESSION_STATUSES: SessionStatus[] = ['active', 'idle', 'destroyed'];
