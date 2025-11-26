/**
 * Sandbooks: Living Documentation
 *
 * Purpose: Onboarding documentation teaching features through concise guidance.
 * - User-workflow organization
 * - Concise, action-oriented writing
 * - No task checklists (cleaner appearance)
 * - Complete feature coverage
 * - Uses folders and tags to showcase those features
 *
 * VERSION HISTORY:
 * - 1: Initial documentation (9 notes) - 2025-01-15
 * - 2: Reorganized to 8 notes, added Folders/GitHub/IPython - 2025-11-26
 * - 2.1: Added Docs folder, improved tags - 2025-11-26
 *
 * When updating documentation:
 * 1. Increment DOCS_VERSION
 * 2. Update DOCS_UPDATED_AT
 * 3. Users will be notified to update their system docs
 */

import { nanoid } from 'nanoid';
import type { Note } from '../types';
import type { Folder } from '../types/folder.types';

/**
 * Documentation version number.
 * Increment this when making changes to default documentation.
 * Users with older versions will see an update notification.
 */
export const DOCS_VERSION = 3;

/**
 * Stable folder ID for documentation.
 * Using a fixed ID allows updates to work correctly.
 */
export const DOCS_FOLDER_ID = 'sandbooks-docs-folder';

/**
 * Date when documentation was last updated.
 * Used for display purposes in the update notification.
 */
export const DOCS_UPDATED_AT = '2025-11-26';

/**
 * Well-known titles for system documentation notes.
 * Used as a fallback to identify system docs when isSystemDoc flag is missing.
 */
export const SYSTEM_DOC_TITLES = [
  'Welcome',
  'Writing & Formatting',
  'Media & Embeds',
  'Running Code',
  'Using the Terminal',
  'Organizing Notes',
  'GitHub Sync',
  'Sync & Export',
] as const;

/**
 * Create the default Docs folder for documentation notes.
 * Uses a stable ID so updates can find and update it.
 */
export function createDefaultDocsFolder(): Folder {
  const now = Date.now();
  return {
    id: DOCS_FOLDER_ID,
    name: 'Docs',
    parentId: null,
    color: 'blue',
    sortOrder: 0,
    createdAt: now,
    updatedAt: now,
  };
}

