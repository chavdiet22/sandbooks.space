import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/setup';

const API_URL = 'http://localhost:3001';

// We need to dynamically import after setting up handlers
let terminalService: typeof import('../terminal').terminalService;

describe('TerminalService', () => {
  beforeEach(async () => {
    // Reset module cache
    vi.resetModules();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('sends input to terminal', async () => {
    let capturedBody: unknown;

    // Note: actual URL is /api/terminal/:sessionId/input (not /sessions/)
    server.use(
      http.post(`${API_URL}/api/terminal/:sessionId/input`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ status: 'sent' });
      })
    );

    const module = await import('../terminal');
    terminalService = module.terminalService;
    await terminalService.sendInput('sess-1', 'pwd\n');

    expect(capturedBody).toEqual({ data: 'pwd\n' });
  });

  it('resizes terminal', async () => {
    let capturedBody: unknown;

    // Note: actual URL is /api/terminal/:sessionId/resize (not /sessions/)
    server.use(
      http.post(`${API_URL}/api/terminal/:sessionId/resize`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ message: 'Terminal resized' });
      })
    );

    const module = await import('../terminal');
    terminalService = module.terminalService;
    await terminalService.resize('sess-1', 100, 30);

    expect(capturedBody).toEqual({ cols: 100, rows: 30 });
  });

  it('creates terminal session', async () => {
    let capturedBody: unknown;

    server.use(
      http.post(`${API_URL}/api/terminal/sessions`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({
          sessionId: 'new-sess',
          sandboxId: 'sandbox-1',
          status: 'active',
          createdAt: Date.now(),
          expiresIn: 1800000,
        });
      })
    );

    const module = await import('../terminal');
    terminalService = module.terminalService;
    const result = await terminalService.createSession('note-1');

    expect(result.sessionId).toBe('new-sess');
    expect(capturedBody).toEqual({ noteId: 'note-1' });
  });

  it('destroys terminal session', async () => {
    let wasCalled = false;

    server.use(
      http.delete(`${API_URL}/api/terminal/sessions/:sessionId`, () => {
        wasCalled = true;
        return HttpResponse.json({ message: 'Session destroyed', sessionId: 'sess-1' });
      })
    );

    const module = await import('../terminal');
    terminalService = module.terminalService;
    await terminalService.destroySession('sess-1');

    expect(wasCalled).toBe(true);
  });

  it('handles sendInput errors', async () => {
    server.use(
      http.post(`${API_URL}/api/terminal/:sessionId/input`, () => {
        return HttpResponse.json({ error: 'Session not found' }, { status: 404 });
      })
    );

    const module = await import('../terminal');
    terminalService = module.terminalService;

    await expect(terminalService.sendInput('invalid-sess', 'test')).rejects.toThrow(
      'Failed to send input'
    );
  });

  it('handles resize errors', async () => {
    server.use(
      http.post(`${API_URL}/api/terminal/:sessionId/resize`, () => {
        return HttpResponse.json({ error: 'Invalid dimensions' }, { status: 400 });
      })
    );

    const module = await import('../terminal');
    terminalService = module.terminalService;

    await expect(terminalService.resize('sess-1', 10, 5)).rejects.toThrow(
      'Failed to resize terminal'
    );
  });

  describe('healthCheck', () => {
    it('returns true when backend is healthy', async () => {
      server.use(
        http.get(`${API_URL}/api/health`, () => {
          return HttpResponse.json({ status: 'ok' });
        })
      );

      const module = await import('../terminal');
      terminalService = module.terminalService;

      const result = await terminalService.healthCheck();
      expect(result).toBe(true);
    });

    it('returns false when backend is unhealthy', async () => {
      server.use(
        http.get(`${API_URL}/api/health`, () => {
          return HttpResponse.json({}, { status: 503 });
        })
      );

      const module = await import('../terminal');
      terminalService = module.terminalService;

      const result = await terminalService.healthCheck();
      expect(result).toBe(false);
    });

    it('returns false on network error', async () => {
      server.use(
        http.get(`${API_URL}/api/health`, () => {
          return HttpResponse.error();
        })
      );

      const module = await import('../terminal');
      terminalService = module.terminalService;

      const result = await terminalService.healthCheck();
      expect(result).toBe(false);
    });
  });

  describe('executeCommand', () => {
    it('executes command successfully', async () => {
      server.use(
        http.post(`${API_URL}/api/terminal/:sessionId/execute`, () => {
          return HttpResponse.json({
            output: 'file1.txt\nfile2.txt',
            exitCode: 0,
          });
        })
      );

      const module = await import('../terminal');
      terminalService = module.terminalService;

      const result = await terminalService.executeCommand('sess-1', 'ls');
      expect(result.output).toBe('file1.txt\nfile2.txt');
      expect(result.exitCode).toBe(0);
    });

    it('handles executeCommand errors', async () => {
      server.use(
        http.post(`${API_URL}/api/terminal/:sessionId/execute`, () => {
          return HttpResponse.json({ error: 'Timeout' }, { status: 408 });
        })
      );

      const module = await import('../terminal');
      terminalService = module.terminalService;

      await expect(terminalService.executeCommand('sess-1', 'slow-cmd')).rejects.toThrow(
        'Failed to execute command'
      );
    });
  });

  describe('resizeTerminal', () => {
    it('calls resize method', async () => {
      server.use(
        http.post(`${API_URL}/api/terminal/:sessionId/resize`, () => {
          return HttpResponse.json({ success: true });
        })
      );

      const module = await import('../terminal');
      terminalService = module.terminalService;

      await expect(terminalService.resizeTerminal('sess-1', 120, 40)).resolves.toBeUndefined();
    });
  });

  describe('connectStream', () => {
    it('creates EventSource with correct URL', async () => {
      const OriginalEventSource = global.EventSource;
      const constructedUrls: string[] = [];

      // Mock EventSource as a class constructor - assign class directly
      class MockEventSource {
        readyState = 0;
        close = vi.fn();
        onerror: ((error: Event) => void) | null = null;
        onopen: (() => void) | null = null;
        constructor(public url: string) {
          constructedUrls.push(url);
        }
      }
      global.EventSource = MockEventSource as unknown as typeof EventSource;

      try {
        const module = await import('../terminal');
        terminalService = module.terminalService;

        const eventSource = terminalService.connectStream('session-123');

        expect(eventSource).toBeDefined();
        expect(constructedUrls.length).toBeGreaterThan(0);
        expect(constructedUrls[0]).toContain('/api/terminal/session-123/stream');
      } finally {
        global.EventSource = OriginalEventSource;
      }
    });
  });

  describe('disconnectStream', () => {
    it('closes EventSource', async () => {
      const mockClose = vi.fn();
      const mockEventSource = { close: mockClose } as unknown as EventSource;

      const module = await import('../terminal');
      terminalService = module.terminalService;

      terminalService.disconnectStream(mockEventSource);

      expect(mockClose).toHaveBeenCalled();
    });

    it('handles close error gracefully', async () => {
      const mockEventSource = {
        close: vi.fn().mockImplementation(() => {
          throw new Error('Already closed');
        }),
      } as unknown as EventSource;

      const module = await import('../terminal');
      terminalService = module.terminalService;

      // Mock console.error to verify it's called and prevent stderr output
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Should not throw
      expect(() => terminalService.disconnectStream(mockEventSource)).not.toThrow();

      // Should log the error
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[TerminalService] Error closing EventSource:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('error handling edge cases', () => {
    it('handles createSession HTTP status without error message', async () => {
      server.use(
        http.post(`${API_URL}/api/terminal/sessions`, () => {
          return HttpResponse.json({}, { status: 500 });
        })
      );

      const module = await import('../terminal');
      terminalService = module.terminalService;

      await expect(terminalService.createSession('note-1')).rejects.toThrow('HTTP 500');
    });

    it('handles destroySession HTTP status without error message', async () => {
      server.use(
        http.delete(`${API_URL}/api/terminal/sessions/:sessionId`, () => {
          return HttpResponse.json({}, { status: 500 });
        })
      );

      const module = await import('../terminal');
      terminalService = module.terminalService;

      await expect(terminalService.destroySession('sess-1')).rejects.toThrow('HTTP 500');
    });

    it('handles network error in createSession', async () => {
      server.use(
        http.post(`${API_URL}/api/terminal/sessions`, () => {
          return HttpResponse.error();
        })
      );

      const module = await import('../terminal');
      terminalService = module.terminalService;

      await expect(terminalService.createSession('note-1')).rejects.toThrow(
        'Failed to create terminal session'
      );
    });

    it('handles network error in destroySession', async () => {
      server.use(
        http.delete(`${API_URL}/api/terminal/sessions/:sessionId`, () => {
          return HttpResponse.error();
        })
      );

      const module = await import('../terminal');
      terminalService = module.terminalService;

      await expect(terminalService.destroySession('sess-1')).rejects.toThrow(
        'Failed to destroy terminal session'
      );
    });

    it('handles sendInput HTTP status without error message', async () => {
      server.use(
        http.post(`${API_URL}/api/terminal/:sessionId/input`, () => {
          return HttpResponse.json({}, { status: 500 });
        })
      );

      const module = await import('../terminal');
      terminalService = module.terminalService;

      await expect(terminalService.sendInput('sess-1', 'data')).rejects.toThrow('HTTP 500');
    });

    it('handles resize HTTP status without error message', async () => {
      server.use(
        http.post(`${API_URL}/api/terminal/:sessionId/resize`, () => {
          return HttpResponse.json({}, { status: 500 });
        })
      );

      const module = await import('../terminal');
      terminalService = module.terminalService;

      await expect(terminalService.resize('sess-1', 80, 24)).rejects.toThrow('HTTP 500');
    });
  });
});
