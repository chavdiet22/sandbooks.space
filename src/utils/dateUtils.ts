/**
 * Type-safe date conversion utilities.
 * Prevents crashes when timestamps have unexpected types (string, number, Date, malformed).
 */

/**
 * Safely convert any timestamp value to milliseconds (number).
 * Handles: number, string (ISO), Date object, undefined, null, malformed data.
 *
 * @param value - The timestamp value to normalize
 * @param fallback - Fallback value if conversion fails (default: Date.now())
 * @returns Timestamp in milliseconds
 */
export function toTimestampMs(value: unknown, fallback: number = Date.now()): number {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return fallback;
  }

  // Already a number - validate it's reasonable
  if (typeof value === 'number') {
    // Check for valid finite number within reasonable timestamp range (2000-2100)
    const MIN_VALID = new Date('2000-01-01').getTime();
    const MAX_VALID = new Date('2100-01-01').getTime();
    if (Number.isFinite(value) && value >= MIN_VALID && value <= MAX_VALID) {
      return value;
    }
    return fallback;
  }

  // String (ISO format or other parseable format)
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
    return fallback;
  }

  // Date object
  if (value instanceof Date) {
    const ms = value.getTime();
    if (!Number.isNaN(ms)) {
      return ms;
    }
    return fallback;
  }

  // Unknown type - return fallback
  return fallback;
}

/**
 * Safely convert any timestamp value to ISO string.
 * Handles: number, string (ISO), Date object, undefined, null, malformed data.
 *
 * @param value - The timestamp value to normalize
 * @param fallback - Fallback Date if conversion fails (default: new Date())
 * @returns ISO date string
 */
export function toISOString(value: unknown, fallback?: Date): string {
  const ms = toTimestampMs(value, fallback?.getTime() ?? Date.now());
  return new Date(ms).toISOString();
}
