/**
 * Execute controller unit tests.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeCode, healthCheck } from '../execute.controller';
import hopxService from '../../services/hopx.service';
import {
  createMockRequestContext,
  createExecuteRequest,
  createExecuteResponse,
} from '../../test/factories';

// Mock the hopx service
vi.mock('../../services/hopx.service', () => ({
  default: {
    executeCode: vi.fn(),
  },
}));

// Mock logger to avoid console noise
vi.mock('../../utils/logger', () => ({
  default: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('execute.controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('executeCode', () => {
    it('should execute code successfully and return 200', async () => {
      const mockResult = createExecuteResponse({ stdout: 'Hello World\n' });
      vi.mocked(hopxService.executeCode).mockResolvedValue(mockResult);

      const request = createExecuteRequest({ code: 'print("Hello World")', language: 'python' });
      const { req, res, next } = createMockRequestContext({ body: request });

      await executeCode(req as never, res as never, next);

      expect(hopxService.executeCode).toHaveBeenCalledWith(
        'print("Hello World")',
        'python',
        { timeout: undefined }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        ...mockResult,
        sandboxStatus: 'healthy',
        recoverable: true,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should pass timeout to hopx service when provided', async () => {
      const mockResult = createExecuteResponse();
      vi.mocked(hopxService.executeCode).mockResolvedValue(mockResult);

      const request = createExecuteRequest({ code: 'time.sleep(5)', language: 'python', timeout: 10000 });
      const { req, res, next } = createMockRequestContext({ body: request });

      await executeCode(req as never, res as never, next);

      expect(hopxService.executeCode).toHaveBeenCalledWith(
        'time.sleep(5)',
        'python',
        { timeout: 10000 }
      );
    });

    it('should handle different languages', async () => {
      const mockResult = createExecuteResponse({ stdout: 'Hello' });
      vi.mocked(hopxService.executeCode).mockResolvedValue(mockResult);

      const languages = ['python', 'javascript', 'typescript', 'bash', 'go'] as const;

      for (const language of languages) {
        const request = createExecuteRequest({ language });
        const { req, res, next } = createMockRequestContext({ body: request });

        await executeCode(req as never, res as never, next);

        expect(hopxService.executeCode).toHaveBeenLastCalledWith(
          expect.any(String),
          language,
          expect.any(Object)
        );
      }
    });

    it('should call next with error when hopx service fails', async () => {
      const error = new Error('Sandbox unavailable');
      vi.mocked(hopxService.executeCode).mockRejectedValue(error);

      const request = createExecuteRequest();
      const { req, res, next } = createMockRequestContext({ body: request });

      await executeCode(req as never, res as never, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should handle execution timeout errors', async () => {
      const timeoutError = new Error('Execution timeout');
      vi.mocked(hopxService.executeCode).mockRejectedValue(timeoutError);

      const request = createExecuteRequest({ timeout: 1000 });
      const { req, res, next } = createMockRequestContext({ body: request });

      await executeCode(req as never, res as never, next);

      expect(next).toHaveBeenCalledWith(timeoutError);
    });

    it('should handle execution with rich outputs', async () => {
      const mockResult = createExecuteResponse({
        stdout: '',
        richOutputs: [
          { type: 'image', data: 'base64data', mimeType: 'image/png' },
        ],
      });
      vi.mocked(hopxService.executeCode).mockResolvedValue(mockResult);

      const request = createExecuteRequest({ code: 'import matplotlib; plt.show()' });
      const { req, res, next } = createMockRequestContext({ body: request });

      await executeCode(req as never, res as never, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          richOutputs: expect.arrayContaining([
            expect.objectContaining({ type: 'image' }),
          ]),
        })
      );
    });

    it('should handle stderr in successful response', async () => {
      const mockResult = createExecuteResponse({
        stdout: 'Output',
        stderr: 'Warning: deprecated function',
        exitCode: 0,
      });
      vi.mocked(hopxService.executeCode).mockResolvedValue(mockResult);

      const request = createExecuteRequest();
      const { req, res, next } = createMockRequestContext({ body: request });

      await executeCode(req as never, res as never, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          stdout: 'Output',
          stderr: 'Warning: deprecated function',
        })
      );
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status with timestamp', () => {
      const { req, res } = createMockRequestContext();

      healthCheck(req as never, res as never);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'healthy',
        timestamp: expect.any(String),
        service: 'sandbooks-backend',
      });
    });

    it('should return ISO timestamp format', () => {
      const { req, res } = createMockRequestContext();

      healthCheck(req as never, res as never);

      const jsonCall = vi.mocked(res.json).mock.calls[0][0] as { timestamp: string };
      const timestamp = new Date(jsonCall.timestamp);
      expect(timestamp.toISOString()).toBe(jsonCall.timestamp);
    });
  });
});
