/**
 * MSW request handlers for API mocking.
 * These handlers intercept network requests and return mock responses.
 */
import { http, HttpResponse, delay } from 'msw';

const API_URL = 'http://localhost:3001';

/**
 * Default handlers for happy path scenarios.
 */
export const handlers = [
  // Sandbox health check
  http.get(`${API_URL}/api/sandbox/health`, () => {
    return HttpResponse.json({
      isHealthy: true,
      sandboxId: 'test-sandbox-id',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    });
  }),

  // Code execution
  http.post(`${API_URL}/api/execute`, async ({ request }) => {
    const body = await request.json() as { code: string; language: string };
    await delay(100); // Simulate execution time

    return HttpResponse.json({
      stdout: `Executed ${body.language} code successfully\n`,
      stderr: '',
      exitCode: 0,
      executionTime: 150,
      sandboxStatus: 'healthy',
    });
  }),

  // Sandbox recreation
  http.post(`${API_URL}/api/sandbox/recreate`, async () => {
    await delay(200);
    return HttpResponse.json({
      success: true,
      sandboxId: 'new-sandbox-id',
    });
  }),

  // Sandbox destroy
  http.post(`${API_URL}/api/sandbox/destroy`, () => {
    return HttpResponse.json({ success: true });
  }),

  // Terminal session creation
  http.post(`${API_URL}/api/terminal/sessions`, () => {
    return HttpResponse.json({
      sessionId: 'test-session-id',
      status: 'connected',
      workingDir: '/home/user',
    });
  }),

  // Terminal session info
  http.get(`${API_URL}/api/terminal/sessions/:sessionId`, ({ params }) => {
    return HttpResponse.json({
      sessionId: params.sessionId,
      status: 'connected',
      workingDir: '/home/user',
    });
  }),

  // Terminal input
  http.post(`${API_URL}/api/terminal/sessions/:sessionId/input`, () => {
    return HttpResponse.json({ success: true });
  }),

  // Terminal resize
  http.post(`${API_URL}/api/terminal/sessions/:sessionId/resize`, () => {
    return HttpResponse.json({ success: true });
  }),

  // Terminal destroy
  http.delete(`${API_URL}/api/terminal/sessions/:sessionId`, () => {
    return HttpResponse.json({ success: true });
  }),

  // Terminal stats
  http.get(`${API_URL}/api/terminal/stats`, () => {
    return HttpResponse.json({
      activeSessions: 1,
      totalCreated: 10,
      totalDestroyed: 9,
    });
  }),

  // GitHub OAuth URL
  http.get(`${API_URL}/api/github/auth/url`, () => {
    return HttpResponse.json({
      url: 'https://github.com/login/oauth/authorize?client_id=test&state=test-state',
      state: 'test-state',
    });
  }),

  // GitHub callback
  http.post(`${API_URL}/api/github/auth/callback`, () => {
    return HttpResponse.json({
      success: true,
      user: {
        login: 'testuser',
        avatar_url: 'https://github.com/testuser.png',
      },
    });
  }),

  // GitHub status
  http.get(`${API_URL}/api/github/status`, () => {
    return HttpResponse.json({
      connected: false,
      user: null,
    });
  }),

  // GitHub repos
  http.get(`${API_URL}/api/github/repos`, () => {
    return HttpResponse.json({
      repos: [
        { name: 'notes-repo', full_name: 'testuser/notes-repo', private: true },
      ],
    });
  }),

  // API health
  http.get(`${API_URL}/api/health`, () => {
    return HttpResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  }),

  // Notebook execution
  http.post(`${API_URL}/api/notebooks/:noteId/execute`, async ({ request }) => {
    const body = await request.json() as { code: string };
    await delay(50);
    return HttpResponse.json({
      stdout: `Output: ${body.code.slice(0, 20)}...\n`,
      stderr: '',
      exitCode: 0,
      executionTime: 100,
    });
  }),
];

/**
 * Error scenario handlers for negative testing.
 * Use server.use() to override default handlers temporarily.
 */
export const errorHandlers = {
  // Sandbox unhealthy
  sandboxUnhealthy: http.get(`${API_URL}/api/sandbox/health`, () => {
    return HttpResponse.json(
      { isHealthy: false, error: 'Sandbox unavailable' },
      { status: 503 }
    );
  }),

  // Execution timeout
  executionTimeout: http.post(`${API_URL}/api/execute`, async () => {
    await delay(5000);
    return HttpResponse.json(
      { error: 'Execution timeout', recoverable: true },
      { status: 408 }
    );
  }),

  // Execution error
  executionError: http.post(`${API_URL}/api/execute`, () => {
    return HttpResponse.json({
      stdout: '',
      stderr: 'SyntaxError: invalid syntax',
      exitCode: 1,
      executionTime: 50,
    });
  }),

  // Network error
  networkError: http.get(`${API_URL}/api/sandbox/health`, () => {
    return HttpResponse.error();
  }),

  // Unauthorized
  unauthorized: http.get(`${API_URL}/api/sandbox/health`, () => {
    return HttpResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }),

  // Terminal session not found
  sessionNotFound: http.get(`${API_URL}/api/terminal/sessions/:sessionId`, () => {
    return HttpResponse.json(
      { error: 'Session not found' },
      { status: 404 }
    );
  }),

  // Terminal session expired
  sessionExpired: http.get(`${API_URL}/api/terminal/sessions/:sessionId`, () => {
    return HttpResponse.json(
      { error: 'Session expired' },
      { status: 410 }
    );
  }),

  // Rate limited
  rateLimited: http.post(`${API_URL}/api/execute`, () => {
    return HttpResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    );
  }),

  // GitHub auth error
  githubAuthError: http.post(`${API_URL}/api/github/auth/callback`, () => {
    return HttpResponse.json(
      { error: 'Invalid OAuth state' },
      { status: 400 }
    );
  }),

  // Server error
  serverError: http.post(`${API_URL}/api/execute`, () => {
    return HttpResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }),
};

/**
 * Creates handlers with custom API URL.
 * @param _apiUrl - Custom API URL (reserved for future use)
 */
export const createHandlersWithUrl = (_apiUrl: string) =>
  handlers.map((handler) => {
    // Clone handlers with different base URL if needed
    return handler;
  });
