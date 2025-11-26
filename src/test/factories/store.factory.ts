/**
 * Test factory for Zustand store mock.
 * Provides a complete mock store with sensible defaults.
 */
import { vi } from 'vitest';
import type { NotesStore, Note, SandboxStatus, SyncStatus } from '../../types';
import type { Tag, TagWithCount } from '../../types/tags.types';
import type { Folder, FolderTreeNode } from '../../types/folder.types';
import type { GitHubStatus, GitHubUser } from '../../types/github.types';

/**
 * Default state values for the store.
 */
export const defaultStoreState = {
  // Core state
  notes: [] as Note[],
  activeNoteId: null as string | null,
  tags: [] as Tag[],

  // UI state
  darkModeEnabled: false,
  isSearchOpen: false,
  searchQuery: '',
  isShortcutsOpen: false,
  isSidebarOpen: true,
  typewriterModeEnabled: false,
  focusModeEnabled: false,

  // Folder state
  folders: [] as Folder[],
  expandedFolderIds: new Set<string>(),
  activeFolderId: null as string | null,
  folderViewMode: 'tree' as const,

  // Terminal state
  isTerminalOpen: false,
  terminalHeight: 300,
  globalTerminalSessionId: null as string | null,
  globalTerminalStatus: 'disconnected' as const,

  // Sandbox state
  sandboxStatus: 'healthy' as SandboxStatus,
  sandboxId: null as string | null,
  lastHealthCheck: null as number | null,
  retryCount: 0,
  isCreatingSandbox: false,

  // Sync state
  syncStatus: 'synced' as SyncStatus,
  lastSyncedAt: null as string | null,
  storageType: 'localStorage' as const,
  storageName: 'Local Storage',

  // Offline state
  isOnline: true,
  offlineQueue: [],

  // Payload state
  payloadNote: null as Note | null,
  payloadMetadata: null,
  payloadError: null,
  isLoadingPayload: false,
  isShareModalOpen: false,

  // Docs state
  docsUpdateAvailable: false,
  currentDocsVersion: null as number | null,

  // GitHub state
  gitHubStatus: 'disconnected' as GitHubStatus,
  gitHubUser: null as GitHubUser | null,
  gitHubError: null as string | null,
  gitHubRepo: null as string | null,
  gitHubPath: '',
  gitHubLastSync: null as string | null,
  isRepoSelectorOpen: false,
  isSyncConflictModalOpen: false,
};

/**
 * Creates a complete mock store with all actions mocked.
 * Pass overrides to customize state.
 */
export const createMockStore = (
  overrides: Partial<typeof defaultStoreState> = {}
): NotesStore => ({
  // Merge state
  ...defaultStoreState,
  ...overrides,
  // Ensure Set is properly handled
  expandedFolderIds: overrides.expandedFolderIds ?? new Set<string>(),

  // Mock all actions
  addNote: vi.fn(),
  updateNote: vi.fn(),
  deleteNote: vi.fn(),
  setActiveNote: vi.fn(),
  toggleDarkMode: vi.fn(),
  exportNotes: vi.fn(() => '[]'),
  importNotes: vi.fn(() => true),
  importMarkdownNote: vi.fn(() => Promise.resolve()),
  resetOnboardingDocs: vi.fn(),
  toggleShortcuts: vi.fn(),
  toggleSidebar: vi.fn(),
  toggleTypewriterMode: vi.fn(),
  toggleFocusMode: vi.fn(),
  openSearch: vi.fn(),
  closeSearch: vi.fn(),
  setSearchQuery: vi.fn(),

  // Terminal actions
  toggleTerminal: vi.fn(),
  setTerminalHeight: vi.fn(),
  initializeGlobalTerminalSession: vi.fn(() => Promise.resolve()),
  setGlobalTerminalStatus: vi.fn(),

  // Tag actions
  addTag: vi.fn((name: string) => ({ id: 'new-tag', name, color: 'gray', createdAt: Date.now(), updatedAt: Date.now() })),
  updateTag: vi.fn(),
  deleteTag: vi.fn(),
  addTagToNote: vi.fn(),
  removeTagFromNote: vi.fn(),
  getTagById: vi.fn(),
  getAllTagsWithCounts: vi.fn(() => [] as TagWithCount[]),

  // Folder actions
  createFolder: vi.fn((name: string) => ({ id: 'new-folder', name, parentId: null, sortOrder: 0, createdAt: Date.now(), updatedAt: Date.now() })),
  updateFolder: vi.fn(),
  deleteFolder: vi.fn(),
  moveFolder: vi.fn(),
  setActiveFolder: vi.fn(),
  toggleFolderExpanded: vi.fn(),
  moveNoteToFolder: vi.fn(),
  reorderNotesInFolder: vi.fn(),
  getFolderById: vi.fn(),
  getFolderPath: vi.fn(() => ''),
  getFolderTree: vi.fn(() => [] as FolderTreeNode[]),
  getNotesInFolder: vi.fn(() => [] as Note[]),
  getAllFoldersWithVirtual: vi.fn(() => [] as Folder[]),
  setFolderViewMode: vi.fn(),

  // Sandbox actions
  setSandboxStatus: vi.fn(),
  checkSandboxHealth: vi.fn(() => Promise.resolve(true)),
  autoHealSandbox: vi.fn(() => Promise.resolve(true)),
  recreateSandbox: vi.fn(() => Promise.resolve()),

  // Onboarding actions
  seedDocsIfMissing: vi.fn(),

  // Offline actions
  setIsOnline: vi.fn(),
  queueCodeExecution: vi.fn(),
  processOfflineQueue: vi.fn(() => Promise.resolve()),
  clearOfflineQueue: vi.fn(),

  // Storage actions
  getStorageInfo: vi.fn(() => ({ type: 'localStorage', name: 'Local Storage', status: 'ready', noteCount: 0 })),
  connectToLocalFolder: vi.fn(() => Promise.resolve()),
  disconnectFromLocalFolder: vi.fn(() => Promise.resolve()),

  // Payload actions
  loadPayload: vi.fn(() => Promise.resolve()),
  clearPayload: vi.fn(),
  savePayloadToNotes: vi.fn(() => null),
  setShareModalOpen: vi.fn(),

  // Docs actions
  checkDocsVersion: vi.fn(),
  updateSystemDocs: vi.fn(),
  dismissDocsUpdate: vi.fn(),

  // GitHub actions
  connectGitHub: vi.fn(() => Promise.resolve()),
  disconnectGitHub: vi.fn(() => Promise.resolve()),
  setRepoSelectorOpen: vi.fn(),
  selectGitHubRepo: vi.fn(() => Promise.resolve()),
  pushToGitHub: vi.fn(() => Promise.resolve()),
  pullFromGitHub: vi.fn(() => Promise.resolve()),
  setSyncConflictModalOpen: vi.fn(),
  resolveInitialSyncConflict: vi.fn(() => Promise.resolve()),
});

/**
 * Creates a mock store with notes pre-populated.
 */
export const createMockStoreWithNotes = (
  notes: Note[],
  activeNoteId?: string
): NotesStore =>
  createMockStore({
    notes,
    activeNoteId: activeNoteId ?? notes[0]?.id ?? null,
  });

/**
 * Creates a mock useNotesStore hook implementation.
 * Usage: vi.mocked(useNotesStore).mockImplementation(createMockUseNotesStore(store))
 */
export const createMockUseNotesStore = (store: NotesStore) =>
  <T>(selector?: (state: NotesStore) => T): T | NotesStore =>
    selector ? selector(store) : store;
