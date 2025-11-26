/**
 * Sandbox controller unit tests.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  recreateSandbox,
  getHealth,
  getSandboxStatus,
  destroySandbox,
} from '../sandbox.controller';
import hopxService from '../../services/hopx.service';
import { createMockRequestContext } from '../../test/factories';

// Mock the hopx service
vi.mock('../../services/hopx.service', () => ({
  default: {
    forceRecreateSandbox: vi.fn(),
    getHealth: vi.fn(),
    getSandboxInfo: vi.fn(),
    destroySandbox: vi.fn(),
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

describe('sandbox.controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('recreateSandbox', () => {
    it('should recreate sandbox successfully and return 200', async () => {
      const mockResult = { sandboxId: 'new-sandbox-123' };
      vi.mocked(hopxService.forceRecreateSandbox).mockResolvedValue(mockResult);

      const { req, res, next } = createMockRequestContext();

      await recreateSandbox(req as never, res as never, next);

      expect(hopxService.forceRecreateSandbox).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        sandboxId: 'new-sandbox-123',
        message: 'Sandbox recreated successfully',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error when recreation fails', async () => {
      const error = new Error('Failed to create sandbox');
      vi.mocked(hopxService.forceRecreateSandbox).mockRejectedValue(error);

      const { req, res, next } = createMockRequestContext();

      await recreateSandbox(req as never, res as never, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should handle API key errors', async () => {
      const error = new Error('Invalid API key');
      vi.mocked(hopxService.forceRecreateSandbox).mockRejectedValue(error);

      const { req, res, next } = createMockRequestContext();

      await recreateSandbox(req as never, res as never, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getHealth', () => {
    it('should return health status successfully', async () => {
      const mockHealth = {
        status: 'healthy',
        isHealthy: true,
        sandboxId: 'sandbox-123',
        uptime: 60000,
      };
      vi.mocked(hopxService.getHealth).mockResolvedValue(mockHealth);

      const { req, res, next } = createMockRequestContext();

      await getHealth(req as never, res as never, next);

      expect(hopxService.getHealth).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        health: mockHealth,
      });
    });

    it('should return unhealthy status on error without failing request', async () => {
      const error = new Error('Health check failed');
      vi.mocked(hopxService.getHealth).mockRejectedValue(error);

      const { req, res, next } = createMockRequestContext();

      await getHealth(req as never, res as never, next);

      // Should still return 200, not call next with error
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        health: {
          status: 'unknown',
          isHealthy: false,
          error: 'Health check failed',
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle unknown error types gracefully', async () => {
      vi.mocked(hopxService.getHealth).mockRejectedValue('String error');

      const { req, res, next } = createMockRequestContext();

      await getHealth(req as never, res as never, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        health: expect.objectContaining({
          isHealthy: false,
        }),
      });
    });
  });

  describe('getSandboxStatus', () => {
    it('should return sandbox info successfully', async () => {
      const mockInfo = {
        sandboxId: 'sandbox-123',
        status: 'running',
        resources: { memory: 512, cpu: 1 },
      };
      vi.mocked(hopxService.getSandboxInfo).mockResolvedValue(mockInfo);

      const { req, res, next } = createMockRequestContext();

      await getSandboxStatus(req as never, res as never, next);

      expect(hopxService.getSandboxInfo).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        sandbox: mockInfo,
      });
    });

    it('should call next with error when getting info fails', async () => {
      const error = new Error('Sandbox not found');
      vi.mocked(hopxService.getSandboxInfo).mockRejectedValue(error);

      const { req, res, next } = createMockRequestContext();

      await getSandboxStatus(req as never, res as never, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('destroySandbox', () => {
    it('should destroy sandbox successfully', async () => {
      vi.mocked(hopxService.destroySandbox).mockResolvedValue(undefined);

      const { req, res, next } = createMockRequestContext();

      await destroySandbox(req as never, res as never, next);

      expect(hopxService.destroySandbox).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Sandbox destroyed successfully',
      });
    });

    it('should call next with error when destruction fails', async () => {
      const error = new Error('Failed to destroy sandbox');
      vi.mocked(hopxService.destroySandbox).mockRejectedValue(error);

      const { req, res, next } = createMockRequestContext();

      await destroySandbox(req as never, res as never, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it('should handle case when sandbox does not exist', async () => {
      const error = new Error('No sandbox to destroy');
      vi.mocked(hopxService.destroySandbox).mockRejectedValue(error);

      const { req, res, next } = createMockRequestContext();

      await destroySandbox(req as never, res as never, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
