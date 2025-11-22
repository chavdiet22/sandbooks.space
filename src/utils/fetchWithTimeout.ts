// Timeout configuration - fail fast for better UX
const FETCH_TIMEOUT_MS = 3000; // 3 seconds max per request

/**
 * Fetch with timeout - aborts request after specified duration
 * Throws error if request takes longer than timeout
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = FETCH_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out - backend may be unavailable');
    }
    throw error;
  }
}
