/**
 * Test factories for Note-related types.
 * Reduces test boilerplate by providing sensible defaults.
 */
import { faker } from '@faker-js/faker';
import type { Note, CodeBlock, ExecutionResult, Language, SandboxStatus } from '../../types';

/**
 * Creates a mock CodeBlock with sensible defaults.
 */
export const createCodeBlock = (overrides: Partial<CodeBlock> = {}): CodeBlock => ({
  id: faker.string.nanoid(),
  code: overrides.code ?? faker.lorem.sentence(),
  language: overrides.language ?? faker.helpers.arrayElement<Language>(['python', 'javascript', 'typescript', 'bash', 'go']),
  createdAt: overrides.createdAt ?? Date.now(),
  updatedAt: overrides.updatedAt ?? Date.now(),
  output: overrides.output,
  ...overrides,
});

/**
 * Creates a mock ExecutionResult with sensible defaults.
 */
export const createExecutionResult = (overrides: Partial<ExecutionResult> = {}): ExecutionResult => ({
  stdout: overrides.stdout ?? 'Hello, World!',
  stderr: overrides.stderr ?? '',
  exitCode: overrides.exitCode ?? 0,
  executionTime: overrides.executionTime ?? faker.number.int({ min: 10, max: 500 }),
  sandboxStatus: overrides.sandboxStatus ?? 'healthy',
  recoverable: overrides.recoverable ?? true,
  ...overrides,
});

/**
 * Creates a mock Note with sensible defaults.
 */
export const createNote = (overrides: Partial<Note> = {}): Note => ({
  id: overrides.id ?? faker.string.nanoid(),
  title: overrides.title ?? faker.lorem.words(3),
  content: overrides.content ?? { type: 'doc', content: [] },
  tags: overrides.tags ?? [],
  codeBlocks: overrides.codeBlocks ?? [],
  createdAt: overrides.createdAt ?? faker.date.recent().toISOString(),
  updatedAt: overrides.updatedAt ?? faker.date.recent().toISOString(),
  isSystemDoc: overrides.isSystemDoc ?? false,
  folderId: overrides.folderId,
  folderOrder: overrides.folderOrder,
  ...overrides,
});

/**
 * Creates a Note with a code block already included.
 */
export const createNoteWithCode = (
  language: Language = 'python',
  code = 'print("Hello")',
  noteOverrides: Partial<Note> = {}
): Note => ({
  ...createNote(noteOverrides),
  codeBlocks: [createCodeBlock({ language, code })],
});

/**
 * Creates a Note with TipTap paragraph content.
 */
export const createNoteWithContent = (
  text: string,
  overrides: Partial<Note> = {}
): Note => ({
  ...createNote(overrides),
  content: {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text }],
      },
    ],
  },
});

/**
 * Creates multiple notes for list testing.
 */
export const createNotes = (count: number, overrides: Partial<Note> = {}): Note[] =>
  Array.from({ length: count }, (_, i) =>
    createNote({
      title: `Note ${i + 1}`,
      ...overrides,
    })
  );

/**
 * Creates an execution result representing an error.
 */
export const createErrorExecutionResult = (
  error = 'Execution failed',
  sandboxStatus: SandboxStatus = 'unhealthy'
): ExecutionResult => ({
  stdout: '',
  stderr: error,
  exitCode: 1,
  error,
  sandboxStatus,
  recoverable: sandboxStatus !== 'unhealthy',
});
