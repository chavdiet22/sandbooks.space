/**
 * Content Sanitizer tests.
 */
import { describe, it, expect } from 'vitest';
import type { JSONContent } from '@tiptap/react';
import {
  sanitizeContent,
  needsSanitization,
  sanitizeNoteContent,
  sanitizeNotes,
} from '../contentSanitizer';

describe('contentSanitizer', () => {
  describe('sanitizeContent', () => {
    it('should return null/undefined as-is', () => {
      expect(sanitizeContent(null as unknown as JSONContent)).toBe(null);
      expect(sanitizeContent(undefined as unknown as JSONContent)).toBe(undefined);
    });

    it('should preserve valid text nodes', () => {
      const content: JSONContent = { type: 'text', text: 'Hello' };
      const result = sanitizeContent(content);

      expect(result.type).toBe('text');
      expect(result.text).toBe('Hello');
    });

    it('should mark empty text nodes for removal', () => {
      const content: JSONContent = { type: 'text', text: '' };
      const result = sanitizeContent(content);

      expect(result.type).toBe('__empty__');
    });

    it('should mark text nodes with undefined text for removal', () => {
      const content: JSONContent = { type: 'text' };
      const result = sanitizeContent(content);

      expect(result.type).toBe('__empty__');
    });

    it('should recursively sanitize content arrays', () => {
      const content: JSONContent = {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Hello' },
          { type: 'text', text: '' },
          { type: 'text', text: 'World' },
        ],
      };

      const result = sanitizeContent(content);

      expect(result.content).toHaveLength(2);
      expect(result.content![0].text).toBe('Hello');
      expect(result.content![1].text).toBe('World');
    });

    it('should allow empty content arrays for allowed node types', () => {
      const allowedTypes = ['paragraph', 'heading', 'blockquote', 'listItem', 'taskItem'];

      for (const type of allowedTypes) {
        const content: JSONContent = { type, content: [] };
        const result = sanitizeContent(content);

        expect(result.content).toEqual([]);
      }
    });

    it('should filter out nodes with empty content for non-allowed types', () => {
      const content: JSONContent = {
        type: 'doc',
        content: [
          { type: 'paragraph', content: [] }, // Allowed
          { type: 'customNode', content: [] }, // Not allowed
        ],
      };

      const result = sanitizeContent(content);

      expect(result.content).toHaveLength(1);
      expect(result.content![0].type).toBe('paragraph');
    });

    it('should handle deeply nested content', () => {
      const content: JSONContent = {
        type: 'doc',
        content: [
          {
            type: 'blockquote',
            content: [
              {
                type: 'paragraph',
                content: [
                  { type: 'text', text: '' },
                  { type: 'text', text: 'Nested text' },
                ],
              },
            ],
          },
        ],
      };

      const result = sanitizeContent(content);

      expect(result.content![0].content![0].content).toHaveLength(1);
      expect(result.content![0].content![0].content![0].text).toBe('Nested text');
    });

    it('should not mutate original content', () => {
      const original: JSONContent = {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Keep' },
          { type: 'text', text: '' },
        ],
      };

      const originalLength = original.content!.length;
      sanitizeContent(original);

      expect(original.content!.length).toBe(originalLength);
    });

    it('should preserve node attributes', () => {
      const content: JSONContent = {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: 'Title' }],
      };

      const result = sanitizeContent(content);

      expect(result.attrs).toEqual({ level: 2 });
    });

    it('should preserve text marks', () => {
      const content: JSONContent = {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Bold text',
            marks: [{ type: 'bold' }],
          },
        ],
      };

      const result = sanitizeContent(content);

      expect(result.content![0].marks).toEqual([{ type: 'bold' }]);
    });
  });

  describe('needsSanitization', () => {
    it('should return false for null/undefined', () => {
      expect(needsSanitization(null as unknown as JSONContent)).toBe(false);
      expect(needsSanitization(undefined as unknown as JSONContent)).toBe(false);
    });

    it('should return false for valid text node', () => {
      const content: JSONContent = { type: 'text', text: 'Hello' };
      expect(needsSanitization(content)).toBe(false);
    });

    it('should return true for empty text node', () => {
      const content: JSONContent = { type: 'text', text: '' };
      expect(needsSanitization(content)).toBe(true);
    });

    it('should return true for text node without text property', () => {
      const content: JSONContent = { type: 'text' };
      expect(needsSanitization(content)).toBe(true);
    });

    it('should return false for paragraph with valid content', () => {
      const content: JSONContent = {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Hello' }],
      };
      expect(needsSanitization(content)).toBe(false);
    });

    it('should return true for paragraph with empty text node', () => {
      const content: JSONContent = {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Hello' },
          { type: 'text', text: '' },
        ],
      };
      expect(needsSanitization(content)).toBe(true);
    });

    it('should detect nested empty text nodes', () => {
      const content: JSONContent = {
        type: 'doc',
        content: [
          {
            type: 'blockquote',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: '' }],
              },
            ],
          },
        ],
      };

      expect(needsSanitization(content)).toBe(true);
    });

    it('should return false for nodes without content array', () => {
      const content: JSONContent = { type: 'horizontalRule' };
      expect(needsSanitization(content)).toBe(false);
    });
  });

  describe('sanitizeNoteContent', () => {
    it('should return note unchanged if content is null', () => {
      const note = { id: '1', content: null as unknown as JSONContent };
      const result = sanitizeNoteContent(note);

      expect(result).toBe(note);
    });

    it('should return note unchanged if no sanitization needed', () => {
      const note = {
        id: '1',
        content: {
          type: 'doc',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] }],
        },
      };

      const result = sanitizeNoteContent(note);

      // Should return same reference if no changes
      expect(result.content.content![0].content![0].text).toBe('Hello');
    });

    it('should sanitize note content', () => {
      const note = {
        id: '1',
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: 'Hello' },
                { type: 'text', text: '' },
              ],
            },
          ],
        },
      };

      const result = sanitizeNoteContent(note);

      expect(result.content.content![0].content).toHaveLength(1);
    });

    it('should preserve other note properties', () => {
      const note = {
        id: '1',
        title: 'Test Note',
        tags: ['tag1'],
        content: {
          type: 'doc',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }],
        },
      };

      const result = sanitizeNoteContent(note);

      expect(result.id).toBe('1');
      expect(result.title).toBe('Test Note');
      expect(result.tags).toEqual(['tag1']);
    });
  });

  describe('sanitizeContent edge cases', () => {
    it('should return fallback for invalid node (missing type)', () => {
      const content = { text: 'no type' } as unknown as JSONContent;
      const result = sanitizeContent(content);

      expect(result.type).toBe('doc');
      expect(result.content).toEqual([{ type: 'paragraph' }]);
    });

    it('should return fallback for invalid node (empty type)', () => {
      const content: JSONContent = { type: '' };
      const result = sanitizeContent(content);

      expect(result.type).toBe('doc');
    });

    it('should return fallback for invalid node (non-string type)', () => {
      const content = { type: 123 } as unknown as JSONContent;
      const result = sanitizeContent(content);

      expect(result.type).toBe('doc');
    });

    it('should return fallback for invalid node (non-array content)', () => {
      const content = { type: 'doc', content: 'invalid' } as unknown as JSONContent;
      const result = sanitizeContent(content);

      expect(result.type).toBe('doc');
    });

    it('should return fallback for invalid node (null attrs)', () => {
      const content = { type: 'heading', attrs: null } as unknown as JSONContent;
      const result = sanitizeContent(content);

      expect(result.type).toBe('doc');
    });

    it('should return fallback for invalid node (array attrs)', () => {
      const content = { type: 'heading', attrs: [] } as unknown as JSONContent;
      const result = sanitizeContent(content);

      expect(result.type).toBe('doc');
    });

    it('should return fallback for invalid text node (non-string text)', () => {
      const content = { type: 'text', text: 123 } as unknown as JSONContent;
      const result = sanitizeContent(content);

      expect(result.type).toBe('doc');
    });

    it('should handle max depth exceeded by returning safe fallback', () => {
      // Create deeply nested content beyond max depth
      let deepContent: JSONContent = { type: 'text', text: 'deep' };
      for (let i = 0; i < 105; i++) {
        deepContent = { type: 'paragraph', content: [deepContent] };
      }

      const result = sanitizeContent(deepContent);

      // Should eventually hit the max depth and return a paragraph
      expect(result.type).toBeDefined();
    });

    it('should filter invalid nodes from content array', () => {
      const content: JSONContent = {
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'valid' }] },
          { text: 'no type' } as unknown as JSONContent,
          { type: 'paragraph', content: [{ type: 'text', text: 'also valid' }] },
        ],
      };

      const result = sanitizeContent(content);

      expect(result.content).toHaveLength(2);
    });
  });

  describe('sanitizeNotes', () => {
    it('should sanitize multiple notes', () => {
      const notes = [
        {
          id: '1',
          content: {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: '' }],
              },
            ],
          },
        },
        {
          id: '2',
          content: {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Valid' }],
              },
            ],
          },
        },
      ];

      const result = sanitizeNotes(notes);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('2');
    });

    it('should handle empty array', () => {
      expect(sanitizeNotes([])).toEqual([]);
    });
  });
});