export function createDefaultDocumentation(): Note[] {
  const now = Date.now();
  const getTimestamps = (offset: number = 0) => ({
    tag: now - offset,
    note: new Date(now - offset).toISOString(),
    code: now - offset,
  });

  const notes: Note[] = [];

  // NOTE 1: Welcome
  const t1 = getTimestamps(0);
  notes.push({
    id: nanoid(),
    title: 'Welcome',
    isSystemDoc: true,
    folderId: DOCS_FOLDER_ID,
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Welcome to Sandbooks' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Sandbooks stores your notes locally. Your data stays on your device.' }],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Quick Start' }],
        },
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Start typing to create content' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Press ' }, { type: 'text', marks: [{ type: 'code' }], text: '/' }, { type: 'text', text: ' for commands (headings, code, tables)' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Press ' }, { type: 'text', marks: [{ type: 'code' }], text: '?' }, { type: 'text', text: ' for keyboard shortcuts' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Press ' }, { type: 'text', marks: [{ type: 'code' }], text: 'Cmd+K' }, { type: 'text', text: ' to search notes' }] }] },
          ],
        },
      ],
    },
    tags: [
      { id: nanoid(), name: 'getting-started', color: 'blue', createdAt: t1.tag, updatedAt: t1.tag },
      { id: nanoid(), name: 'intro', color: 'gray', createdAt: t1.tag, updatedAt: t1.tag },
    ],
    codeBlocks: [],
    createdAt: t1.note,
    updatedAt: t1.note,
  });

  // NOTE 2: Writing & Formatting
  const t2 = getTimestamps(1000);
  notes.push({
    id: nanoid(),
    title: 'Writing & Formatting',
    isSystemDoc: true,
    folderId: DOCS_FOLDER_ID,
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Writing & Formatting' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Format text using the toolbar, keyboard shortcuts, or Markdown.' }],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Text Formatting' }],
        },
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Bold' }, { type: 'text', text: ': ' }, { type: 'text', marks: [{ type: 'code' }], text: 'Cmd+B' }, { type: 'text', text: ' or ' }, { type: 'text', marks: [{ type: 'code' }], text: '**text**' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'italic' }], text: 'Italic' }, { type: 'text', text: ': ' }, { type: 'text', marks: [{ type: 'code' }], text: 'Cmd+I' }, { type: 'text', text: ' or ' }, { type: 'text', marks: [{ type: 'code' }], text: '*text*' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'strike' }], text: 'Strikethrough' }, { type: 'text', text: ': ' }, { type: 'text', marks: [{ type: 'code' }], text: 'Cmd+Shift+S' }, { type: 'text', text: ' or ' }, { type: 'text', marks: [{ type: 'code' }], text: '~~text~~' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'underline' }], text: 'Underline' }, { type: 'text', text: ': ' }, { type: 'text', marks: [{ type: 'code' }], text: 'Cmd+U' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'highlight' }], text: 'Highlight' }, { type: 'text', text: ': ' }, { type: 'text', marks: [{ type: 'code' }], text: 'Cmd+Shift+H' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Link: ' }, { type: 'text', marks: [{ type: 'code' }], text: 'Cmd+K' }, { type: 'text', text: ' or select text and click the link button' }] }] },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Headings' }],
        },
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Type ' }, { type: 'text', marks: [{ type: 'code' }], text: '# ' }, { type: 'text', text: ' for heading 1, ' }, { type: 'text', marks: [{ type: 'code' }], text: '## ' }, { type: 'text', text: ' for heading 2, ' }, { type: 'text', marks: [{ type: 'code' }], text: '### ' }, { type: 'text', text: ' for heading 3' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Slash menu: ' }, { type: 'text', marks: [{ type: 'code' }], text: '/h1' }, { type: 'text', text: ', ' }, { type: 'text', marks: [{ type: 'code' }], text: '/h2' }, { type: 'text', text: ', ' }, { type: 'text', marks: [{ type: 'code' }], text: '/h3' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Keyboard: ' }, { type: 'text', marks: [{ type: 'code' }], text: 'Cmd+Alt+1/2/3' }, { type: 'text', text: ' to convert current line' }] }] },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Lists' }],
        },
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Bullet list: Type ' }, { type: 'text', marks: [{ type: 'code' }], text: '- ' }, { type: 'text', text: ' or ' }, { type: 'text', marks: [{ type: 'code' }], text: 'Cmd+Shift+8' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Numbered list: Type ' }, { type: 'text', marks: [{ type: 'code' }], text: '1. ' }, { type: 'text', text: ' or ' }, { type: 'text', marks: [{ type: 'code' }], text: 'Cmd+Shift+7' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Task list: Type ' }, { type: 'text', marks: [{ type: 'code' }], text: '[ ] ' }, { type: 'text', text: ' or ' }, { type: 'text', marks: [{ type: 'code' }], text: 'Cmd+Shift+9' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Nest lists: Press ' }, { type: 'text', marks: [{ type: 'code' }], text: 'Tab' }, { type: 'text', text: ' to indent, ' }, { type: 'text', marks: [{ type: 'code' }], text: 'Shift+Tab' }, { type: 'text', text: ' to outdent' }] }] },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Colors & Fonts' }],
        },
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Text color: Select text, click the color button, choose a color' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Highlight color: Select text, click the highlight button, choose a color' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Font family: JetBrains Mono (default), Inter, or System' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Font size: 12px to 72px via font button' }] }] },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Alignment' }],
        },
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Left: ' }, { type: 'text', marks: [{ type: 'code' }], text: 'Cmd+Shift+L' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Center: ' }, { type: 'text', marks: [{ type: 'code' }], text: 'Cmd+Shift+E' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Right: ' }, { type: 'text', marks: [{ type: 'code' }], text: 'Cmd+Shift+R' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Justify: ' }, { type: 'text', marks: [{ type: 'code' }], text: 'Cmd+Shift+J' }] }] },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Advanced' }],
        },
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Superscript: ' }, { type: 'text', marks: [{ type: 'code' }], text: 'Cmd+.' }, { type: 'text', text: ' (useful for footnotes, exponents)' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Subscript: ' }, { type: 'text', marks: [{ type: 'code' }], text: 'Cmd+,' }, { type: 'text', text: ' (useful for chemical formulas)' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Blockquote: Type ' }, { type: 'text', marks: [{ type: 'code' }], text: '> ' }, { type: 'text', text: ' or ' }, { type: 'text', marks: [{ type: 'code' }], text: 'Cmd+Shift+B' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Inline code: Wrap text with backticks: ' }, { type: 'text', marks: [{ type: 'code' }], text: '`code`' }] }] },
          ],
        },
      ],
    },
    tags: [
      { id: nanoid(), name: 'formatting', color: 'blue', createdAt: t2.tag, updatedAt: t2.tag },
      { id: nanoid(), name: 'markdown', color: 'gray', createdAt: t2.tag, updatedAt: t2.tag },
    ],
    codeBlocks: [],
    createdAt: t2.note,
    updatedAt: t2.note,
  });

  // NOTE 3: Media & Embeds
  const t3 = getTimestamps(2000);
  notes.push({
    id: nanoid(),
    title: 'Media & Embeds',
    isSystemDoc: true,
    folderId: DOCS_FOLDER_ID,
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Media & Embeds' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Add images, videos, audio, files, and tables to your notes.' }],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Images' }],
        },
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Type ' }, { type: 'text', marks: [{ type: 'code' }], text: '/image' }, { type: 'text', text: ' or click the image button in the toolbar' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Upload from your computer or paste a URL' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Drag and drop images directly into the editor' }] }] },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Videos' }],
        },
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'YouTube: Type ' }, { type: 'text', marks: [{ type: 'code' }], text: '/youtube' }, { type: 'text', text: ' and paste a YouTube URL' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Video files: Type ' }, { type: 'text', marks: [{ type: 'code' }], text: '/video' }, { type: 'text', text: ' and upload or paste a URL' }] }] },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Audio & Files' }],
        },
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Audio: Type ' }, { type: 'text', marks: [{ type: 'code' }], text: '/audio' }, { type: 'text', text: ' and upload or paste a URL' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Files: Type ' }, { type: 'text', marks: [{ type: 'code' }], text: '/file' }, { type: 'text', text: ' to attach PDFs, documents, or other files' }] }] },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Tables' }],
        },
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Type ' }, { type: 'text', marks: [{ type: 'code' }], text: '/table' }, { type: 'text', text: ' or ' }, { type: 'text', marks: [{ type: 'code' }], text: 'Cmd+Shift+T' }, { type: 'text', text: ' to insert a table' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Click and drag borders to resize columns' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Right-click table for options: add rows, delete columns, merge cells' }] }] },
          ],
        },
      ],
    },
    tags: [
      { id: nanoid(), name: 'media', color: 'pink', createdAt: t3.tag, updatedAt: t3.tag },
      { id: nanoid(), name: 'tables', color: 'gray', createdAt: t3.tag, updatedAt: t3.tag },
    ],
    codeBlocks: [],
    createdAt: t3.note,
    updatedAt: t3.note,
  });

  // NOTE 4: Running Code - with multiple executable code blocks
  const t4 = getTimestamps(3000);
  const pythonBlockId = nanoid();
  const jsBlockId = nanoid();
  const magicBlockId = nanoid();
  notes.push({
    id: nanoid(),
    title: 'Running Code',
    isSystemDoc: true,
    folderId: DOCS_FOLDER_ID,
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Running Code' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Execute code in cloud sandboxes. Your machine stays safe.' }],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Code Blocks' }],
        },
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Type ' }, { type: 'text', marks: [{ type: 'code' }], text: '/code' }, { type: 'text', text: ' or ' }, { type: 'text', marks: [{ type: 'code' }], text: 'Cmd+Alt+C' }, { type: 'text', text: ' to insert a code block' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Languages: Python, JavaScript, TypeScript, Go, Bash' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Click Run or press ' }, { type: 'text', marks: [{ type: 'code' }], text: 'Cmd+Enter' }, { type: 'text', text: ' to execute' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hover for copy button to copy code or output' }] }] },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Try Python' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Click Run to execute this Python code:' }],
        },
        {
          type: 'executableCodeBlock',
          attrs: { blockId: pythonBlockId },
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Try JavaScript' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Switch languages with the dropdown:' }],
        },
        {
          type: 'executableCodeBlock',
          attrs: { blockId: jsBlockId },
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'IPython Magic Commands' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Python supports shell commands and IPython magics:' }],
        },
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'code' }], text: '!pip install' }, { type: 'text', text: ' - Install packages' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'code' }], text: '!ls' }, { type: 'text', text: ', ' }, { type: 'text', marks: [{ type: 'code' }], text: '!pwd' }, { type: 'text', text: ' - Shell commands' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'code' }], text: '%cd' }, { type: 'text', text: ' - Change directory' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'code' }], text: '%%bash' }, { type: 'text', text: ' - Run cell as bash' }] }] },
          ],
        },
        {
          type: 'executableCodeBlock',
          attrs: { blockId: magicBlockId },
        },
      ],
    },
    tags: [
      { id: nanoid(), name: 'code', color: 'amber', createdAt: t4.tag, updatedAt: t4.tag },
      { id: nanoid(), name: 'python', color: 'green', createdAt: t4.tag, updatedAt: t4.tag },
    ],
    codeBlocks: [
      {
        id: pythonBlockId,
        code: 'print("Hello from Sandbooks!")\n\nfor i in range(3):\n    print(f"Count: {i}")',
        language: 'python',
        output: undefined,
        createdAt: t4.code,
        updatedAt: t4.code,
      },
      {
        id: jsBlockId,
        code: 'const greeting = "Hello from JavaScript!";\nconsole.log(greeting);\n\nconst numbers = [1, 2, 3, 4, 5];\nconsole.log("Sum:", numbers.reduce((a, b) => a + b, 0));',
        language: 'javascript',
        output: undefined,
        createdAt: t4.code,
        updatedAt: t4.code,
      },
      {
        id: magicBlockId,
        code: '# IPython magic commands demo\n!pwd\n!ls -la',
        language: 'python',
        output: undefined,
        createdAt: t4.code,
        updatedAt: t4.code,
      },
    ],
    createdAt: t4.note,
    updatedAt: t4.note,
  });

  // NOTE 5: Using the Terminal
  const t5 = getTimestamps(4000);
  notes.push({
    id: nanoid(),
    title: 'Using the Terminal',
    isSystemDoc: true,
    folderId: DOCS_FOLDER_ID,
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Using the Terminal' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Full Linux shell in the cloud.' }],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Open Terminal' }],
        },
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Press ' }, { type: 'text', marks: [{ type: 'code' }], text: 'Ctrl+`' }, { type: 'text', text: ' to toggle terminal' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Quake-style dropdown overlay' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Press ' }, { type: 'text', marks: [{ type: 'code' }], text: 'Esc' }, { type: 'text', text: ' to close when terminal is open' }] }] },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Features' }],
        },
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Full Linux shell (bash)' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Persistent working directory' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Environment variables persist across sessions' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Command history and tab completion' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Install packages: ' }, { type: 'text', marks: [{ type: 'code' }], text: 'pip install' }, { type: 'text', text: ', ' }, { type: 'text', marks: [{ type: 'code' }], text: 'npm install' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Run git commands, check system status' }] }] },
          ],
        },
      ],
    },
    tags: [
      { id: nanoid(), name: 'terminal', color: 'orange', createdAt: t5.tag, updatedAt: t5.tag },
      { id: nanoid(), name: 'shell', color: 'gray', createdAt: t5.tag, updatedAt: t5.tag },
    ],
    codeBlocks: [],
    createdAt: t5.note,
    updatedAt: t5.note,
  });

  // NOTE 6: Organizing Notes
  const t6 = getTimestamps(5000);
  notes.push({
    id: nanoid(),
    title: 'Organizing Notes',
    isSystemDoc: true,
    folderId: DOCS_FOLDER_ID,
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Organizing Notes' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Manage notes with folders, tags, and search.' }],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Folders' }],
        },
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Click the folder icon in the sidebar header to create a folder' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Drag notes into folders to organize them' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Drag folders into folders to nest them (unlimited depth)' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Right-click folder for color, rename, or delete' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Toggle tree view vs flat view in the sidebar' }] }] },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Tags' }],
        },
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Add tags at the bottom of any note' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Click the colored dot to change tag color globally' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Tags work across folders for cross-cutting organization' }] }] },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Search' }],
        },
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Press ' }, { type: 'text', marks: [{ type: 'code' }], text: 'Cmd+K' }, { type: 'text', text: ' or ' }, { type: 'text', marks: [{ type: 'code' }], text: 'Ctrl+K' }, { type: 'text', text: ' to open search' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Searches titles, content, and tags' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Press ' }, { type: 'text', marks: [{ type: 'code' }], text: '/' }, { type: 'text', text: ' when not typing to search' }] }] },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Navigation' }],
        },
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Toggle sidebar: ' }, { type: 'text', marks: [{ type: 'code' }], text: 'Cmd+\\' }, { type: 'text', text: ' or ' }, { type: 'text', marks: [{ type: 'code' }], text: 'Ctrl+\\' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'New note: ' }, { type: 'text', marks: [{ type: 'code' }], text: 'Cmd+Alt+N' }, { type: 'text', text: ' or press ' }, { type: 'text', marks: [{ type: 'code' }], text: 'c' }, { type: 'text', text: ' when not typing' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Right-click note in sidebar for Copy as Markdown' }] }] },
          ],
        },
      ],
    },
    tags: [
      { id: nanoid(), name: 'folders', color: 'purple', createdAt: t6.tag, updatedAt: t6.tag },
      { id: nanoid(), name: 'tags', color: 'emerald', createdAt: t6.tag, updatedAt: t6.tag },
    ],
    codeBlocks: [],
    createdAt: t6.note,
    updatedAt: t6.note,
  });

  // NOTE 7: GitHub Sync
  const t7 = getTimestamps(6000);
  notes.push({
    id: nanoid(),
    title: 'GitHub Sync',
    isSystemDoc: true,
    folderId: DOCS_FOLDER_ID,
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'GitHub Sync' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Sync notes to GitHub for backup and cross-device access.' }],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Connect' }],
        },
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Click the cloud icon in the header' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Sign in with your GitHub account' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Select an existing repository or create a new one' }] }] },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Push & Pull' }],
        },
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Push: Upload local changes to GitHub' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Pull: Download changes from GitHub' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Notes are stored as Markdown files' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Folder structure is preserved' }] }] },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Conflicts' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'When local and GitHub have different changes:' }],
        },
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Merge both' }, { type: 'text', text: ': Combines changes from local and GitHub' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Use GitHub' }, { type: 'text', text: ': Overwrites local notes with GitHub version' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Use local' }, { type: 'text', text: ': Overwrites GitHub with local notes' }] }] },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Status' }],
        },
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Header shows sync status' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Green check: All synced' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Orange dot: Changes to push or pull' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Red indicator: Conflict needs resolution' }] }] },
          ],
        },
      ],
    },
    tags: [
      { id: nanoid(), name: 'github', color: 'gray', createdAt: t7.tag, updatedAt: t7.tag },
      { id: nanoid(), name: 'sync', color: 'indigo', createdAt: t7.tag, updatedAt: t7.tag },
    ],
    codeBlocks: [],
    createdAt: t7.note,
    updatedAt: t7.note,
  });

  // NOTE 8: Sync & Export
  const t8 = getTimestamps(7000);
  notes.push({
    id: nanoid(),
    title: 'Sync & Export',
    isSystemDoc: true,
    folderId: DOCS_FOLDER_ID,
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Sync & Export' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Your notes are stored locally. Export or sync anytime.' }],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Local Storage' }],
        },
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Notes save automatically as you type' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Data stays in your browser\'s storage' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Nothing leaves your device unless you export' }] }] },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Export' }],
        },
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Current note: Download as Markdown' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'All notes: Download as JSON' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Right-click note in sidebar for Copy as Markdown' }] }] },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Import' }],
        },
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Import Markdown files from other apps' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Drag and drop .md files into the app' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Import JSON backup' }] }] },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Install as App' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Sandbooks works as a desktop app with offline support.' }],
        },
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Chrome/Edge: Click the install icon (⊕) in the address bar' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Safari: Share → Add to Dock' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Offline: Edit notes without internet, code execution queued for later' }] }] },
          ],
        },
      ],
    },
    tags: [
      { id: nanoid(), name: 'export', color: 'indigo', createdAt: t8.tag, updatedAt: t8.tag },
      { id: nanoid(), name: 'pwa', color: 'rose', createdAt: t8.tag, updatedAt: t8.tag },
    ],
    codeBlocks: [],
    createdAt: t8.note,
    updatedAt: t8.note,
  });

  return notes;
}
