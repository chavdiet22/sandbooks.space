/**
 * Payload Encoder tests.
 */
import { describe, it, expect } from 'vitest';
import { faker } from '@faker-js/faker';
import type { Note } from '../../../types';
import {
  PAYLOAD_CONSTANTS,
  PayloadEncodeError,
  PayloadTooLargeError,
} from '../../../types/payload.types';
import { encodePayload, estimateEncodedSize } from '../encoder';

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

describe('payload encoder', () => {
  describe('encodePayload', () => {
    it('should encode a simple note', () => {
      const note = createNote();
      const result = encodePayload(note);

      expect(result.token).toBeDefined();
      expect(typeof result.token).toBe('string');
      expect(result.stats.tokenLength).toBe(result.token.length);
    });

    it('should return encoding statistics', () => {
      const note = createNote();
      const result = encodePayload(note);

      expect(result.stats.originalSize).toBeGreaterThan(0);
      expect(result.stats.compressedSize).toBeGreaterThan(0);
      expect(result.stats.tokenLength).toBeGreaterThan(0);
      expect(result.stats.nodeCount).toBe(1);
    });

    it('should produce base64url-safe token', () => {
      const note = createNote();
      const result = encodePayload(note);

      // Base64url should not contain +, /, or =
      expect(result.token).not.toMatch(/[+/=]/);
      expect(result.token).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('should throw PayloadEncodeError for null note', () => {
      expect(() => encodePayload(null as unknown as Note)).toThrow(PayloadEncodeError);
    });

    it('should throw PayloadEncodeError for empty note content', () => {
      const note = createNote({
        content: { type: 'doc', content: [] },
      });

      expect(() => encodePayload(note)).toThrow(PayloadEncodeError);
      expect(() => encodePayload(note)).toThrow('Cannot share an empty note');
    });

    it('should throw PayloadEncodeError for null content', () => {
      const note = createNote({
        content: null as unknown as Note['content'],
      });

      expect(() => encodePayload(note)).toThrow(PayloadEncodeError);
    });

    it('should include expiry timestamp when expiresIn provided', () => {
      const note = createNote();
      const _beforeEncode = Math.floor(Date.now() / 1000);
      const result = encodePayload(note, { expiresIn: 3600 });

      // Token should include expiry info (we can't decode here, but token should be different)
      const resultWithoutExpiry = encodePayload(note);
      expect(result.token).not.toBe(resultWithoutExpiry.token);
    });

    it('should count nodes correctly', () => {
      const note = createNote({
        content: {
          type: 'doc',
          content: [
            { type: 'paragraph', content: [{ type: 'text', text: 'Line 1' }] },
            { type: 'paragraph', content: [{ type: 'text', text: 'Line 2' }] },
            { type: 'paragraph', content: [{ type: 'text', text: 'Line 3' }] },
          ],
        },
      });

      const result = encodePayload(note);
      expect(result.stats.nodeCount).toBe(3);
    });

    it('should throw PayloadEncodeError for too many nodes', () => {
      // Create note with more nodes than MAX_NODE_COUNT
      const manyParagraphs = Array.from({ length: PAYLOAD_CONSTANTS.MAX_NODE_COUNT + 10 }, (_, i) => ({
        type: 'paragraph',
        content: [{ type: 'text', text: `Node ${i}` }],
      }));

      const note = createNote({
        content: { type: 'doc', content: manyParagraphs },
      });

      expect(() => encodePayload(note)).toThrow(PayloadEncodeError);
      expect(() => encodePayload(note)).toThrow(/too many elements/i);
    });

    it('should handle code blocks', () => {
      const note = createNote({
        content: {
          type: 'doc',
          content: [
            {
              type: 'executableCodeBlock',
              attrs: {
                language: 'python',
                code: 'print("hello")',
              },
            },
          ],
        },
      });

      const result = encodePayload(note);
      expect(result.stats.nodeCount).toBe(1);
      expect(result.token).toBeDefined();
    });

    it('should handle headings with levels', () => {
      const note = createNote({
        content: {
          type: 'doc',
          content: [
            {
              type: 'heading',
              attrs: { level: 1 },
              content: [{ type: 'text', text: 'Title' }],
            },
          ],
        },
      });

      const result = encodePayload(note);
      expect(result.stats.nodeCount).toBe(1);
    });

    it('should handle text with marks', () => {
      const note = createNote({
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: 'Bold', marks: [{ type: 'bold' }] },
                { type: 'text', text: ' and ' },
                { type: 'text', text: 'italic', marks: [{ type: 'italic' }] },
              ],
            },
          ],
        },
      });

      const result = encodePayload(note);
      expect(result.token).toBeDefined();
    });

    it('should handle lists', () => {
      const note = createNote({
        content: {
          type: 'doc',
          content: [
            {
              type: 'bulletList',
              content: [
                {
                  type: 'listItem',
                  content: [
                    {
                      type: 'paragraph',
                      content: [{ type: 'text', text: 'Item 1' }],
                    },
                  ],
                },
                {
                  type: 'listItem',
                  content: [
                    {
                      type: 'paragraph',
                      content: [{ type: 'text', text: 'Item 2' }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      });

      const result = encodePayload(note);
      expect(result.stats.nodeCount).toBe(5); // bulletList + 2 listItems + 2 paragraphs
    });

    it('should handle task lists', () => {
      const note = createNote({
        content: {
          type: 'doc',
          content: [
            {
              type: 'taskList',
              content: [
                {
                  type: 'taskItem',
                  attrs: { checked: true },
                  content: [
                    {
                      type: 'paragraph',
                      content: [{ type: 'text', text: 'Done' }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      });

      const result = encodePayload(note);
      expect(result.token).toBeDefined();
    });

    it('should handle blockquotes', () => {
      const note = createNote({
        content: {
          type: 'doc',
          content: [
            {
              type: 'blockquote',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Quote text' }],
                },
              ],
            },
          ],
        },
      });

      const result = encodePayload(note);
      expect(result.stats.nodeCount).toBe(2); // blockquote + paragraph
    });

    it('should handle horizontal rules', () => {
      const note = createNote({
        content: {
          type: 'doc',
          content: [
            { type: 'paragraph', content: [{ type: 'text', text: 'Before' }] },
            { type: 'horizontalRule' },
            { type: 'paragraph', content: [{ type: 'text', text: 'After' }] },
          ],
        },
      });

      const result = encodePayload(note);
      expect(result.stats.nodeCount).toBe(3);
    });

    it('should compress effectively', () => {
      // Create a note with repetitive content (compresses well)
      const repetitiveText = 'This text repeats. '.repeat(50);
      const note = createNote({
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: repetitiveText }],
            },
          ],
        },
      });

      const result = encodePayload(note);

      // Compressed should be smaller than original
      expect(result.stats.compressedSize).toBeLessThan(result.stats.originalSize);
    });
  });

  describe('estimateEncodedSize', () => {
    it('should estimate size for simple note', () => {
      const note = createNote();
      const estimate = estimateEncodedSize(note);

      expect(estimate.estimated).toBeGreaterThan(0);
      expect(typeof estimate.wouldFit).toBe('boolean');
      expect(['high', 'medium', 'low']).toContain(estimate.confidence);
    });

    it('should return high confidence for small notes', () => {
      const note = createNote({
        content: {
          type: 'doc',
          content: [
            { type: 'paragraph', content: [{ type: 'text', text: 'Short' }] },
          ],
        },
      });

      const estimate = estimateEncodedSize(note);
      expect(estimate.confidence).toBe('high');
    });

    it('should return medium confidence for medium notes', () => {
      const mediumText = 'Medium text '.repeat(200);
      const note = createNote({
        content: {
          type: 'doc',
          content: [
            { type: 'paragraph', content: [{ type: 'text', text: mediumText }] },
          ],
        },
      });

      const estimate = estimateEncodedSize(note);
      expect(['medium', 'low']).toContain(estimate.confidence);
    });

    it('should return low confidence for large notes', () => {
      const largeText = 'Large text content. '.repeat(500);
      const note = createNote({
        content: {
          type: 'doc',
          content: [
            { type: 'paragraph', content: [{ type: 'text', text: largeText }] },
          ],
        },
      });

      const estimate = estimateEncodedSize(note);
      expect(estimate.confidence).toBe('low');
    });

    it('should indicate if note would fit within limit', () => {
      const note = createNote();
      const estimate = estimateEncodedSize(note);

      // Small note should fit
      expect(estimate.wouldFit).toBe(true);
    });

    it('should handle estimation errors gracefully', () => {
      // Create note with circular reference that will cause JSON.stringify to throw
      const note = createNote();
      const circular: Record<string, unknown> = { type: 'doc' };
      circular.self = circular; // Create circular reference
      note.content = circular as Note['content'];

      const estimate = estimateEncodedSize(note);

      expect(estimate.estimated).toBe(Infinity);
      expect(estimate.wouldFit).toBe(false);
      expect(estimate.confidence).toBe('low');
    });
  });

  describe('encodePayload size limits', () => {
    it('should throw PayloadTooLargeError when note exceeds size limit', () => {
      // Create a very large note with random content that won't compress well
      // Use faker to generate random text that compresses poorly
      const manyParagraphs = Array.from({ length: 200 }, () => ({
        type: 'paragraph',
        content: [{ type: 'text', text: faker.lorem.paragraphs(10) + faker.string.uuid() }],
      }));

      const note = createNote({
        content: {
          type: 'doc',
          content: manyParagraphs,
        },
      });

      expect(() => encodePayload(note)).toThrow(PayloadTooLargeError);
    });
  });

  describe('PayloadTooLargeError', () => {
    it('should provide suggestions', () => {
      const error = new PayloadTooLargeError(10000, 8000);

      expect(error.estimatedSize).toBe(10000);
      expect(error.maxAllowed).toBe(8000);
      expect(error.suggestions).toBeInstanceOf(Array);
      expect(error.suggestions.length).toBeGreaterThan(0);
    });

    it('should have correct error message', () => {
      const error = new PayloadTooLargeError(10000, 8000);

      expect(error.message).toContain('10000');
      expect(error.message).toContain('8000');
    });
  });
});
