/**
 * Payload Decoder tests.
 */
import { describe, it, expect, vi } from 'vitest';
import { faker } from '@faker-js/faker';
import { encode as msgpackEncode } from '@msgpack/msgpack';
import pako from 'pako';
import type { Note } from '../../../types';
import {
  PAYLOAD_CONSTANTS,
  PayloadDecodeError,
  PayloadExpiredError,
  PayloadVersionError,
} from '../../../types/payload.types';
import { encodePayload } from '../encoder';
import {
  decodePayload,
  decodePayloadToNote,
  isValidPayloadToken,
  getPayloadMetadata,
  getDecodeErrorMessage,
} from '../decoder';

// Factory function for notes
function createNote(overrides: Partial<Note> = {}): Note {
  return {
    id: faker.string.uuid(),
    title: 'Test Note',
    content: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Hello World' }],
        },
      ],
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('payload decoder', () => {
  describe('decodePayload', () => {
    it('should decode a valid token', () => {
      const note = createNote();
      const { token } = encodePayload(note);

      const result = decodePayload(token);

      expect(result.payloadNote).toBeDefined();
      expect(result.payloadNote.v).toBe(1);
      expect(result.metadata.version).toBe(1);
    });

    it('should throw PayloadDecodeError for null/undefined token', () => {
      expect(() => decodePayload(null as unknown as string)).toThrow(PayloadDecodeError);
      expect(() => decodePayload(undefined as unknown as string)).toThrow(PayloadDecodeError);
    });

    it('should throw PayloadDecodeError for empty token', () => {
      expect(() => decodePayload('')).toThrow(PayloadDecodeError);
    });

    it('should throw PayloadDecodeError for token too short', () => {
      expect(() => decodePayload('abc')).toThrow(PayloadDecodeError);
      expect(() => decodePayload('abc')).toThrow(/too short/i);
    });

    it('should throw PayloadDecodeError for invalid characters', () => {
      expect(() => decodePayload('invalid+token')).toThrow(PayloadDecodeError);
      expect(() => decodePayload('invalid/token')).toThrow(PayloadDecodeError);
      expect(() => decodePayload('invalid=token')).toThrow(PayloadDecodeError);
      expect(() => decodePayload('invalid token')).toThrow(PayloadDecodeError);
    });

    it('should throw PayloadDecodeError for corrupted base64', () => {
      // Valid base64url characters but garbage data
      expect(() => decodePayload('ThisIsNotValidEncodedData')).toThrow(PayloadDecodeError);
    });

    it('should return metadata with timestamps', () => {
      const note = createNote({
        createdAt: new Date('2025-01-15T12:00:00Z').toISOString(),
        updatedAt: new Date('2025-01-15T13:00:00Z').toISOString(),
      });
      const { token } = encodePayload(note);

      const result = decodePayload(token);

      // Timestamps are ISO strings to avoid Zustand serialization issues
      expect(typeof result.metadata.createdAt).toBe('string');
      expect(typeof result.metadata.updatedAt).toBe('string');
      expect(result.metadata.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(result.metadata.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(result.metadata.isExpired).toBe(false);
    });

    it('should include token length in metadata', () => {
      const note = createNote();
      const { token } = encodePayload(note);

      const result = decodePayload(token);

      expect(result.metadata.tokenLength).toBe(token.length);
    });

    it('should handle expiry metadata', () => {
      const note = createNote();
      const { token } = encodePayload(note, { expiresIn: 3600 });

      const result = decodePayload(token);

      // expiresAt is an ISO string
      expect(typeof result.metadata.expiresAt).toBe('string');
      expect(result.metadata.expiresAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(result.metadata.isExpired).toBe(false);
    });

    it('should throw PayloadExpiredError for expired token', () => {
      vi.useFakeTimers();
      const now = new Date('2025-01-15T12:00:00Z');
      vi.setSystemTime(now);

      const note = createNote();
      const { token } = encodePayload(note, { expiresIn: 60 }); // 1 minute expiry

      // Advance time beyond expiry + tolerance
      vi.advanceTimersByTime((60 + PAYLOAD_CONSTANTS.EXPIRY_TOLERANCE + 1) * 1000);

      expect(() => decodePayload(token)).toThrow(PayloadExpiredError);

      vi.useRealTimers();
    });

    it('should accept token within expiry tolerance', () => {
      vi.useFakeTimers();
      const now = new Date('2025-01-15T12:00:00Z');
      vi.setSystemTime(now);

      const note = createNote();
      const { token } = encodePayload(note, { expiresIn: 60 });

      // Advance time past expiry but within tolerance
      vi.advanceTimersByTime((60 + 60) * 1000); // 60 + 60 = 120 seconds (within 5 min tolerance)

      expect(() => decodePayload(token)).not.toThrow();

      vi.useRealTimers();
    });
  });

  describe('decodePayloadToNote', () => {
    it('should decode token directly to Note', () => {
      const originalNote = createNote({ title: 'My Note Title' });
      const { token } = encodePayload(originalNote);

      const note = decodePayloadToNote(token);

      expect(note.id).toBeDefined();
      expect(note.title).toBe('My Note Title');
      expect(note.content.type).toBe('doc');
    });

    it('should preserve note content structure', () => {
      const originalNote = createNote({
        content: {
          type: 'doc',
          content: [
            { type: 'paragraph', content: [{ type: 'text', text: 'First paragraph' }] },
            { type: 'paragraph', content: [{ type: 'text', text: 'Second paragraph' }] },
          ],
        },
      });
      const { token } = encodePayload(originalNote);

      const note = decodePayloadToNote(token);

      expect(note.content.content).toHaveLength(2);
    });

    it('should assign new ID to decoded note', () => {
      const originalNote = createNote({ id: 'original-id' });
      const { token } = encodePayload(originalNote);

      const note = decodePayloadToNote(token);

      expect(note.id).not.toBe('original-id');
    });
  });

  describe('isValidPayloadToken', () => {
    it('should return true for valid token', () => {
      const note = createNote();
      const { token } = encodePayload(note);

      expect(isValidPayloadToken(token)).toBe(true);
    });

    it('should return false for empty/null token', () => {
      expect(isValidPayloadToken('')).toBe(false);
      expect(isValidPayloadToken(null as unknown as string)).toBe(false);
    });

    it('should return false for short token', () => {
      expect(isValidPayloadToken('abc')).toBe(false);
    });

    it('should return false for invalid characters', () => {
      expect(isValidPayloadToken('invalid+token+here')).toBe(false);
    });

    it('should return false for corrupted token', () => {
      expect(isValidPayloadToken('validCharsButGarbageData12345')).toBe(false);
    });
  });

  describe('getPayloadMetadata', () => {
    it('should return metadata for valid token', () => {
      const note = createNote();
      const { token } = encodePayload(note);

      const metadata = getPayloadMetadata(token);

      expect(metadata).not.toBeNull();
      expect(metadata?.version).toBe(1);
      // createdAt is an ISO string
      expect(typeof metadata?.createdAt).toBe('string');
      expect(metadata?.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should return null for invalid token', () => {
      expect(getPayloadMetadata('')).toBeNull();
      expect(getPayloadMetadata('invalid')).toBeNull();
      expect(getPayloadMetadata('corrupted-data-here')).toBeNull();
    });
  });

  describe('getDecodeErrorMessage', () => {
    it('should return user-friendly message for PayloadExpiredError', () => {
      const error = new PayloadExpiredError(new Date());
      const message = getDecodeErrorMessage(error);

      expect(message).toContain('expired');
    });

    it('should return user-friendly message for PayloadVersionError (too new)', () => {
      const error = new PayloadVersionError(2, { min: 1, max: 1 });
      const message = getDecodeErrorMessage(error);

      expect(message).toContain('newer version');
    });

    it('should return user-friendly message for PayloadVersionError (too old)', () => {
      const error = new PayloadVersionError(0, { min: 1, max: 2 });
      // Force the code to be VERSION_TOO_OLD
      error.code = 'VERSION_TOO_OLD';
      const message = getDecodeErrorMessage(error);

      expect(message).toContain('no longer supported');
    });

    it('should return userMessage for PayloadDecodeError', () => {
      const error = new PayloadDecodeError('Technical error', 'User friendly message');
      const message = getDecodeErrorMessage(error);

      expect(message).toBe('User friendly message');
    });

    it('should return generic message for unknown errors', () => {
      const error = new Error('Unknown error');
      const message = getDecodeErrorMessage(error);

      expect(message).toContain('Could not open');
    });
  });

  describe('edge case error handling', () => {
    it('should throw PayloadDecodeError for invalid structure', () => {
      // Create a payload that's valid msgpack but invalid PayloadNote
      // Invalid payload - missing required fields
      const invalidPayload = { foo: 'bar' };

      const packed = msgpackEncode(invalidPayload);
      const compressed = pako.deflate(packed);

      const binary = String.fromCharCode(...compressed);
      const base64 = btoa(binary);
      const token = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

      expect(() => decodePayload(token)).toThrow(PayloadDecodeError);
    });

    it('should throw PayloadDecodeError for too many nodes', () => {
      // Create payload with exactly MAX_NODE_COUNT + 1 nodes
      const manyNodes = Array.from({ length: PAYLOAD_CONSTANTS.MAX_NODE_COUNT + 1 }, () => [
        0, // Paragraph type
        ['text'],
      ]);

      const mockPayload = {
        v: 1,
        t: 'Test',
        c: Math.floor(Date.now() / 1000),
        u: Math.floor(Date.now() / 1000),
        n: manyNodes,
      };

      const packed = msgpackEncode(mockPayload);
      const compressed = pako.deflate(packed);

      const binary = String.fromCharCode(...compressed);
      const base64 = btoa(binary);
      const token = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

      expect(() => decodePayload(token)).toThrow(PayloadDecodeError);
    });
  });

  describe('round-trip encoding/decoding', () => {
    it('should preserve paragraph content', () => {
      const originalNote = createNote({
        content: {
          type: 'doc',
          content: [
            { type: 'paragraph', content: [{ type: 'text', text: 'Hello World' }] },
          ],
        },
      });

      const { token } = encodePayload(originalNote);
      const decoded = decodePayloadToNote(token);

      expect(decoded.content.content?.[0]?.type).toBe('paragraph');
      expect(decoded.content.content?.[0]?.content?.[0]?.text).toBe('Hello World');
    });

    it('should preserve heading content', () => {
      const originalNote = createNote({
        content: {
          type: 'doc',
          content: [
            {
              type: 'heading',
              attrs: { level: 2 },
              content: [{ type: 'text', text: 'Title' }],
            },
          ],
        },
      });

      const { token } = encodePayload(originalNote);
      const decoded = decodePayloadToNote(token);

      expect(decoded.content.content?.[0]?.type).toBe('heading');
      expect(decoded.content.content?.[0]?.attrs?.level).toBe(2);
    });

    it('should preserve code block content', () => {
      const originalNote = createNote({
        content: {
          type: 'doc',
          content: [
            {
              type: 'executableCodeBlock',
              attrs: { language: 'python', code: 'print("hello")' },
            },
          ],
        },
      });

      const { token } = encodePayload(originalNote);
      const decoded = decodePayloadToNote(token);

      expect(decoded.content.content?.[0]?.type).toBe('executableCodeBlock');
      expect(decoded.content.content?.[0]?.attrs?.language).toBe('python');
      expect(decoded.content.content?.[0]?.attrs?.code).toBe('print("hello")');
    });

    it('should preserve text marks', () => {
      const originalNote = createNote({
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: 'Bold', marks: [{ type: 'bold' }] },
              ],
            },
          ],
        },
      });

      const { token } = encodePayload(originalNote);
      const decoded = decodePayloadToNote(token);

      const textNode = decoded.content.content?.[0]?.content?.[0];
      expect(textNode?.text).toBe('Bold');
      expect(textNode?.marks).toContainEqual({ type: 'bold' });
    });

    it('should preserve tags', () => {
      const originalNote = createNote({
        tags: [
          { id: '1', name: 'urgent', color: 'red', createdAt: 0, updatedAt: 0 },
        ],
      });

      const { token } = encodePayload(originalNote);
      const decoded = decodePayloadToNote(token);

      expect(decoded.tags).toHaveLength(1);
      expect(decoded.tags?.[0]?.name).toBe('urgent');
      expect(decoded.tags?.[0]?.color).toBe('red');
    });
  });
});
