/**
 * Notebook controller unit tests.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { faker } from '@faker-js/faker';
import {
  executeCell,
  getSessionInfo,
  getAllSessions,
  restartKernel,
  destroySession,
} from '../notebook.controller';
import notebookKernelService from '../../services/notebookKernelService';
import { HopxError } from '../../utils/errors';
import { createMockRequestContext } from '../../test/factories';

// Mock the notebook kernel service
vi.mock('../../services/notebookKernelService', () => ({
  default: {
    executeCell: vi.fn(),
    getSessionInfo: vi.fn(),
    getAllSessionsInfo: vi.fn(),
    restartKernel: vi.fn(),
    destroySession: vi.fn(),
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

describe('notebook.controller', () => {
  const noteId = faker.string.uuid();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('executeCell', () => {
    it('should execute cell successfully and return 200', async () => {
      const mockResult = {
        stdout: 'Hello World\n',
        stderr: '',
        executionCount: 1,
      };
      vi.mocked(notebookKernelService.executeCell).mockResolvedValue(mockResult);

      const { req, res, next } = createMockRequestContext({
        params: { noteId },
        body: { code: 'print("Hello World")' },
      });

      await executeCell(req as never, res as never, next);

      expect(notebookKernelService.executeCell).toHaveBeenCalledWith(
        noteId,
        'print("Hello World")'
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle empty code', async () => {
      const mockResult = { stdout: '', stderr: '', executionCount: 1 };
      vi.mocked(notebookKernelService.executeCell).mockResolvedValue(mockResult);

      const { req, res, next } = createMockRequestContext({
        params: { noteId },
        body: { code: '' },
      });

      await executeCell(req as never, res as never, next);

      expect(notebookKernelService.executeCell).toHaveBeenCalledWith(noteId, '');
    });

    it('should wrap sandbox errors as HopxError', async () => {
      const error = new Error('sandbox connection failed');
      vi.mocked(notebookKernelService.executeCell).mockRejectedValue(error);

      const { req, res, next } = createMockRequestContext({
        params: { noteId },
        body: { code: 'print(1)' },
      });

      await executeCell(req as never, res as never, next);

      expect(next).toHaveBeenCalledWith(expect.any(HopxError));
    });

    it('should wrap timeout errors as HopxError', async () => {
      const error = new Error('Execution timeout exceeded');
      vi.mocked(notebookKernelService.executeCell).mockRejectedValue(error);

      const { req, res, next } = createMockRequestContext({
        params: { noteId },
        body: { code: 'while True: pass' },
      });

      await executeCell(req as never, res as never, next);

      expect(next).toHaveBeenCalledWith(expect.any(HopxError));
    });

    it('should wrap Hopx API errors as HopxError', async () => {
      const error = new Error('Hopx API unavailable');
      vi.mocked(notebookKernelService.executeCell).mockRejectedValue(error);

      const { req, res, next } = createMockRequestContext({
        params: { noteId },
        body: { code: 'x = 1' },
      });

      await executeCell(req as never, res as never, next);

      expect(next).toHaveBeenCalledWith(expect.any(HopxError));
    });

    it('should pass through non-Hopx errors', async () => {
      const error = new Error('Generic error');
      vi.mocked(notebookKernelService.executeCell).mockRejectedValue(error);

      const { req, res, next } = createMockRequestContext({
        params: { noteId },
        body: { code: 'x = 1' },
      });

      await executeCell(req as never, res as never, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it('should handle execution with rich output', async () => {
      const mockResult = {
        stdout: '',
        stderr: '',
        executionCount: 5,
        richOutputs: [
          { type: 'image', data: 'base64...', mimeType: 'image/png' },
        ],
      };
      vi.mocked(notebookKernelService.executeCell).mockResolvedValue(mockResult);

      const { req, res, next } = createMockRequestContext({
        params: { noteId },
        body: { code: 'plt.show()' },
      });

      await executeCell(req as never, res as never, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          richOutputs: expect.arrayContaining([
            expect.objectContaining({ type: 'image' }),
          ]),
        })
      );
    });
  });

  describe('getSessionInfo', () => {
    it('should return session info when session exists', () => {
      const mockSession = {
        noteId,
        executionCount: 10,
        createdAt: Date.now(),
        sandboxId: 'sandbox-123',
      };
      vi.mocked(notebookKernelService.getSessionInfo).mockReturnValue(mockSession);

      const { req, res } = createMockRequestContext({
        params: { noteId },
      });

      getSessionInfo(req as never, res as never);

      expect(notebookKernelService.getSessionInfo).toHaveBeenCalledWith(noteId);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockSession);
    });

    it('should return 404 when session does not exist', () => {
      vi.mocked(notebookKernelService.getSessionInfo).mockReturnValue(null);

      const { req, res } = createMockRequestContext({
        params: { noteId },
      });

      getSessionInfo(req as never, res as never);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'No kernel session found',
        noteId,
      });
    });

    it('should return undefined for undefined session', () => {
      vi.mocked(notebookKernelService.getSessionInfo).mockReturnValue(undefined);

      const { req, res } = createMockRequestContext({
        params: { noteId },
      });

      getSessionInfo(req as never, res as never);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getAllSessions', () => {
    it('should return all sessions with count', () => {
      const mockSessions = [
        { noteId: 'note-1', executionCount: 5 },
        { noteId: 'note-2', executionCount: 10 },
      ];
      vi.mocked(notebookKernelService.getAllSessionsInfo).mockReturnValue(mockSessions);

      const { req, res } = createMockRequestContext();

      getAllSessions(req as never, res as never);

      expect(notebookKernelService.getAllSessionsInfo).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        sessions: mockSessions,
        count: 2,
      });
    });

    it('should return empty array when no sessions exist', () => {
      vi.mocked(notebookKernelService.getAllSessionsInfo).mockReturnValue([]);

      const { req, res } = createMockRequestContext();

      getAllSessions(req as never, res as never);

      expect(res.json).toHaveBeenCalledWith({
        sessions: [],
        count: 0,
      });
    });
  });

  describe('restartKernel', () => {
    it('should restart kernel successfully', async () => {
      vi.mocked(notebookKernelService.restartKernel).mockResolvedValue(undefined);

      const { req, res, next } = createMockRequestContext({
        params: { noteId },
      });

      await restartKernel(req as never, res as never, next);

      expect(notebookKernelService.restartKernel).toHaveBeenCalledWith(noteId);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Kernel restarted',
        noteId,
      });
    });

    it('should handle errors and call next', async () => {
      const error = new Error('Failed to restart kernel');
      vi.mocked(notebookKernelService.restartKernel).mockRejectedValue(error);

      const { req, res, next } = createMockRequestContext({
        params: { noteId },
      });

      await restartKernel(req as never, res as never, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it('should handle kernel not found', async () => {
      const error = new Error('Kernel session not found');
      vi.mocked(notebookKernelService.restartKernel).mockRejectedValue(error);

      const { req, res, next } = createMockRequestContext({
        params: { noteId: 'nonexistent' },
      });

      await restartKernel(req as never, res as never, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('destroySession', () => {
    it('should destroy session successfully', async () => {
      vi.mocked(notebookKernelService.destroySession).mockResolvedValue(undefined);

      const { req, res, next } = createMockRequestContext({
        params: { noteId },
      });

      await destroySession(req as never, res as never, next);

      expect(notebookKernelService.destroySession).toHaveBeenCalledWith(noteId);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Session destroyed',
        noteId,
      });
    });

    it('should handle errors and call next', async () => {
      const error = new Error('Failed to destroy session');
      vi.mocked(notebookKernelService.destroySession).mockRejectedValue(error);

      const { req, res, next } = createMockRequestContext({
        params: { noteId },
      });

      await destroySession(req as never, res as never, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it('should handle already destroyed session', async () => {
      const error = new Error('Session already destroyed');
      vi.mocked(notebookKernelService.destroySession).mockRejectedValue(error);

      const { req, res, next } = createMockRequestContext({
        params: { noteId },
      });

      await destroySession(req as never, res as never, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
