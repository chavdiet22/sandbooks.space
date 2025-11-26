/**
 * Notebook Service tests.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/setup';
import { executeCell, restartKernel, destroySession, getSessionStatus } from '../notebook';

const API_URL = 'http://localhost:3001';

describe('notebook service', () => {
  afterEach(() => {
    server.resetHandlers();
  });

  describe('executeCell', () => {
    it('should execute code and return result', async () => {
      server.use(
        http.post(`${API_URL}/api/notebooks/:noteId/execute`, () => {
          return HttpResponse.json({
            output: 'Hello, World!',
            executionCount: 1,
            status: 'success',
          });
        })
      );

      const result = await executeCell('note-1', 'print("Hello, World!")');

      expect(result.output).toBe('Hello, World!');
      expect(result.executionCount).toBe(1);
    });

    it('should throw error on execution failure', async () => {
      server.use(
        http.post(`${API_URL}/api/notebooks/:noteId/execute`, () => {
          return HttpResponse.json({ message: 'Syntax error' }, { status: 400 });
        })
      );

      await expect(executeCell('note-1', 'invalid code')).rejects.toThrow('Syntax error');
    });

    it('should throw generic error when no message in response', async () => {
      server.use(
        http.post(`${API_URL}/api/notebooks/:noteId/execute`, () => {
          return HttpResponse.json({}, { status: 500 });
        })
      );

      await expect(executeCell('note-1', 'code')).rejects.toThrow('Failed to execute cell');
    });

    it('should handle JSON parse error gracefully', async () => {
      server.use(
        http.post(`${API_URL}/api/notebooks/:noteId/execute`, () => {
          return new HttpResponse('Invalid JSON', { status: 500 });
        })
      );

      await expect(executeCell('note-1', 'code')).rejects.toThrow('Execution failed');
    });
  });

  describe('restartKernel', () => {
    it('should restart kernel successfully', async () => {
      server.use(
        http.post(`${API_URL}/api/notebooks/:noteId/restart`, () => {
          return HttpResponse.json({ success: true });
        })
      );

      await expect(restartKernel('note-1')).resolves.toBeUndefined();
    });

    it('should throw error on restart failure', async () => {
      server.use(
        http.post(`${API_URL}/api/notebooks/:noteId/restart`, () => {
          return HttpResponse.json({ error: 'Kernel busy' }, { status: 503 });
        })
      );

      await expect(restartKernel('note-1')).rejects.toThrow('Failed to restart kernel');
    });
  });

  describe('destroySession', () => {
    it('should destroy session successfully', async () => {
      server.use(
        http.delete(`${API_URL}/api/notebooks/:noteId/session`, () => {
          return HttpResponse.json({ success: true });
        })
      );

      await expect(destroySession('note-1')).resolves.toBeUndefined();
    });

    it('should throw error on destroy failure', async () => {
      server.use(
        http.delete(`${API_URL}/api/notebooks/:noteId/session`, () => {
          return HttpResponse.json({ error: 'Session not found' }, { status: 404 });
        })
      );

      await expect(destroySession('note-1')).rejects.toThrow('Failed to destroy session');
    });
  });

  describe('getSessionStatus', () => {
    it('should return session status', async () => {
      const sessionData = {
        noteId: 'note-1',
        sandboxId: 'sandbox-123',
        executionCount: 5,
        status: 'active',
        createdAt: '2025-01-15T12:00:00Z',
        lastActivity: '2025-01-15T12:30:00Z',
      };

      server.use(
        http.get(`${API_URL}/api/notebooks/:noteId/session`, () => {
          return HttpResponse.json(sessionData);
        })
      );

      const result = await getSessionStatus('note-1');

      expect(result.noteId).toBe('note-1');
      expect(result.sandboxId).toBe('sandbox-123');
      expect(result.executionCount).toBe(5);
      expect(result.status).toBe('active');
    });

    it('should throw error when session not found', async () => {
      server.use(
        http.get(`${API_URL}/api/notebooks/:noteId/session`, () => {
          return HttpResponse.json({ error: 'No session' }, { status: 404 });
        })
      );

      await expect(getSessionStatus('note-1')).rejects.toThrow('Failed to get session status');
    });
  });
});
