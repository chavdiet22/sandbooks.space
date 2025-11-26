/**
 * GitHub controller unit tests.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { faker } from '@faker-js/faker';
import {
  getAuthUrl,
  handleCallback,
  revokeAuth,
  listRepos,
  selectRepo,
  pushNotes,
  pullNotes,
  getUser,
} from '../github.controller';
import gitHubService from '../../services/github.service';
import { createMockRequestContext } from '../../test/factories';

// Mock the github service
vi.mock('../../services/github.service', () => ({
  default: {
    isConfigured: vi.fn(),
    getAuthUrl: vi.fn(),
    verifyState: vi.fn(),
    exchangeCodeForToken: vi.fn(),
    getUser: vi.fn(),
    encryptTokenForDevice: vi.fn(),
    decryptTokenFromDevice: vi.fn(),
    revokeToken: vi.fn(),
    listRepos: vi.fn(),
    checkRepoAccess: vi.fn(),
    createRepo: vi.fn(),
    createOrUpdateFile: vi.fn(),
    getContents: vi.fn(),
    pushNotes: vi.fn(),
    pullNotes: vi.fn(),
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

describe('github.controller', () => {
  const validDeviceId = faker.string.alphanumeric(32);
  const validToken = 'gho_' + faker.string.alphanumeric(36);
  const encryptedToken = 'encrypted_' + faker.string.alphanumeric(50);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAuthUrl', () => {
    it('should return OAuth URL when properly configured', async () => {
      vi.mocked(gitHubService.isConfigured).mockReturnValue(true);
      vi.mocked(gitHubService.getAuthUrl).mockReturnValue('https://github.com/login/oauth/authorize?...');

      const { req, res, next } = createMockRequestContext({
        query: { deviceId: validDeviceId },
      });

      await getAuthUrl(req as never, res as never, next);

      expect(gitHubService.getAuthUrl).toHaveBeenCalledWith(validDeviceId);
      expect(res.json).toHaveBeenCalledWith({
        url: 'https://github.com/login/oauth/authorize?...',
      });
    });

    it('should return 400 when deviceId is missing', async () => {
      const { req, res, next } = createMockRequestContext({
        query: {},
      });

      await getAuthUrl(req as never, res as never, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Device ID is required (min 16 characters)',
      });
    });

    it('should return 400 when deviceId is too short', async () => {
      const { req, res, next } = createMockRequestContext({
        query: { deviceId: 'short' },
      });

      await getAuthUrl(req as never, res as never, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 503 when GitHub is not configured', async () => {
      vi.mocked(gitHubService.isConfigured).mockReturnValue(false);

      const { req, res, next } = createMockRequestContext({
        query: { deviceId: validDeviceId },
      });

      await getAuthUrl(req as never, res as never, next);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        error: 'GitHub integration is not configured',
      });
    });
  });

  describe('handleCallback', () => {
    it('should exchange code for token and return user info', async () => {
      const mockUser = { login: 'testuser', id: 12345, avatar_url: 'https://...' };

      vi.mocked(gitHubService.verifyState).mockReturnValue({ deviceId: validDeviceId });
      vi.mocked(gitHubService.exchangeCodeForToken).mockResolvedValue({ accessToken: validToken });
      vi.mocked(gitHubService.getUser).mockResolvedValue(mockUser);
      vi.mocked(gitHubService.encryptTokenForDevice).mockReturnValue(encryptedToken);

      const { req, res, next } = createMockRequestContext({
        body: {
          code: 'auth_code_123',
          state: 'state_abc',
          deviceId: validDeviceId,
        },
      });

      await handleCallback(req as never, res as never, next);

      expect(gitHubService.verifyState).toHaveBeenCalledWith('state_abc');
      expect(gitHubService.exchangeCodeForToken).toHaveBeenCalledWith('auth_code_123');
      expect(gitHubService.getUser).toHaveBeenCalledWith(validToken);
      expect(gitHubService.encryptTokenForDevice).toHaveBeenCalledWith(validToken, validDeviceId);
      expect(res.json).toHaveBeenCalledWith({
        encryptedToken,
        user: mockUser,
      });
    });

    it('should return 400 when state verification fails', async () => {
      vi.mocked(gitHubService.verifyState).mockReturnValue(null);

      const { req, res, next } = createMockRequestContext({
        body: {
          code: 'auth_code',
          state: 'invalid_state',
          deviceId: validDeviceId,
        },
      });

      await handleCallback(req as never, res as never, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid or expired state parameter',
      });
    });

    it('should return 400 when deviceId mismatches', async () => {
      vi.mocked(gitHubService.verifyState).mockReturnValue({ deviceId: 'other-device-id-12345' });

      const { req, res, next } = createMockRequestContext({
        body: {
          code: 'auth_code',
          state: 'state',
          deviceId: validDeviceId,
        },
      });

      await handleCallback(req as never, res as never, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Device ID mismatch',
      });
    });

    it('should handle classified auth errors', async () => {
      const classifiedError = new Error('Bad credentials') as Error & { classified?: object };
      classifiedError.classified = {
        category: 'auth',
        code: 'BAD_CREDENTIALS',
        message: 'Invalid OAuth code',
      };

      vi.mocked(gitHubService.verifyState).mockReturnValue({ deviceId: validDeviceId });
      vi.mocked(gitHubService.exchangeCodeForToken).mockRejectedValue(classifiedError);

      const { req, res, next } = createMockRequestContext({
        body: { code: 'bad_code', state: 'state', deviceId: validDeviceId },
      });

      await handleCallback(req as never, res as never, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid OAuth code',
        code: 'BAD_CREDENTIALS',
      });
    });
  });

  describe('revokeAuth', () => {
    it('should revoke token successfully', async () => {
      vi.mocked(gitHubService.decryptTokenFromDevice).mockReturnValue(validToken);
      vi.mocked(gitHubService.revokeToken).mockResolvedValue(undefined);

      const { req, res, next } = createMockRequestContext({
        headers: {
          'x-github-token': encryptedToken,
          'x-device-id': validDeviceId,
        },
      });

      await revokeAuth(req as never, res as never, next);

      expect(gitHubService.revokeToken).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it('should return 401 when headers are missing', async () => {
      const { req, res, next } = createMockRequestContext({
        headers: {},
      });

      await revokeAuth(req as never, res as never, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should return 401 when token decryption fails', async () => {
      vi.mocked(gitHubService.decryptTokenFromDevice).mockImplementation(() => {
        throw new Error('Decryption failed');
      });

      const { req, res, next } = createMockRequestContext({
        headers: {
          'x-github-token': 'invalid_token',
          'x-device-id': validDeviceId,
        },
      });

      await revokeAuth(req as never, res as never, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('listRepos', () => {
    it('should list repos successfully', async () => {
      const mockRepos = [
        { id: 1, name: 'repo1', fullName: 'user/repo1' },
        { id: 2, name: 'repo2', fullName: 'user/repo2' },
      ];

      vi.mocked(gitHubService.decryptTokenFromDevice).mockReturnValue(validToken);
      vi.mocked(gitHubService.listRepos).mockResolvedValue(mockRepos);

      const { req, res, next } = createMockRequestContext({
        headers: {
          'x-github-token': encryptedToken,
          'x-device-id': validDeviceId,
        },
      });

      await listRepos(req as never, res as never, next);

      expect(gitHubService.listRepos).toHaveBeenCalledWith(validToken);
      expect(res.json).toHaveBeenCalledWith({ repos: mockRepos });
    });

    it('should handle classified errors', async () => {
      const classifiedError = new Error() as Error & { classified?: object };
      classifiedError.classified = {
        category: 'auth',
        code: 'TOKEN_EXPIRED',
        message: 'Token expired',
      };

      vi.mocked(gitHubService.decryptTokenFromDevice).mockReturnValue(validToken);
      vi.mocked(gitHubService.listRepos).mockRejectedValue(classifiedError);

      const { req, res, next } = createMockRequestContext({
        headers: {
          'x-github-token': encryptedToken,
          'x-device-id': validDeviceId,
        },
      });

      await listRepos(req as never, res as never, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('selectRepo', () => {
    it('should select existing repo successfully', async () => {
      vi.mocked(gitHubService.decryptTokenFromDevice).mockReturnValue(validToken);
      vi.mocked(gitHubService.checkRepoAccess).mockResolvedValue(true);
      vi.mocked(gitHubService.getContents).mockResolvedValue([{ name: 'README.md' }]);

      const { req, res, next } = createMockRequestContext({
        headers: {
          'x-github-token': encryptedToken,
          'x-device-id': validDeviceId,
        },
        body: {
          repo: 'user/notes',
          path: 'sandbooks',
          createIfMissing: false,
        },
      });

      await selectRepo(req as never, res as never, next);

      expect(gitHubService.checkRepoAccess).toHaveBeenCalledWith(validToken, 'user/notes');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        repo: { fullName: 'user/notes' },
        created: false,
      });
    });

    it('should create repo when createIfMissing is true and repo does not exist', async () => {
      vi.mocked(gitHubService.decryptTokenFromDevice).mockReturnValue(validToken);
      vi.mocked(gitHubService.checkRepoAccess).mockResolvedValue(false);
      vi.mocked(gitHubService.createRepo).mockResolvedValue({
        id: 123,
        name: 'notes',
        fullName: 'user/notes',
      });
      vi.mocked(gitHubService.createOrUpdateFile).mockResolvedValue({ sha: 'abc123' });

      const { req, res, next } = createMockRequestContext({
        headers: {
          'x-github-token': encryptedToken,
          'x-device-id': validDeviceId,
        },
        body: {
          repo: 'user/notes',
          path: 'sandbooks',
          createIfMissing: true,
        },
      });

      await selectRepo(req as never, res as never, next);

      expect(gitHubService.createRepo).toHaveBeenCalledWith(validToken, 'notes', true);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        repo: { id: 123, name: 'notes', fullName: 'user/notes' },
        created: true,
      });
    });

    it('should return 404 when repo does not exist and createIfMissing is false', async () => {
      vi.mocked(gitHubService.decryptTokenFromDevice).mockReturnValue(validToken);
      vi.mocked(gitHubService.checkRepoAccess).mockResolvedValue(false);

      const { req, res, next } = createMockRequestContext({
        headers: {
          'x-github-token': encryptedToken,
          'x-device-id': validDeviceId,
        },
        body: {
          repo: 'user/nonexistent',
          path: 'sandbooks',
          createIfMissing: false,
        },
      });

      await selectRepo(req as never, res as never, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Repository not found or no access',
      });
    });

    it('should create sync folder if empty', async () => {
      vi.mocked(gitHubService.decryptTokenFromDevice).mockReturnValue(validToken);
      vi.mocked(gitHubService.checkRepoAccess).mockResolvedValue(true);
      vi.mocked(gitHubService.getContents).mockResolvedValue([]); // Empty folder
      vi.mocked(gitHubService.createOrUpdateFile).mockResolvedValue({ sha: 'abc123' });

      const { req, res, next } = createMockRequestContext({
        headers: {
          'x-github-token': encryptedToken,
          'x-device-id': validDeviceId,
        },
        body: {
          repo: 'user/notes',
          path: 'sandbooks',
          createIfMissing: false,
        },
      });

      await selectRepo(req as never, res as never, next);

      expect(gitHubService.createOrUpdateFile).toHaveBeenCalledWith(
        validToken,
        'user/notes',
        'sandbooks/README.md',
        expect.stringContaining('Sandbooks Notes'),
        'sandbooks: initialize sync folder'
      );
    });
  });

  describe('pushNotes', () => {
    it('should push notes successfully', async () => {
      const mockResult = { pushed: 3, sha: 'commit123' };
      vi.mocked(gitHubService.decryptTokenFromDevice).mockReturnValue(validToken);
      vi.mocked(gitHubService.pushNotes).mockResolvedValue(mockResult);

      const notes = [
        { id: '1', title: 'Note 1', content: {}, createdAt: '', updatedAt: '' },
        { id: '2', title: 'Note 2', content: {}, createdAt: '', updatedAt: '' },
      ];

      const { req, res, next } = createMockRequestContext({
        headers: {
          'x-github-token': encryptedToken,
          'x-device-id': validDeviceId,
        },
        body: {
          repo: 'user/notes',
          path: 'sandbooks',
          notes,
          message: 'Sync notes',
        },
      });

      await pushNotes(req as never, res as never, next);

      expect(gitHubService.pushNotes).toHaveBeenCalledWith(
        validToken,
        'user/notes',
        'sandbooks',
        notes,
        'Sync notes',
        undefined
      );
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it('should include folders in push', async () => {
      vi.mocked(gitHubService.decryptTokenFromDevice).mockReturnValue(validToken);
      vi.mocked(gitHubService.pushNotes).mockResolvedValue({ pushed: 1 });

      const folders = [{ id: 'f1', name: 'Work', parentId: null }];

      const { req, res, next } = createMockRequestContext({
        headers: {
          'x-github-token': encryptedToken,
          'x-device-id': validDeviceId,
        },
        body: {
          repo: 'user/notes',
          path: 'sandbooks',
          notes: [],
          message: 'Sync',
          folders,
        },
      });

      await pushNotes(req as never, res as never, next);

      expect(gitHubService.pushNotes).toHaveBeenCalledWith(
        validToken,
        'user/notes',
        'sandbooks',
        [],
        'Sync',
        folders
      );
    });
  });

  describe('pullNotes', () => {
    it('should pull notes successfully', async () => {
      const mockResult = { notes: [], folders: [], sha: 'abc123' };
      vi.mocked(gitHubService.decryptTokenFromDevice).mockReturnValue(validToken);
      vi.mocked(gitHubService.pullNotes).mockResolvedValue(mockResult);

      const { req, res, next } = createMockRequestContext({
        headers: {
          'x-github-token': encryptedToken,
          'x-device-id': validDeviceId,
        },
        body: {
          repo: 'user/notes',
          path: 'sandbooks',
        },
      });

      await pullNotes(req as never, res as never, next);

      expect(gitHubService.pullNotes).toHaveBeenCalledWith(validToken, 'user/notes', 'sandbooks');
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle classified errors', async () => {
      const classifiedError = new Error() as Error & { classified?: object };
      classifiedError.classified = {
        category: 'rate_limit',
        code: 'RATE_LIMITED',
        message: 'Rate limit exceeded',
      };

      vi.mocked(gitHubService.decryptTokenFromDevice).mockReturnValue(validToken);
      vi.mocked(gitHubService.pullNotes).mockRejectedValue(classifiedError);

      const { req, res, next } = createMockRequestContext({
        headers: {
          'x-github-token': encryptedToken,
          'x-device-id': validDeviceId,
        },
        body: {
          repo: 'user/notes',
          path: 'sandbooks',
        },
      });

      await pullNotes(req as never, res as never, next);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getUser', () => {
    it('should return user info successfully', async () => {
      const mockUser = { login: 'testuser', id: 12345, avatar_url: 'https://...' };
      vi.mocked(gitHubService.decryptTokenFromDevice).mockReturnValue(validToken);
      vi.mocked(gitHubService.getUser).mockResolvedValue(mockUser);

      const { req, res, next } = createMockRequestContext({
        headers: {
          'x-github-token': encryptedToken,
          'x-device-id': validDeviceId,
        },
      });

      await getUser(req as never, res as never, next);

      expect(gitHubService.getUser).toHaveBeenCalledWith(validToken);
      expect(res.json).toHaveBeenCalledWith({ user: mockUser });
    });

    it('should handle auth errors', async () => {
      const classifiedError = new Error() as Error & { classified?: object };
      classifiedError.classified = {
        category: 'auth',
        code: 'UNAUTHORIZED',
        message: 'Invalid token',
      };

      vi.mocked(gitHubService.decryptTokenFromDevice).mockReturnValue(validToken);
      vi.mocked(gitHubService.getUser).mockRejectedValue(classifiedError);

      const { req, res, next } = createMockRequestContext({
        headers: {
          'x-github-token': encryptedToken,
          'x-device-id': validDeviceId,
        },
      });

      await getUser(req as never, res as never, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
});
