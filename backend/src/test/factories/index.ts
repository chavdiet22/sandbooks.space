/**
 * Backend test factories barrel export.
 */

// Request/Response factories
export {
  createMockRequest,
  createMockResponse,
  createMockNext,
  createMockRequestContext,
} from './request.factory';

// Execution factories
export {
  createExecuteRequest,
  createExecuteResponse,
  createErrorExecuteResponse,
  createTimeoutExecuteResponse,
  codeSamples,
} from './execution.factory';

// Terminal factories
export {
  createCommandHistoryEntry,
  createTerminalSession,
  createCreateSessionResponse,
  createGetSessionResponse,
  createSessionStats,
  createSSEEvent,
  createSessionWithHistory,
  SESSION_STATUSES,
} from './terminal.factory';
