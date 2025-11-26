/**
 * Test factories barrel export.
 * Import all factories from '@/test/factories'.
 */

// Note factories
export {
  createNote,
  createNoteWithCode,
  createNoteWithContent,
  createNotes,
  createCodeBlock,
  createExecutionResult,
  createErrorExecutionResult,
} from './note.factory';

// Tag factories
export {
  createTag,
  createTagWithCount,
  createTags,
  createTagWithColor,
} from './tag.factory';

// Folder factories
export {
  createFolder,
  createFolderWithPath,
  createFolderWithChildren,
  createFolderTreeNode,
  createFolderHierarchy,
  createFolders,
} from './folder.factory';

// Store factories
export {
  createMockStore,
  createMockStoreWithNotes,
  createMockUseNotesStore,
  defaultStoreState,
} from './store.factory';

// TipTap content factories
export {
  createEmptyDoc,
  createParagraph,
  createHeading,
  createCodeBlock as createTipTapCodeBlock,
  createExecutableCodeBlock,
  createBulletList,
  createOrderedList,
  createTaskList,
  createBlockquote,
  createImage,
  createDoc,
  createSimpleDoc,
  createDocWithCode,
} from './tiptap.factory';

// Terminal factories
export {
  createTerminalSession,
  createTerminalOutput,
  createSSEEvent,
  createTerminalDimensions,
  createTerminalInput,
  createTerminalStats,
} from './terminal.factory';
export type {
  TerminalSessionStatus,
  MockTerminalSession,
  MockTerminalStats,
} from './terminal.factory';
