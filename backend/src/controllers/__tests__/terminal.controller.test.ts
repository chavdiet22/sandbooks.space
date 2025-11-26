/**
 * Terminal controller unit tests.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createSession,
  getSession,
  destroySession,
  sendInput,
  executeCommand,
  resizeTerminal,
  getStats,
  manualCleanup,
} from '../terminal.controller';
import terminalSessionManager from '../../services/terminalSessionManager';
import { SessionNotFoundError, SessionDestroyedError } from '../../types/terminal.types';
import {
  createMockRequestContext,
  createTerminalSession,
  createSessionStats,
  createCommandHistoryEntry,
} from '../../test/factories';

// Mock the terminal session manager
vi.mock('../../services/terminalSessionManager', () => ({
  default: {
    createSession: vi.fn(),
    getSession: vi.fn(),
    destroySession: vi.fn(),
    sendInput: vi.fn(),
    resize: vi.fn(),
    getStats: vi.fn(),
    cleanupInactiveSessions: vi.fn(),
    registerSSEClient: vi.fn(),
  },
}));

// Mock logger
vi.mock('../../utils/logger', () => ({
  default: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('terminal.controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createSession', () => {
    it('should create session successfully and return 201', async () => {
      const mockSession = createTerminalSession();
      vi.mocked(terminalSessionManager.createSession).mockResolvedValue(mockSession);

      const { req, res, next } = createMockRequestContext({
        body: { metadata: { userId: 'user-123' } },
      });

      await createSession(req as never, res as never, next);

      expect(terminalSessionManager.createSession).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        sessionId: mockSession.sessionId,
        sandboxId: mockSession.sandboxId,
        status: mockSession.status,
        createdAt: mockSession.createdAt,
        expiresIn: 30 * 60 * 1000,
      });
    });

    it('should accept empty metadata', async () => {
      const mockSession = createTerminalSession();
      vi.mocked(terminalSessionManager.createSession).mockResolvedValue(mockSession);

      const { req, res, next } = createMockRequestContext({
        body: {},
      });

      await createSession(req as never, res as never, next);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should validate request schema and reject invalid metadata', async () => {
      const { req, res, next } = createMockRequestContext({
        body: { metadata: 'invalid' },
      });

      await createSession(req as never, res as never, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(terminalSessionManager.createSession).not.toHaveBeenCalled();
    });

    it('should call next with error when session creation fails', async () => {
      const error = new Error('Failed to create sandbox');
      vi.mocked(terminalSessionManager.createSession).mockRejectedValue(error);

      const { req, res, next } = createMockRequestContext({ body: {} });

      await createSession(req as never, res as never, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getSession', () => {
    it('should return session details successfully', async () => {
      const mockSession = createTerminalSession({
        commandHistory: [createCommandHistoryEntry()],
      });
      vi.mocked(terminalSessionManager.getSession).mockReturnValue(mockSession);

      const { req, res, next } = createMockRequestContext({
        params: { sessionId: mockSession.sessionId },
      });

      await getSession(req as never, res as never, next);

      expect(terminalSessionManager.getSession).toHaveBeenCalledWith(mockSession.sessionId);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: mockSession.sessionId,
          sandboxId: mockSession.sandboxId,
          status: mockSession.status,
          uptime: expect.any(Number),
        })
      );
    });

    it('should return validation error when sessionId is missing', async () => {
      const { req, res, next } = createMockRequestContext({
        params: {},
      });

      await getSession(req as never, res as never, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle SessionNotFoundError', async () => {
      const error = new SessionNotFoundError('nonexistent-session');
      vi.mocked(terminalSessionManager.getSession).mockImplementation(() => {
        throw error;
      });

      const { req, res, next } = createMockRequestContext({
        params: { sessionId: 'nonexistent-session' },
      });

      await getSession(req as never, res as never, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it('should handle SessionDestroyedError', async () => {
      const error = new SessionDestroyedError('destroyed-session');
      vi.mocked(terminalSessionManager.getSession).mockImplementation(() => {
        throw error;
      });

      const { req, res, next } = createMockRequestContext({
        params: { sessionId: 'destroyed-session' },
      });

      await getSession(req as never, res as never, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('destroySession', () => {
    it('should destroy session successfully', async () => {
      vi.mocked(terminalSessionManager.destroySession).mockResolvedValue(undefined);

      const { req, res, next } = createMockRequestContext({
        params: { sessionId: 'session-123' },
      });

      await destroySession(req as never, res as never, next);

      expect(terminalSessionManager.destroySession).toHaveBeenCalledWith('session-123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Session destroyed successfully',
        sessionId: 'session-123',
      });
    });

    it('should return validation error when sessionId is missing', async () => {
      const { req, res, next } = createMockRequestContext({
        params: {},
      });

      await destroySession(req as never, res as never, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle SessionNotFoundError', async () => {
      const error = new SessionNotFoundError('nonexistent');
      vi.mocked(terminalSessionManager.destroySession).mockRejectedValue(error);

      const { req, res, next } = createMockRequestContext({
        params: { sessionId: 'nonexistent' },
      });

      await destroySession(req as never, res as never, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('sendInput', () => {
    it('should send input successfully', async () => {
      vi.mocked(terminalSessionManager.sendInput).mockResolvedValue(undefined);

      const { req, res, next } = createMockRequestContext({
        params: { sessionId: 'session-123' },
        body: { data: 'ls -la\n' },
      });

      await sendInput(req as never, res as never, next);

      expect(terminalSessionManager.sendInput).toHaveBeenCalledWith('session-123', 'ls -la\n');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ status: 'sent' });
    });

    it('should return validation error when sessionId is missing', async () => {
      const { req, res, next } = createMockRequestContext({
        params: {},
        body: { data: 'test' },
      });

      await sendInput(req as never, res as never, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should return validation error when data is missing', async () => {
      const { req, res, next } = createMockRequestContext({
        params: { sessionId: 'session-123' },
        body: {},
      });

      await sendInput(req as never, res as never, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should return validation error when data is not a string', async () => {
      const { req, res, next } = createMockRequestContext({
        params: { sessionId: 'session-123' },
        body: { data: 123 },
      });

      await sendInput(req as never, res as never, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle SessionNotFoundError', async () => {
      const error = new SessionNotFoundError('nonexistent');
      vi.mocked(terminalSessionManager.sendInput).mockRejectedValue(error);

      const { req, res, next } = createMockRequestContext({
        params: { sessionId: 'nonexistent' },
        body: { data: 'test' },
      });

      await sendInput(req as never, res as never, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('executeCommand (deprecated)', () => {
    it('should redirect to sendInput with newline appended', async () => {
      vi.mocked(terminalSessionManager.sendInput).mockResolvedValue(undefined);

      const { req, res, next } = createMockRequestContext({
        params: { sessionId: 'session-123' },
        body: { command: 'ls -la' },
      });

      await executeCommand(req as never, res as never, next);

      expect(terminalSessionManager.sendInput).toHaveBeenCalledWith('session-123', 'ls -la\n');
      expect(res.status).toHaveBeenCalledWith(202);
      expect(res.json).toHaveBeenCalledWith({
        commandId: expect.any(String),
        status: 'started',
        message: 'Command sent to terminal',
      });
    });

    it('should validate command is not empty', async () => {
      const { req, res, next } = createMockRequestContext({
        params: { sessionId: 'session-123' },
        body: { command: '' },
      });

      await executeCommand(req as never, res as never, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should validate command is not too long', async () => {
      const { req, res, next } = createMockRequestContext({
        params: { sessionId: 'session-123' },
        body: { command: 'a'.repeat(10001) },
      });

      await executeCommand(req as never, res as never, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('resizeTerminal', () => {
    it('should resize terminal successfully', async () => {
      vi.mocked(terminalSessionManager.resize).mockResolvedValue(undefined);

      const { req, res, next } = createMockRequestContext({
        params: { sessionId: 'session-123' },
        body: { cols: 120, rows: 40 },
      });

      await resizeTerminal(req as never, res as never, next);

      expect(terminalSessionManager.resize).toHaveBeenCalledWith('session-123', 120, 40);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Terminal resized',
        cols: 120,
        rows: 40,
      });
    });

    it('should reject dimensions below minimum (20x10)', async () => {
      const { req, res, next } = createMockRequestContext({
        params: { sessionId: 'session-123' },
        body: { cols: 10, rows: 5 },
      });

      await resizeTerminal(req as never, res as never, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(terminalSessionManager.resize).not.toHaveBeenCalled();
    });

    it('should reject missing cols/rows', async () => {
      const { req, res, next } = createMockRequestContext({
        params: { sessionId: 'session-123' },
        body: { cols: 80 }, // missing rows
      });

      await resizeTerminal(req as never, res as never, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getStats', () => {
    it('should return session statistics', () => {
      const mockStats = createSessionStats();
      vi.mocked(terminalSessionManager.getStats).mockReturnValue(mockStats);

      const { req, res, next } = createMockRequestContext();

      getStats(req as never, res as never, next);

      expect(terminalSessionManager.getStats).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockStats);
    });

    it('should handle errors and call next', () => {
      const error = new Error('Stats unavailable');
      vi.mocked(terminalSessionManager.getStats).mockImplementation(() => {
        throw error;
      });

      const { req, res, next } = createMockRequestContext();

      getStats(req as never, res as never, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('manualCleanup', () => {
    it('should trigger cleanup and return results', async () => {
      const mockResult = { cleanedSessions: 3, errors: [] };
      vi.mocked(terminalSessionManager.cleanupInactiveSessions).mockResolvedValue(mockResult);

      const { req, res, next } = createMockRequestContext();

      await manualCleanup(req as never, res as never, next);

      expect(terminalSessionManager.cleanupInactiveSessions).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Cleanup completed',
        cleanedSessions: 3,
        errors: [],
      });
    });

    it('should return cleanup errors if any', async () => {
      const mockResult = {
        cleanedSessions: 2,
        errors: [{ sessionId: 'session-1', error: 'Failed to destroy' }],
      };
      vi.mocked(terminalSessionManager.cleanupInactiveSessions).mockResolvedValue(mockResult);

      const { req, res, next } = createMockRequestContext();

      await manualCleanup(req as never, res as never, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: expect.arrayContaining([
            expect.objectContaining({ sessionId: 'session-1' }),
          ]),
        })
      );
    });

    it('should handle cleanup errors', async () => {
      const error = new Error('Cleanup failed');
      vi.mocked(terminalSessionManager.cleanupInactiveSessions).mockRejectedValue(error);

      const { req, res, next } = createMockRequestContext();

      await manualCleanup(req as never, res as never, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
