import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { toTimestampMs, toISOString } from '../dateUtils';

describe('dateUtils', () => {
  const FIXED_NOW = 1700000000000; // Nov 14, 2023

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('toTimestampMs', () => {
    it('should handle number input (valid timestamp)', () => {
      const ts = 1700000000000;
      expect(toTimestampMs(ts)).toBe(ts);
    });

    it('should handle ISO string input', () => {
      const isoStr = '2024-01-15T12:00:00.000Z';
      expect(toTimestampMs(isoStr)).toBe(Date.parse(isoStr));
    });

    it('should handle Date object input', () => {
      const date = new Date('2024-01-15T12:00:00.000Z');
      expect(toTimestampMs(date)).toBe(date.getTime());
    });

    it('should return fallback for null', () => {
      const fallback = 1234567890000;
      expect(toTimestampMs(null, fallback)).toBe(fallback);
    });

    it('should return fallback for undefined', () => {
      const fallback = 1234567890000;
      expect(toTimestampMs(undefined, fallback)).toBe(fallback);
    });

    it('should return default fallback (Date.now()) when no fallback provided', () => {
      expect(toTimestampMs(null)).toBe(FIXED_NOW);
      expect(toTimestampMs(undefined)).toBe(FIXED_NOW);
    });

    it('should return fallback for invalid string', () => {
      const fallback = 1234567890000;
      expect(toTimestampMs('not-a-date', fallback)).toBe(fallback);
    });

    it('should return fallback for empty string', () => {
      const fallback = 1234567890000;
      expect(toTimestampMs('', fallback)).toBe(fallback);
    });

    it('should return fallback for NaN', () => {
      const fallback = 1234567890000;
      expect(toTimestampMs(NaN, fallback)).toBe(fallback);
    });

    it('should return fallback for Infinity', () => {
      const fallback = 1234567890000;
      expect(toTimestampMs(Infinity, fallback)).toBe(fallback);
      expect(toTimestampMs(-Infinity, fallback)).toBe(fallback);
    });

    it('should return fallback for number outside valid range', () => {
      const fallback = 1234567890000;
      // Before year 2000
      expect(toTimestampMs(0, fallback)).toBe(fallback);
      // After year 2100
      expect(toTimestampMs(5000000000000, fallback)).toBe(fallback);
    });

    it('should handle object without crashing (regression for t.valueOf error)', () => {
      const badObj = { valueOf: 'not a function' };
      const fallback = 1234567890000;
      expect(toTimestampMs(badObj, fallback)).toBe(fallback);
    });

    it('should handle array without crashing', () => {
      const fallback = 1234567890000;
      expect(toTimestampMs([1, 2, 3], fallback)).toBe(fallback);
    });

    it('should handle boolean without crashing', () => {
      const fallback = 1234567890000;
      expect(toTimestampMs(true, fallback)).toBe(fallback);
      expect(toTimestampMs(false, fallback)).toBe(fallback);
    });

    it('should handle Invalid Date object', () => {
      const invalidDate = new Date('invalid');
      const fallback = 1234567890000;
      expect(toTimestampMs(invalidDate, fallback)).toBe(fallback);
    });
  });

  describe('toISOString', () => {
    it('should convert number to ISO string', () => {
      const ts = 1705320000000; // 2024-01-15T12:00:00.000Z
      expect(toISOString(ts)).toBe(new Date(ts).toISOString());
    });

    it('should pass through valid ISO string', () => {
      const isoStr = '2024-01-15T12:00:00.000Z';
      const result = toISOString(isoStr);
      // Result should be equivalent ISO string (might differ in format)
      expect(new Date(result).getTime()).toBe(Date.parse(isoStr));
    });

    it('should handle undefined with default fallback', () => {
      const result = toISOString(undefined);
      expect(result).toBe(new Date(FIXED_NOW).toISOString());
    });

    it('should handle undefined with explicit fallback', () => {
      const fallback = new Date('2024-01-01T00:00:00.000Z');
      expect(toISOString(undefined, fallback)).toBe(fallback.toISOString());
    });

    it('should handle null with fallback', () => {
      const fallback = new Date('2024-01-01T00:00:00.000Z');
      expect(toISOString(null, fallback)).toBe(fallback.toISOString());
    });

    it('should handle malformed input without crashing', () => {
      const badObj = { valueOf: 'not a function' };
      // Should not throw, should return valid ISO string
      expect(() => toISOString(badObj)).not.toThrow();
      const result = toISOString(badObj);
      expect(typeof result).toBe('string');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    });
  });
});
