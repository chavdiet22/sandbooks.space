/**
 * GitHub Crypto utility tests.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { faker } from '@faker-js/faker';
import {
  encryptToken,
  decryptToken,
  generateOAuthState,
  verifyOAuthState,
  redactToken,
} from './githubCrypto';

describe('githubCrypto', () => {
  const mockDeviceId = faker.string.alphanumeric(32);
  const mockClientSecret = faker.string.alphanumeric(64);
  const mockToken = 'gho_' + faker.string.alphanumeric(36);

  describe('encryptToken / decryptToken', () => {
    it('should encrypt and decrypt a token successfully', () => {
      const encrypted = encryptToken(mockToken, mockDeviceId, mockClientSecret);
      const decrypted = decryptToken(encrypted, mockDeviceId, mockClientSecret);

      expect(decrypted).toBe(mockToken);
    });

    it('should produce different ciphertext for same token (random IV)', () => {
      const encrypted1 = encryptToken(mockToken, mockDeviceId, mockClientSecret);
      const encrypted2 = encryptToken(mockToken, mockDeviceId, mockClientSecret);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should produce base64 encoded output', () => {
      const encrypted = encryptToken(mockToken, mockDeviceId, mockClientSecret);

      // Should be valid base64
      expect(() => Buffer.from(encrypted, 'base64')).not.toThrow();
    });

    it('should fail decryption with wrong deviceId', () => {
      const encrypted = encryptToken(mockToken, mockDeviceId, mockClientSecret);
      const wrongDeviceId = faker.string.alphanumeric(32);

      expect(() => {
        decryptToken(encrypted, wrongDeviceId, mockClientSecret);
      }).toThrow();
    });

    it('should fail decryption with wrong clientSecret', () => {
      const encrypted = encryptToken(mockToken, mockDeviceId, mockClientSecret);
      const wrongSecret = faker.string.alphanumeric(64);

      expect(() => {
        decryptToken(encrypted, mockDeviceId, wrongSecret);
      }).toThrow();
    });

    it('should fail decryption with tampered ciphertext', () => {
      const encrypted = encryptToken(mockToken, mockDeviceId, mockClientSecret);
      const buffer = Buffer.from(encrypted, 'base64');
      buffer[20] ^= 0xff; // Flip some bits
      const tampered = buffer.toString('base64');

      expect(() => {
        decryptToken(tampered, mockDeviceId, mockClientSecret);
      }).toThrow();
    });

    it('should handle short tokens', () => {
      const shortToken = 'abc';
      const encrypted = encryptToken(shortToken, mockDeviceId, mockClientSecret);
      const decrypted = decryptToken(encrypted, mockDeviceId, mockClientSecret);

      expect(decrypted).toBe(shortToken);
    });

    it('should handle long tokens', () => {
      const longToken = faker.string.alphanumeric(1000);
      const encrypted = encryptToken(longToken, mockDeviceId, mockClientSecret);
      const decrypted = decryptToken(encrypted, mockDeviceId, mockClientSecret);

      expect(decrypted).toBe(longToken);
    });

    it('should handle tokens with special characters', () => {
      const specialToken = 'token_with_special_chars!@#$%^&*()_+={}[]|\\:";\'<>,.?/';
      const encrypted = encryptToken(specialToken, mockDeviceId, mockClientSecret);
      const decrypted = decryptToken(encrypted, mockDeviceId, mockClientSecret);

      expect(decrypted).toBe(specialToken);
    });

    it('should handle unicode in tokens', () => {
      const unicodeToken = 'token_with_emoji_🔐_and_中文';
      const encrypted = encryptToken(unicodeToken, mockDeviceId, mockClientSecret);
      const decrypted = decryptToken(encrypted, mockDeviceId, mockClientSecret);

      expect(decrypted).toBe(unicodeToken);
    });
  });

  describe('generateOAuthState / verifyOAuthState', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-01-15T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should generate and verify state successfully', () => {
      const state = generateOAuthState(mockDeviceId, mockClientSecret);
      const result = verifyOAuthState(state, mockClientSecret);

      expect(result).not.toBeNull();
      expect(result?.deviceId).toBe(mockDeviceId);
    });

    it('should produce different state each time (random nonce)', () => {
      const state1 = generateOAuthState(mockDeviceId, mockClientSecret);
      const state2 = generateOAuthState(mockDeviceId, mockClientSecret);

      expect(state1).not.toBe(state2);
    });

    it('should return base64url encoded string', () => {
      const state = generateOAuthState(mockDeviceId, mockClientSecret);

      // base64url should not contain +, /, or =
      expect(state).not.toMatch(/[+/=]/);
    });

    it('should reject state with wrong clientSecret', () => {
      const state = generateOAuthState(mockDeviceId, mockClientSecret);
      const wrongSecret = faker.string.alphanumeric(64);

      const result = verifyOAuthState(state, wrongSecret);

      expect(result).toBeNull();
    });

    it('should reject expired state (after 5 minutes)', () => {
      const state = generateOAuthState(mockDeviceId, mockClientSecret);

      // Advance time by 6 minutes
      vi.advanceTimersByTime(6 * 60 * 1000);

      const result = verifyOAuthState(state, mockClientSecret);

      expect(result).toBeNull();
    });

    it('should accept state within timeout window', () => {
      const state = generateOAuthState(mockDeviceId, mockClientSecret);

      // Advance time by 4 minutes
      vi.advanceTimersByTime(4 * 60 * 1000);

      const result = verifyOAuthState(state, mockClientSecret);

      expect(result).not.toBeNull();
      expect(result?.deviceId).toBe(mockDeviceId);
    });

    it('should accept custom maxAgeMs', () => {
      const state = generateOAuthState(mockDeviceId, mockClientSecret);

      // Advance time by 2 minutes
      vi.advanceTimersByTime(2 * 60 * 1000);

      // Use 1 minute max age
      const result = verifyOAuthState(state, mockClientSecret, 60 * 1000);

      expect(result).toBeNull();
    });

    it('should reject tampered state (invalid signature)', () => {
      const state = generateOAuthState(mockDeviceId, mockClientSecret);

      // Decode, modify, and re-encode
      const decoded = JSON.parse(Buffer.from(state, 'base64url').toString());
      decoded.signature = 'tampered_' + decoded.signature.substring(9);
      const tampered = Buffer.from(JSON.stringify(decoded)).toString('base64url');

      const result = verifyOAuthState(tampered, mockClientSecret);

      expect(result).toBeNull();
    });

    it('should reject malformed state (invalid JSON)', () => {
      const invalid = Buffer.from('not valid json').toString('base64url');

      const result = verifyOAuthState(invalid, mockClientSecret);

      expect(result).toBeNull();
    });

    it('should reject malformed state (invalid base64)', () => {
      const result = verifyOAuthState('not-base64!!!', mockClientSecret);

      expect(result).toBeNull();
    });

    it('should reject state with missing data field', () => {
      const invalid = Buffer.from(JSON.stringify({ signature: 'abc' })).toString('base64url');

      const result = verifyOAuthState(invalid, mockClientSecret);

      expect(result).toBeNull();
    });
  });

  describe('redactToken', () => {
    it('should redact long tokens showing first 4 chars', () => {
      const token = 'gho_abcdef123456';
      const redacted = redactToken(token);

      expect(redacted).toBe('gho_...[REDACTED]');
    });

    it('should return [EMPTY] for null', () => {
      const redacted = redactToken(null);

      expect(redacted).toBe('[EMPTY]');
    });

    it('should return [EMPTY] for undefined', () => {
      const redacted = redactToken(undefined);

      expect(redacted).toBe('[EMPTY]');
    });

    it('should return [EMPTY] for empty string', () => {
      const redacted = redactToken('');

      expect(redacted).toBe('[EMPTY]');
    });

    it('should return [REDACTED] for tokens 8 chars or less', () => {
      expect(redactToken('abcd')).toBe('[REDACTED]');
      expect(redactToken('abcdefgh')).toBe('[REDACTED]');
    });

    it('should show first 4 chars for tokens longer than 8 chars', () => {
      expect(redactToken('abcdefghi')).toBe('abcd...[REDACTED]');
    });
  });
});
