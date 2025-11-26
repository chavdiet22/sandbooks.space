/**
 * Content Sanitizer for TipTap/ProseMirror
 *
 * ProseMirror does not allow empty text nodes (text nodes with empty string).
 * This utility removes them from JSONContent before loading into TipTap.
 * Also validates structural integrity to prevent crashes from malformed content.
 */

import type { JSONContent } from '@tiptap/react';

// Maximum recursion depth to prevent infinite loops from circular references
const MAX_SANITIZE_DEPTH = 100;

/**
 * Validate that a node has valid structure for TipTap.
 * Returns true if the node is structurally valid, false if it should be filtered out.
 *
 * @param node - The node to validate
 * @returns true if valid TipTap node structure
 */
export function isValidNode(node: unknown): node is JSONContent {
  // Must be a non-null object
  if (node === null || typeof node !== 'object') {
    return false;
  }

  const n = node as Record<string, unknown>;

  // Must have a string 'type' property
  if (typeof n.type !== 'string' || n.type.length === 0) {
    return false;
  }

  // If 'content' exists, must be an array
  if ('content' in n && !Array.isArray(n.content)) {
    return false;
  }

  // If 'attrs' exists, must be an object (not null, not array)
  if ('attrs' in n && (typeof n.attrs !== 'object' || n.attrs === null || Array.isArray(n.attrs))) {
    return false;
  }

  // Text nodes must have string 'text' property
  if (n.type === 'text' && 'text' in n && typeof n.text !== 'string') {
    return false;
  }

  return true;
}

/**
 * Recursively sanitize TipTap JSONContent by removing empty text nodes,
 * invalid nodes, and cleaning up empty content arrays.
 *
 * @param content - The JSONContent to sanitize
 * @param depth - Current recursion depth (internal use)
 * @returns Sanitized JSONContent safe for TipTap
 */
export function sanitizeContent(content: JSONContent, depth: number = 0): JSONContent {
  // Prevent infinite recursion from circular references or deeply nested content
  if (depth > MAX_SANITIZE_DEPTH) {
    console.warn('[ContentSanitizer] Max depth exceeded, returning empty paragraph');
    return { type: 'paragraph' };
  }

  // Handle null/undefined
  if (!content) {
    return content;
  }

  // Validate basic structure - if invalid, return safe fallback
  if (!isValidNode(content)) {
    return { type: 'doc', content: [{ type: 'paragraph' }] };
  }

  // Clone the content to avoid mutations
  const result = { ...content };

  // If this is a text node, check if it's empty
  if (result.type === 'text') {
    // Empty text nodes are not allowed in ProseMirror
    // Return a placeholder that will be filtered out
    if (!result.text || result.text === '') {
      return { type: '__empty__' };
    }
    return result;
  }

  // Recursively sanitize content array
  if (result.content && Array.isArray(result.content)) {
    result.content = result.content
      .filter((node: unknown) => isValidNode(node))
      .map((node: JSONContent) => sanitizeContent(node, depth + 1))
      .filter((node: JSONContent) => {
        // Filter out empty text nodes
        if (node.type === '__empty__') {
          return false;
        }
        // Filter out nodes with empty content arrays (except leaf nodes)
        if (node.content && Array.isArray(node.content) && node.content.length === 0) {
          // Some nodes like paragraph, heading can be empty and that's valid
          const allowEmptyContent = ['paragraph', 'heading', 'blockquote', 'listItem', 'taskItem'];
          return allowEmptyContent.includes(node.type || '');
        }
        return true;
      });
  }

  return result;
}

/**
 * Check if content contains empty text nodes that would cause ProseMirror errors
 *
 * @param content - The JSONContent to check
 * @returns true if content needs sanitization
 */
export function needsSanitization(content: JSONContent): boolean {
  if (!content) {
    return false;
  }

  // Check if this is an empty text node
  if (content.type === 'text' && (!content.text || content.text === '')) {
    return true;
  }

  // Recursively check content array
  if (content.content && Array.isArray(content.content)) {
    return content.content.some((node: JSONContent) => needsSanitization(node));
  }

  return false;
}

/**
 * Sanitize a Note's content field
 * Returns a new note object with sanitized content (does not mutate original)
 *
 * @param note - The note to sanitize
 * @returns Note with sanitized content
 */
export function sanitizeNoteContent<T extends { content: JSONContent }>(note: T): T {
  if (!note.content) {
    return note;
  }

  const sanitizedContent = sanitizeContent(note.content);

  // Only return new object if content actually changed
  if (sanitizedContent === note.content) {
    return note;
  }

  return {
    ...note,
    content: sanitizedContent,
  };
}

/**
 * Batch sanitize multiple notes
 *
 * @param notes - Array of notes to sanitize
 * @returns Array of notes with sanitized content
 */
export function sanitizeNotes<T extends { content: JSONContent }>(notes: T[]): T[] {
  return notes.map((note) => sanitizeNoteContent(note));
}
