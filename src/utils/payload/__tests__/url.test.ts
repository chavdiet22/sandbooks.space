/**
 * Payload URL utilities tests.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PAYLOAD_CONSTANTS } from '../../../types/payload.types';
import {
  parsePayloadUrl,
  isCurrentUrlPayload,
  createPayloadUrl,
  createPayloadHash,
  getBaseUrl,
  clearPayloadFromUrl,
  setPayloadInUrl,
  hasUrlHash,
  getUrlHash,
} from '../url';

describe('payload url utilities', () => {
  describe('parsePayloadUrl', () => {
    it('should parse valid payload URL', () => {
      const url = 'https://sandbooks.space/#/p/validToken123';
      const result = parsePayloadUrl(url);

      expect(result.isPayload).toBe(true);
      if (result.isPayload) {
        expect(result.token).toBe('validToken123');
      }
    });

    it('should parse hash-only format', () => {
      const hash = '#/p/validToken456';
      const result = parsePayloadUrl(hash);

      expect(result.isPayload).toBe(true);
      if (result.isPayload) {
        expect(result.token).toBe('validToken456');
      }
    });

    it('should return false for non-payload URL', () => {
      const url = 'https://sandbooks.space/notes/123';
      const result = parsePayloadUrl(url);

      expect(result.isPayload).toBe(false);
    });

    it('should return false for wrong hash prefix', () => {
      const url = 'https://sandbooks.space/#/notes/123';
      const result = parsePayloadUrl(url);

      expect(result.isPayload).toBe(false);
    });

    it('should return false for empty token', () => {
      const url = 'https://sandbooks.space/#/p/';
      const result = parsePayloadUrl(url);

      expect(result.isPayload).toBe(false);
    });

    it('should return false for token too short', () => {
      const url = 'https://sandbooks.space/#/p/abc';
      const result = parsePayloadUrl(url);

      expect(result.isPayload).toBe(false);
    });

    it('should return false for invalid characters in token', () => {
      const url = 'https://sandbooks.space/#/p/invalid+token';
      const result = parsePayloadUrl(url);

      expect(result.isPayload).toBe(false);
    });

    it('should return false for invalid URL', () => {
      const result = parsePayloadUrl('not a valid url');
      expect(result.isPayload).toBe(false);
    });

    it('should handle base64url safe characters', () => {
      // Base64url uses - and _ instead of + and /
      const url = 'https://sandbooks.space/#/p/valid-token_123';
      const result = parsePayloadUrl(url);

      expect(result.isPayload).toBe(true);
      if (result.isPayload) {
        expect(result.token).toBe('valid-token_123');
      }
    });
  });

  describe('isCurrentUrlPayload', () => {
    const originalWindow = global.window;

    afterEach(() => {
      global.window = originalWindow;
    });

    it('should return false when window is undefined', () => {
      // @ts-expect-error Testing SSR scenario
      delete global.window;
      const result = isCurrentUrlPayload();
      expect(result.isPayload).toBe(false);
    });

    it('should check current window hash', () => {
      global.window = {
        location: {
          hash: '#/p/currentToken',
        },
      } as Window & typeof globalThis;

      const result = isCurrentUrlPayload();

      expect(result.isPayload).toBe(true);
      if (result.isPayload) {
        expect(result.token).toBe('currentToken');
      }
    });

    it('should return false for non-payload hash', () => {
      global.window = {
        location: {
          hash: '#/notes/123',
        },
      } as Window & typeof globalThis;

      const result = isCurrentUrlPayload();
      expect(result.isPayload).toBe(false);
    });
  });

  describe('createPayloadUrl', () => {
    const originalWindow = global.window;

    afterEach(() => {
      global.window = originalWindow;
    });

    it('should create full URL with token', () => {
      global.window = {
        location: {
          origin: 'https://sandbooks.space',
          pathname: '/',
        },
      } as Window & typeof globalThis;

      const url = createPayloadUrl('myToken123');

      expect(url).toBe('https://sandbooks.space/#/p/myToken123');
    });

    it('should use fallback URL when window undefined', () => {
      // @ts-expect-error Testing SSR scenario
      delete global.window;

      const url = createPayloadUrl('myToken123');

      expect(url).toBe('https://sandbooks.space/#/p/myToken123');
    });
  });

  describe('createPayloadHash', () => {
    it('should create hash with token', () => {
      const hash = createPayloadHash('myToken');
      expect(hash).toBe('#/p/myToken');
    });

    it('should use correct prefix', () => {
      const hash = createPayloadHash('test');
      expect(hash.startsWith(PAYLOAD_CONSTANTS.URL_PREFIX)).toBe(true);
    });
  });

  describe('getBaseUrl', () => {
    const originalWindow = global.window;

    afterEach(() => {
      global.window = originalWindow;
    });

    it('should return fallback when window undefined', () => {
      // @ts-expect-error Testing SSR scenario
      delete global.window;

      const baseUrl = getBaseUrl();
      expect(baseUrl).toBe('https://sandbooks.space/');
    });

    it('should return current origin and pathname', () => {
      global.window = {
        location: {
          origin: 'http://localhost:5173',
          pathname: '/app/',
        },
      } as Window & typeof globalThis;

      const baseUrl = getBaseUrl();
      expect(baseUrl).toBe('http://localhost:5173/app/');
    });
  });

  describe('clearPayloadFromUrl', () => {
    const originalWindow = global.window;
    let replaceStateMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      replaceStateMock = vi.fn();
      global.window = {
        location: {
          origin: 'https://sandbooks.space',
          pathname: '/',
          hash: '#/p/token',
        },
        history: {
          replaceState: replaceStateMock,
        },
      } as unknown as Window & typeof globalThis;
    });

    afterEach(() => {
      global.window = originalWindow;
    });

    it('should clear hash from URL', () => {
      clearPayloadFromUrl();

      expect(replaceStateMock).toHaveBeenCalledWith(
        null,
        '',
        'https://sandbooks.space/'
      );
    });

    it('should do nothing when window undefined', () => {
      // @ts-expect-error Testing SSR scenario
      delete global.window;

      expect(() => clearPayloadFromUrl()).not.toThrow();
    });
  });

  describe('setPayloadInUrl', () => {
    const originalWindow = global.window;
    let replaceStateMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      replaceStateMock = vi.fn();
      global.window = {
        history: {
          replaceState: replaceStateMock,
        },
      } as unknown as Window & typeof globalThis;
    });

    afterEach(() => {
      global.window = originalWindow;
    });

    it('should set payload hash in URL', () => {
      setPayloadInUrl('newToken');

      expect(replaceStateMock).toHaveBeenCalledWith(
        null,
        '',
        '#/p/newToken'
      );
    });

    it('should do nothing when window undefined', () => {
      // @ts-expect-error Testing SSR scenario
      delete global.window;

      expect(() => setPayloadInUrl('token')).not.toThrow();
    });
  });

  describe('hasUrlHash', () => {
    const originalWindow = global.window;

    afterEach(() => {
      global.window = originalWindow;
    });

    it('should return false when window undefined', () => {
      // @ts-expect-error Testing SSR scenario
      delete global.window;

      expect(hasUrlHash()).toBe(false);
    });

    it('should return true when hash exists', () => {
      global.window = {
        location: {
          hash: '#something',
        },
      } as Window & typeof globalThis;

      expect(hasUrlHash()).toBe(true);
    });

    it('should return false when hash is empty', () => {
      global.window = {
        location: {
          hash: '',
        },
      } as Window & typeof globalThis;

      expect(hasUrlHash()).toBe(false);
    });

    it('should return false when hash is just #', () => {
      global.window = {
        location: {
          hash: '#',
        },
      } as Window & typeof globalThis;

      expect(hasUrlHash()).toBe(false);
    });
  });

  describe('getUrlHash', () => {
    const originalWindow = global.window;

    afterEach(() => {
      global.window = originalWindow;
    });

    it('should return empty string when window undefined', () => {
      // @ts-expect-error Testing SSR scenario
      delete global.window;

      expect(getUrlHash()).toBe('');
    });

    it('should return hash without # prefix', () => {
      global.window = {
        location: {
          hash: '#/p/token',
        },
      } as Window & typeof globalThis;

      expect(getUrlHash()).toBe('/p/token');
    });

    it('should return empty string for empty hash', () => {
      global.window = {
        location: {
          hash: '',
        },
      } as Window & typeof globalThis;

      expect(getUrlHash()).toBe('');
    });
  });
});
