/**
 * CloudExecutionProvider tests.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CloudExecutionProvider, cloudExecutionProvider } from '../cloudProvider';

// Mock hopxService
vi.mock('../../hopx', () => ({
  hopxService: {
    executeCode: vi.fn(),
    cleanup: vi.fn(),
  },
}));

import { hopxService } from '../../hopx';

describe('CloudExecutionProvider', () => {
  let provider: CloudExecutionProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new CloudExecutionProvider();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('static properties', () => {
    it('has correct provider name', () => {
      expect(provider.provider).toBe('cloud');
    });

    it('has correct display name', () => {
      expect(provider.name).toBe('Cloud Execution (Hopx)');
    });
  });

  describe('isAvailable', () => {
    it('returns true (cloud is always available)', async () => {
      const result = await provider.isAvailable();
      expect(result).toBe(true);
    });
  });

  describe('executeCode', () => {
    it('delegates to hopxService', async () => {
      const mockResult = { output: 'Hello', exitCode: 0 };
      vi.mocked(hopxService.executeCode).mockResolvedValue(mockResult);

      const result = await provider.executeCode('print("Hello")', 'python');

      expect(hopxService.executeCode).toHaveBeenCalledWith('print("Hello")', 'python');
      expect(result).toEqual(mockResult);
    });

    it('passes through errors from hopxService', async () => {
      vi.mocked(hopxService.executeCode).mockRejectedValue(new Error('Execution failed'));

      await expect(provider.executeCode('code', 'python')).rejects.toThrow('Execution failed');
    });
  });

  describe('getHealth', () => {
    it('returns healthy status', async () => {
      const result = await provider.getHealth();

      expect(result.isHealthy).toBe(true);
      expect(result.message).toBe('Cloud execution available');
    });
  });

  describe('cleanup', () => {
    it('delegates to hopxService cleanup', async () => {
      vi.mocked(hopxService.cleanup).mockResolvedValue(undefined);

      await provider.cleanup();

      expect(hopxService.cleanup).toHaveBeenCalled();
    });
  });

  describe('singleton instance', () => {
    it('exports a singleton instance', () => {
      expect(cloudExecutionProvider).toBeInstanceOf(CloudExecutionProvider);
    });
  });
});
