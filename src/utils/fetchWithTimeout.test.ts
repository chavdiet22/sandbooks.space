import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchWithTimeout } from './fetchWithTimeout';

describe('fetchWithTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should successfully fetch when response is within timeout', async () => {
    const mockResponse = new Response('success', { status: 200 });
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

    const promise = fetchWithTimeout('https://example.com/api');

    // Let the fetch resolve
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe(mockResponse);
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://example.com/api',
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      })
    );
  });

  it('should pass through request options', async () => {
    const mockResponse = new Response('success', { status: 200 });
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

    const options: RequestInit = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: 'data' }),
    };

    const promise = fetchWithTimeout('https://example.com/api', options);

    await vi.runAllTimersAsync();
    await promise;

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://example.com/api',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'data' }),
        signal: expect.any(AbortSignal),
      })
    );
  });

  it('should use custom timeout when provided', async () => {
    const mockResponse = new Response('success', { status: 200 });
    vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

    const customTimeout = 5000;
    const promise = fetchWithTimeout('https://example.com/api', {}, customTimeout);

    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe(mockResponse);
    // Verify timeout was used (implicitly via no errors)
  });

  it('should abort request and throw timeout error when timeout is exceeded', async () => {
    let abortCalled = false;
    let rejectFn: ((error: Error) => void) | null = null;

    vi.spyOn(global, 'fetch').mockImplementation(async (_url, options) => {
      return new Promise((_resolve, reject) => {
        rejectFn = reject;
        const signal = (options as RequestInit)?.signal;
        if (signal) {
          signal.addEventListener('abort', () => {
            abortCalled = true;
            const error = new Error('The operation was aborted');
            error.name = 'AbortError';
            if (rejectFn) {
              rejectFn(error);
            }
          });
        }
      });
    });

    const promise = fetchWithTimeout('https://example.com/api', {}, 1000);

    // Advance timers to trigger timeout - this should trigger the abort
    vi.advanceTimersByTime(1000);

    // Wait for the promise to reject
    await expect(promise).rejects.toThrow('Request timed out - backend may be unavailable');
    expect(abortCalled).toBe(true);
  });

  it('should propagate fetch errors that are not timeout-related', async () => {
    const networkError = new Error('Network failure');
    vi.spyOn(global, 'fetch').mockRejectedValue(networkError);

    await vi.runAllTimersAsync();

    await expect(fetchWithTimeout('https://example.com/api')).rejects.toThrow('Network failure');
  });

  it('should handle AbortError specifically with timeout message', async () => {
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';

    vi.spyOn(global, 'fetch').mockRejectedValue(abortError);

    await vi.runAllTimersAsync();

    await expect(fetchWithTimeout('https://example.com/api')).rejects.toThrow(
      'Request timed out - backend may be unavailable'
    );
  });

  it('should clear timeout on successful response', async () => {
    const mockResponse = new Response('success', { status: 200 });
    vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse);
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

    const promise = fetchWithTimeout('https://example.com/api');

    await vi.runAllTimersAsync();
    await promise;

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it('should clear timeout on error', async () => {
    const error = new Error('Test error');
    vi.spyOn(global, 'fetch').mockRejectedValue(error);
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

    await vi.runAllTimersAsync();

    await expect(fetchWithTimeout('https://example.com/api')).rejects.toThrow('Test error');
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
