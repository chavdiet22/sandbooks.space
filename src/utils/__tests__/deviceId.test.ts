/**
 * Device ID utility tests.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getDeviceId, clearDeviceId } from '../deviceId';

describe('deviceId', () => {
  let mockStorage: Record<string, string>;

  beforeEach(() => {
    mockStorage = {};
    // The test setup mocks localStorage as a plain object, so we spy on window.localStorage directly
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
  });

  describe('getDeviceId', () => {
    it('should return existing device ID from storage', () => {
      const existingId = 'existing-device-id-1234567890ab';
      mockStorage['sandbooks-device-id'] = existingId;

      const id = getDeviceId();

      expect(id).toBe(existingId);
    });

    it('should generate new device ID when none exists', () => {
      const id = getDeviceId();

      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
      expect(id.length).toBe(32);
    });

    it('should store generated device ID', () => {
      const id = getDeviceId();

      expect(mockStorage['sandbooks-device-id']).toBe(id);
    });

    it('should return same ID on subsequent calls', () => {
      const id1 = getDeviceId();
      const id2 = getDeviceId();

      expect(id1).toBe(id2);
    });

    it('should generate alphanumeric ID', () => {
      const id = getDeviceId();

      // nanoid generates URL-safe characters: A-Za-z0-9_-
      expect(id).toMatch(/^[A-Za-z0-9_-]+$/);
    });
  });

  describe('clearDeviceId', () => {
    it('should remove device ID from storage', () => {
      mockStorage['sandbooks-device-id'] = 'test-id';

      clearDeviceId();

      expect(mockStorage['sandbooks-device-id']).toBeUndefined();
    });

    it('should allow generating new ID after clear', () => {
      const id1 = getDeviceId();
      clearDeviceId();
      const id2 = getDeviceId();

      expect(id2).not.toBe(id1);
    });

    it('should not throw when no device ID exists', () => {
      expect(() => clearDeviceId()).not.toThrow();
    });
  });
});
