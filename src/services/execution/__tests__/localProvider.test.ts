/**
 * LocalExecutionProvider tests.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LocalExecutionProvider, localExecutionProvider } from '../localProvider';

// Mock platform utils
vi.mock('../../../utils/platform', () => ({
  isLocalExecutionSupported: vi.fn(),
}));

import { isLocalExecutionSupported } from '../../../utils/platform';

describe('LocalExecutionProvider', () => {
  let provider: LocalExecutionProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new LocalExecutionProvider();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('static properties', () => {
    it('has correct provider name', () => {
      expect(provider.provider).toBe('local');
    });

    it('has correct display name', () => {
      expect(provider.name).toBe('Local Execution');
    });
  });

  describe('isAvailable', () => {
    it('returns false (local code execution not available)', async () => {
      const result = await provider.isAvailable();
      expect(result).toBe(false);
    });
  });

  describe('executeCode', () => {
    it('throws error as code execution is disabled in local mode', async () => {
      await expect(provider.executeCode('print("Hello")', 'python')).rejects.toThrow(
        'Code execution is not available in local mode. Use the terminal instead.'
      );
    });
  });

  describe('getHealth', () => {
    it('returns healthy status when local execution supported', async () => {
      vi.mocked(isLocalExecutionSupported).mockResolvedValue(true);

      const result = await provider.getHealth();

      expect(result.isHealthy).toBe(true);
      expect(result.message).toBe('Local execution mode available (terminal only)');
    });

    it('returns unhealthy status when local execution not supported', async () => {
      vi.mocked(isLocalExecutionSupported).mockResolvedValue(false);

      const result = await provider.getHealth();

      expect(result.isHealthy).toBe(false);
      expect(result.message).toBe('Local execution not available on this platform');
    });
  });

  describe('cleanup', () => {
    it('resolves without error (no cleanup needed)', async () => {
      await expect(provider.cleanup()).resolves.toBeUndefined();
    });
  });

  describe('singleton instance', () => {
    it('exports a singleton instance', () => {
      expect(localExecutionProvider).toBeInstanceOf(LocalExecutionProvider);
    });
  });
});
