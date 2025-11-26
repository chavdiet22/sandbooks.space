/**
 * GitHub Service tests.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/setup';
import { gitHubService } from '../github';

const API_BASE_URL = 'http://localhost:3001';

describe('gitHubService', () => {
  let mockStorage: Record<string, string>;

  beforeEach(() => {
    mockStorage = {};
    vi.spyOn(window.localStorage, 'getItem').mockImplementation(
      (key: string) => mockStorage[key] || null
    );
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(
      (key: string, value: string) => {
        mockStorage[key] = value;
      }
    );
    vi.spyOn(window.localStorage, 'removeItem').mockImplementation(
      (key: string) => {
        delete mockStorage[key];
      }
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    server.resetHandlers();
  });

  describe('isConnected', () => {
    it('should return true when token exists in storage', () => {
      mockStorage['sandbooks-github-token'] = 'test-encrypted-token';

      expect(gitHubService.isConnected()).toBe(true);
    });

    it('should return false when no token in storage', () => {
      expect(gitHubService.isConnected()).toBe(false);
    });
  });

  describe('getStoredUser', () => {
    it('should return user when valid JSON in storage', () => {
      const user = { id: 123, login: 'testuser', name: 'Test User' };
      mockStorage['sandbooks-github-user'] = JSON.stringify(user);

      expect(gitHubService.getStoredUser()).toEqual(user);
    });

    it('should return null when no user in storage', () => {
      expect(gitHubService.getStoredUser()).toBeNull();
    });

    it('should return null when invalid JSON in storage', () => {
      mockStorage['sandbooks-github-user'] = 'invalid-json';

      expect(gitHubService.getStoredUser()).toBeNull();
    });
  });

  describe('getStoredRepo', () => {
    it('should return repo when exists in storage', () => {
      mockStorage['sandbooks-github-repo'] = 'user/repo';

      expect(gitHubService.getStoredRepo()).toBe('user/repo');
    });

    it('should return null when no repo in storage', () => {
      expect(gitHubService.getStoredRepo()).toBeNull();
    });
  });

  describe('getStoredPath', () => {
    it('should return path when exists in storage', () => {
      mockStorage['sandbooks-github-path'] = 'notes/personal';

      expect(gitHubService.getStoredPath()).toBe('notes/personal');
    });

    it('should return default "sandbooks" when no path in storage', () => {
      expect(gitHubService.getStoredPath()).toBe('sandbooks');
    });
  });

  describe('getLastSync', () => {
    it('should return last sync time when exists', () => {
      mockStorage['sandbooks-github-last-sync'] = '2025-01-15T12:00:00Z';

      expect(gitHubService.getLastSync()).toBe('2025-01-15T12:00:00Z');
    });

    it('should return null when no last sync', () => {
      expect(gitHubService.getLastSync()).toBeNull();
    });
  });

  describe('disconnect', () => {
    it('should clear all GitHub storage keys', async () => {
      mockStorage['sandbooks-github-token'] = 'token';
      mockStorage['sandbooks-github-user'] = '{}';
      mockStorage['sandbooks-github-repo'] = 'repo';
      mockStorage['sandbooks-github-path'] = 'path';
      mockStorage['sandbooks-github-last-sync'] = 'time';

      server.use(
        http.delete(`${API_BASE_URL}/api/github/oauth/revoke`, () => {
          return HttpResponse.json({ success: true });
        })
      );

      await gitHubService.disconnect();

      expect(mockStorage['sandbooks-github-token']).toBeUndefined();
      expect(mockStorage['sandbooks-github-user']).toBeUndefined();
      expect(mockStorage['sandbooks-github-repo']).toBeUndefined();
      expect(mockStorage['sandbooks-github-path']).toBeUndefined();
      expect(mockStorage['sandbooks-github-last-sync']).toBeUndefined();
    });

    it('should clear storage even if revoke API fails', async () => {
      mockStorage['sandbooks-github-token'] = 'token';

      server.use(
        http.delete(`${API_BASE_URL}/api/github/oauth/revoke`, () => {
          return HttpResponse.error();
        })
      );

      await gitHubService.disconnect();

      expect(mockStorage['sandbooks-github-token']).toBeUndefined();
    });
  });

  describe('listRepos', () => {
    it('should return repos on success', async () => {
      mockStorage['sandbooks-github-token'] = 'test-token';

      const repos = [
        { id: 1, fullName: 'user/repo1', defaultBranch: 'main', private: false },
        { id: 2, fullName: 'user/repo2', defaultBranch: 'main', private: true },
      ];

      server.use(
        http.get(`${API_BASE_URL}/api/github/repos`, () => {
          return HttpResponse.json({ repos });
        })
      );

      const result = await gitHubService.listRepos();

      expect(result).toEqual(repos);
    });

    it('should throw error on API failure', async () => {
      mockStorage['sandbooks-github-token'] = 'test-token';

      server.use(
        http.get(`${API_BASE_URL}/api/github/repos`, () => {
          return HttpResponse.json({ error: 'Token expired' }, { status: 401 });
        })
      );

      await expect(gitHubService.listRepos()).rejects.toThrow('Token expired');
    });

    it('should throw generic error when response has no error message', async () => {
      mockStorage['sandbooks-github-token'] = 'test-token';

      server.use(
        http.get(`${API_BASE_URL}/api/github/repos`, () => {
          return HttpResponse.json({}, { status: 500 });
        })
      );

      await expect(gitHubService.listRepos()).rejects.toThrow('Failed to list repositories');
    });
  });

  describe('selectRepo', () => {
    it('should select repo and store in localStorage', async () => {
      mockStorage['sandbooks-github-token'] = 'test-token';

      server.use(
        http.post(`${API_BASE_URL}/api/github/repos/select`, () => {
          return HttpResponse.json({ success: true });
        })
      );

      await gitHubService.selectRepo('user/repo', 'custom-path');

      expect(mockStorage['sandbooks-github-repo']).toBe('user/repo');
      expect(mockStorage['sandbooks-github-path']).toBe('custom-path');
    });

    it('should use default path when not specified', async () => {
      mockStorage['sandbooks-github-token'] = 'test-token';

      server.use(
        http.post(`${API_BASE_URL}/api/github/repos/select`, () => {
          return HttpResponse.json({ success: true });
        })
      );

      await gitHubService.selectRepo('user/repo');

      expect(mockStorage['sandbooks-github-path']).toBe('sandbooks');
    });

    it('should throw error on API failure', async () => {
      mockStorage['sandbooks-github-token'] = 'test-token';

      server.use(
        http.post(`${API_BASE_URL}/api/github/repos/select`, () => {
          return HttpResponse.json({ error: 'Not found' }, { status: 404 });
        })
      );

      await expect(gitHubService.selectRepo('user/repo')).rejects.toThrow('Not found');
    });
  });

  describe('push', () => {
    it('should push notes and update last sync time', async () => {
      mockStorage['sandbooks-github-token'] = 'test-token';
      mockStorage['sandbooks-github-repo'] = 'user/repo';
      mockStorage['sandbooks-github-path'] = 'notes';

      const notes = [
        {
          id: 'note-1',
          title: 'Test Note',
          content: { type: 'doc', content: [] },
          createdAt: '2025-01-15T12:00:00Z',
          updatedAt: '2025-01-15T12:00:00Z',
        },
      ];

      server.use(
        http.post(`${API_BASE_URL}/api/github/sync/push`, () => {
          return HttpResponse.json({
            success: true,
            syncedAt: '2025-01-15T13:00:00Z',
            pushed: 1,
          });
        })
      );

      const result = await gitHubService.push(notes, 'Test commit');

      expect(result.syncedAt).toBe('2025-01-15T13:00:00Z');
      expect(mockStorage['sandbooks-github-last-sync']).toBe('2025-01-15T13:00:00Z');
    });

    it('should include folders and deletedFolderIds in push', async () => {
      mockStorage['sandbooks-github-token'] = 'test-token';
      mockStorage['sandbooks-github-repo'] = 'user/repo';

      const notes: Array<{
        id: string;
        title: string;
        content: { type: string; content: unknown[] };
        createdAt: string;
        updatedAt: string;
      }> = [];
      const folders = [{ id: 'folder-1', name: 'Test', parentId: null, sortOrder: 0 }];
      const deletedFolderIds = ['old-folder-1'];

      let capturedBody: Record<string, unknown> | null = null;
      server.use(
        http.post(`${API_BASE_URL}/api/github/sync/push`, async ({ request }) => {
          capturedBody = await request.json() as Record<string, unknown>;
          return HttpResponse.json({ success: true, syncedAt: '2025-01-15T13:00:00Z' });
        })
      );

      await gitHubService.push(notes, 'msg', folders, deletedFolderIds);

      expect(capturedBody?.folders).toEqual(folders);
      expect(capturedBody?.deletedFolderIds).toEqual(deletedFolderIds);
    });

    it('should throw error when no repo selected', async () => {
      mockStorage['sandbooks-github-token'] = 'test-token';

      await expect(gitHubService.push([])).rejects.toThrow('No repository selected');
    });

    it('should throw error on API failure', async () => {
      mockStorage['sandbooks-github-token'] = 'test-token';
      mockStorage['sandbooks-github-repo'] = 'user/repo';

      server.use(
        http.post(`${API_BASE_URL}/api/github/sync/push`, () => {
          return HttpResponse.json({ error: 'Conflict' }, { status: 409 });
        })
      );

      await expect(gitHubService.push([])).rejects.toThrow('Conflict');
    });
  });

  describe('pull', () => {
    it('should pull notes and update last sync time', async () => {
      mockStorage['sandbooks-github-token'] = 'test-token';
      mockStorage['sandbooks-github-repo'] = 'user/repo';

      const pullResult = {
        success: true,
        syncedAt: '2025-01-15T13:00:00Z',
        notes: [
          {
            id: 'note-1',
            title: 'Pulled Note',
            content: { type: 'doc', content: [] },
          },
        ],
        folders: [],
        hasRemoteData: true,
      };

      server.use(
        http.post(`${API_BASE_URL}/api/github/sync/pull`, () => {
          return HttpResponse.json(pullResult);
        })
      );

      const result = await gitHubService.pull();

      expect(result.syncedAt).toBe('2025-01-15T13:00:00Z');
      expect(mockStorage['sandbooks-github-last-sync']).toBe('2025-01-15T13:00:00Z');
    });

    it('should use default path when not stored', async () => {
      mockStorage['sandbooks-github-token'] = 'test-token';
      mockStorage['sandbooks-github-repo'] = 'user/repo';

      let capturedBody: Record<string, unknown> | null = null;
      server.use(
        http.post(`${API_BASE_URL}/api/github/sync/pull`, async ({ request }) => {
          capturedBody = await request.json() as Record<string, unknown>;
          return HttpResponse.json({ syncedAt: '2025-01-15T13:00:00Z' });
        })
      );

      await gitHubService.pull();

      expect(capturedBody?.path).toBe('sandbooks');
    });

    it('should throw error when no repo selected', async () => {
      mockStorage['sandbooks-github-token'] = 'test-token';

      await expect(gitHubService.pull()).rejects.toThrow('No repository selected');
    });

    it('should throw error on API failure', async () => {
      mockStorage['sandbooks-github-token'] = 'test-token';
      mockStorage['sandbooks-github-repo'] = 'user/repo';

      server.use(
        http.post(`${API_BASE_URL}/api/github/sync/pull`, () => {
          return HttpResponse.json({ error: 'Forbidden' }, { status: 403 });
        })
      );

      await expect(gitHubService.pull()).rejects.toThrow('Forbidden');
    });
  });

  describe('startOAuthFlow', () => {
    it('should reject when popup is blocked', async () => {
      mockStorage['sandbooks-device-id'] = 'test-device';

      server.use(
        http.get(`${API_BASE_URL}/api/github/oauth/url`, () => {
          return HttpResponse.json({ url: 'https://github.com/oauth' });
        })
      );

      // Mock window.open to return null (popup blocked)
      const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);

      await expect(gitHubService.startOAuthFlow()).rejects.toThrow('Popup blocked');

      openSpy.mockRestore();
    });

    it('should throw error when getting OAuth URL fails', async () => {
      mockStorage['sandbooks-device-id'] = 'test-device';

      server.use(
        http.get(`${API_BASE_URL}/api/github/oauth/url`, () => {
          return HttpResponse.json({ error: 'Service unavailable' }, { status: 503 });
        })
      );

      await expect(gitHubService.startOAuthFlow()).rejects.toThrow('Service unavailable');
    });

    it('should throw generic error when OAuth URL response has no error message', async () => {
      mockStorage['sandbooks-device-id'] = 'test-device';

      server.use(
        http.get(`${API_BASE_URL}/api/github/oauth/url`, () => {
          return HttpResponse.json({}, { status: 500 });
        })
      );

      await expect(gitHubService.startOAuthFlow()).rejects.toThrow('Failed to start GitHub connection');
    });
  });
});
