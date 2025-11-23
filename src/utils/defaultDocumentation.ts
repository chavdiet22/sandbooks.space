/**
 * Sandbooks: Living Documentation (action-led)
 *
 * Purpose: be the best possible onboarding + self-documenting tour.
 * - Short, scannable copy
 * - Task lists that encourage real interactions
 * - Runnable/code samples across languages
 */

import { nanoid } from 'nanoid';
import type { Note } from '../types';

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
    title: 'Welcome to Sandbooks',
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
          content: [{ type: 'text', text: 'Sandbooks is a personal workspace for your notes and code. It is designed to be simple, fast, and private.' }],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Your Data is Private' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'We do not see your notes. By default, everything you write is stored in your browser\'s Local Storage. It never leaves your device unless you choose to move it.' }],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Getting Started' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'You can use this space to write daily notes, draft code, or organize your thoughts. Explore the other notes in this list to learn about the editor, running code, and saving files to your computer.' }],
        },
        {
          type: 'taskList',
          content: [
            {
              type: 'taskItem',
              attrs: { checked: false },
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'I understand that my notes are private and stored locally.' }] }]
            },
          ],
        },
      ],
    },
    tags: [
      { id: nanoid(), name: 'welcome', color: 'blue', createdAt: t1.tag, updatedAt: t1.tag },
    ],
    codeBlocks: [],
    createdAt: t1.note,
    updatedAt: t1.note,
  });

  // NOTE 2: Writing & Focus
  const t2 = getTimestamps(1000);
  notes.push({
    id: nanoid(),
    title: 'Writing & Focus',
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Writing & Focus' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'The editor uses Markdown shortcuts to help you format text quickly. It also offers tools to help you focus on your writing.' }],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Formatting' }],
        },
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Headings: Type ' }, { type: 'text', marks: [{ type: 'code' }], text: '# ' }, { type: 'text', text: ' for a large heading, ' }, { type: 'text', marks: [{ type: 'code' }], text: '## ' }, { type: 'text', text: ' for a smaller one.' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Lists: Start a line with ' }, { type: 'text', marks: [{ type: 'code' }], text: '- ' }, { type: 'text', text: ' for bullets or ' }, { type: 'text', marks: [{ type: 'code' }], text: '1. ' }, { type: 'text', text: ' for numbers.' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Slash Menu: Type ' }, { type: 'text', marks: [{ type: 'code' }], text: '/' }, { type: 'text', text: ' on a new line to insert tables, images, or code blocks.' }] }] },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Focus Tools' }],
        },
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Dark Mode' }, { type: 'text', text: ': Click the moon icon in the top right to toggle dark mode.' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'New Note' }, { type: 'text', text: ': Press ' }, { type: 'text', marks: [{ type: 'code' }], text: 'Cmd+Alt+N' }, { type: 'text', text: ' (Mac) or ' }, { type: 'text', marks: [{ type: 'code' }], text: 'Ctrl+Alt+N' }, { type: 'text', text: ' (Windows) to create a new note instantly.' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Typewriter Mode' }, { type: 'text', text: ': Press ' }, { type: 'text', marks: [{ type: 'code' }], text: 'Cmd+Alt+T' }, { type: 'text', text: ' (Mac) or ' }, { type: 'text', marks: [{ type: 'code' }], text: 'Ctrl+Alt+T' }, { type: 'text', text: ' (Windows) to keep your cursor centered.' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Focus Mode' }, { type: 'text', text: ': Press ' }, { type: 'text', marks: [{ type: 'code' }], text: 'Cmd+Alt+F' }, { type: 'text', text: ' (Mac) or ' }, { type: 'text', marks: [{ type: 'code' }], text: 'Ctrl+Alt+F' }, { type: 'text', text: ' (Windows) to dim everything except the active paragraph.' }] }] },
          ],
        },
        {
          type: 'taskList',
          content: [
            { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Try toggling Dark Mode.' }] }] },
          ],
        },
      ],
    },
    tags: [
      { id: nanoid(), name: 'guide', color: 'gray', createdAt: t2.tag, updatedAt: t2.tag },
    ],
    codeBlocks: [],
    createdAt: t2.note,
    updatedAt: t2.note,
  });

  // NOTE 3: Code & Terminal
  const t3 = getTimestamps(2000);
  notes.push({
    id: nanoid(),
    title: 'Code & Terminal',
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Code & Terminal' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Sandbooks allows you to execute code and access a full terminal environment.' }],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Running Code' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Code blocks run in a secure cloud sandbox. This keeps your local machine safe. We support Python, TypeScript, JavaScript, Go, and Bash.' }],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'The Terminal' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'You can access a persistent Linux shell at any time. This is useful for installing packages, running git commands, or checking system status.' }],
        },
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Press ' }, { type: 'text', marks: [{ type: 'code' }], text: 'Ctrl+`' }, { type: 'text', text: ' (on all platforms) to toggle the terminal.' }] }] },
          ],
        },
        {
          type: 'taskList',
          content: [
            { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Run the code block below.' }] }] },
            { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Open the terminal with Ctrl+`.' }] }] },
          ],
        },
      ],
    },
    tags: [
      { id: nanoid(), name: 'code', color: 'amber', createdAt: t3.tag, updatedAt: t3.tag },
    ],
    codeBlocks: [
      {
        id: nanoid(),
        code: 'print("Hello from Sandbooks!")\n\n# You can do math here too\nprint(f"2 + 2 = {2 + 2}")',
        language: 'python',
        output: undefined,
        createdAt: t3.code,
        updatedAt: t3.code,
      },
    ],
    createdAt: t3.note,
    updatedAt: t3.note,
  });

  // NOTE 4: Organization & Navigation
  const t4 = getTimestamps(3000);
  notes.push({
    id: nanoid(),
    title: 'Organization & Navigation',
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Organization & Navigation' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Keep your workspace organized with tags, search, and the sidebar.' }],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Tags' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Add tags to the bottom of any note to categorize it. Click the colored dot next to a tag to change its color across all notes.' }],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Search' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Press ' }, { type: 'text', marks: [{ type: 'code' }], text: 'Cmd+K' }, { type: 'text', text: ' (Mac) or ' }, { type: 'text', marks: [{ type: 'code' }], text: 'Ctrl+K' }, { type: 'text', text: ' (Windows) to open the search bar. You can search for note titles, content, and tags.' }],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Sidebar' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Press ' }, { type: 'text', marks: [{ type: 'code' }], text: 'Cmd+\\' }, { type: 'text', text: ' (Mac) or ' }, { type: 'text', marks: [{ type: 'code' }], text: 'Ctrl+\\' }, { type: 'text', text: ' (Windows) to toggle the sidebar. This gives you more space to write.' }],
        },
      ],
    },
    tags: [
      { id: nanoid(), name: 'guide', color: 'gray', createdAt: t4.tag, updatedAt: t4.tag },
    ],
    codeBlocks: [],
    createdAt: t4.note,
    updatedAt: t4.note,
  });

  // NOTE 5: Your Files (Sync & Export)
  const t5 = getTimestamps(4000);
  notes.push({
    id: nanoid(),
    title: 'Your Files',
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Your Files' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'You have full ownership of your data. You can sync with your file system or export your notes at any time.' }],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Local Folder Sync' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Click "Open Folder" in the sidebar to connect a directory on your computer. Your notes will be saved as standard Markdown files.' }],
        },
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Edit your notes in VS Code or any other Markdown editor.' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Use Git to version control your notes.' }] }] },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Import & Export' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'You can also manually import or export your notes.' }],
        },
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Export: Download the current note as Markdown (.md) or all notes as JSON.' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Import: Bring in Markdown files from other apps.' }] }] },
          ],
        },
      ],
    },
    tags: [
      { id: nanoid(), name: 'reference', color: 'purple', createdAt: t5.tag, updatedAt: t5.tag },
    ],
    codeBlocks: [],
    createdAt: t5.note,
    updatedAt: t5.note,
  });

  return notes;
}
