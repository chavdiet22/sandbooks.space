/**
 * Test factories for TipTap JSONContent.
 * Helps create consistent editor content for tests.
 */
import type { JSONContent } from '@tiptap/react';
import type { Language } from '../../types';

/**
 * Creates an empty document.
 */
export const createEmptyDoc = (): JSONContent => ({
  type: 'doc',
  content: [],
});

/**
 * Creates a paragraph node with text.
 */
export const createParagraph = (text: string): JSONContent => ({
  type: 'paragraph',
  content: text ? [{ type: 'text', text }] : [],
});

/**
 * Creates a heading node.
 */
export const createHeading = (text: string, level: 1 | 2 | 3 | 4 | 5 | 6 = 1): JSONContent => ({
  type: 'heading',
  attrs: { level },
  content: [{ type: 'text', text }],
});

/**
 * Creates a code block node (standard TipTap, not executable).
 */
export const createCodeBlock = (code: string, language = 'javascript'): JSONContent => ({
  type: 'codeBlock',
  attrs: { language },
  content: [{ type: 'text', text: code }],
});

/**
 * Creates an executable code block node.
 */
export const createExecutableCodeBlock = (
  code: string,
  language: Language = 'python',
  attrs: Record<string, unknown> = {}
): JSONContent => ({
  type: 'executableCodeBlock',
  attrs: {
    language,
    code,
    isExecuting: false,
    executionResult: null,
    ...attrs,
  },
});

/**
 * Creates a bullet list node.
 */
export const createBulletList = (items: string[]): JSONContent => ({
  type: 'bulletList',
  content: items.map((text) => ({
    type: 'listItem',
    content: [createParagraph(text)],
  })),
});

/**
 * Creates an ordered list node.
 */
export const createOrderedList = (items: string[], start = 1): JSONContent => ({
  type: 'orderedList',
  attrs: { start },
  content: items.map((text) => ({
    type: 'listItem',
    content: [createParagraph(text)],
  })),
});

/**
 * Creates a task list node.
 */
export const createTaskList = (items: Array<{ text: string; checked: boolean }>): JSONContent => ({
  type: 'taskList',
  content: items.map(({ text, checked }) => ({
    type: 'taskItem',
    attrs: { checked },
    content: [createParagraph(text)],
  })),
});

/**
 * Creates a blockquote node.
 */
export const createBlockquote = (text: string): JSONContent => ({
  type: 'blockquote',
  content: [createParagraph(text)],
});

/**
 * Creates an image node.
 */
export const createImage = (src: string, alt = '', title = ''): JSONContent => ({
  type: 'image',
  attrs: { src, alt, title },
});

/**
 * Creates a document with multiple content blocks.
 */
export const createDoc = (...content: JSONContent[]): JSONContent => ({
  type: 'doc',
  content,
});

/**
 * Creates a simple document with a title and paragraph.
 */
export const createSimpleDoc = (title: string, body: string): JSONContent =>
  createDoc(
    createHeading(title),
    createParagraph(body)
  );

/**
 * Creates a document with executable code for testing.
 */
export const createDocWithCode = (
  title: string,
  code: string,
  language: Language = 'python'
): JSONContent =>
  createDoc(
    createHeading(title),
    createParagraph('Run the code below:'),
    createExecutableCodeBlock(code, language)
  );
