/**
 * useFolderTree hook tests.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFolderTree } from '../useFolderTree';
import type { Folder, Note } from '../../../../../types';
import type { FolderTreeNode } from '../../../../../types/folder.types';

// Mock the store
const mockNotes: Note[] = [
  {
    id: 'note-1',
    title: 'Note 1',
    content: { type: 'doc', content: [] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    folderId: 'folder-1',
    folderOrder: 0,
  },
  {
    id: 'note-2',
    title: 'Note 2',
    content: { type: 'doc', content: [] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    folderId: 'folder-1',
    folderOrder: 1,
  },
  {
    id: 'note-3',
    title: 'Unfiled Note',
    content: { type: 'doc', content: [] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    folderOrder: 0,
  },
];

const mockFolders: Folder[] = [
  {
    id: 'folder-1',
    name: 'Folder 1',
    parentId: null,
    color: 'blue',
    sortOrder: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'folder-2',
    name: 'Child Folder',
    parentId: 'folder-1',
    color: 'green',
    sortOrder: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

const mockFolderTree: FolderTreeNode[] = [
  {
    folder: mockFolders[0],
    depth: 0,
    isExpanded: true,
    noteIds: ['note-1', 'note-2'],
    children: [
      {
        folder: mockFolders[1],
        depth: 1,
        isExpanded: false,
        noteIds: [],
        children: [],
      },
    ],
  },
];

const mockStore = {
  notes: mockNotes,
  folders: mockFolders,
  expandedFolderIds: new Set(['folder-1']),
  activeFolderId: null,
  activeNoteId: null,
  folderViewMode: 'tree' as const,
  getFolderTree: vi.fn(() => mockFolderTree),
  toggleFolderExpanded: vi.fn(),
  setActiveFolder: vi.fn(),
  createFolder: vi.fn(),
};

vi.mock('../../../../../store/notesStore', () => ({
  useNotesStore: vi.fn((selector) => selector(mockStore)),
}));

describe('useFolderTree', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStore.activeFolderId = null;
  });

  it('returns folder tree data', () => {
    const { result } = renderHook(() => useFolderTree());

    expect(result.current.folderTree).toBeDefined();
    expect(Array.isArray(result.current.folderTree)).toBe(true);
  });

  it('returns flattened items for rendering', () => {
    const { result } = renderHook(() => useFolderTree());

    expect(result.current.flattenedItems).toBeDefined();
    expect(Array.isArray(result.current.flattenedItems)).toBe(true);
  });

  it('flattens tree items correctly', () => {
    const { result } = renderHook(() => useFolderTree());

    const { flattenedItems } = result.current;

    // Should have: folder-1, folder-2 (child), note-1, note-2, note-3 (unfiled)
    expect(flattenedItems.length).toBeGreaterThan(0);

    // First item should be the root folder
    expect(flattenedItems[0].type).toBe('folder');
    expect(flattenedItems[0].id).toBe('folder-1');
  });

  it('includes unfiled notes when no active folder', () => {
    const { result } = renderHook(() => useFolderTree());

    const unfiledNotes = result.current.flattenedItems.filter(
      (item) => item.type === 'note' && item.parentId === null
    );

    expect(unfiledNotes.length).toBe(1);
    expect(unfiledNotes[0].note?.title).toBe('Unfiled Note');
  });

  it('calculates folder note counts', () => {
    const { result } = renderHook(() => useFolderTree());

    expect(result.current.folderNoteCounts).toBeDefined();
    expect(result.current.folderNoteCounts.get('folder-1')).toBe(2);
  });

  it('calculates unfiled note count', () => {
    const { result } = renderHook(() => useFolderTree());

    expect(result.current.unfiledNoteCount).toBe(1);
  });

  it('returns all folders', () => {
    const { result } = renderHook(() => useFolderTree());

    expect(result.current.allFolders).toEqual(mockFolders);
  });

  it('returns current state', () => {
    const { result } = renderHook(() => useFolderTree());

    expect(result.current.activeFolderId).toBe(null);
    expect(result.current.activeNoteId).toBe(null);
    expect(result.current.folderViewMode).toBe('tree');
  });

  it('returns action functions', () => {
    const { result } = renderHook(() => useFolderTree());

    expect(typeof result.current.toggleFolderExpanded).toBe('function');
    expect(typeof result.current.setActiveFolder).toBe('function');
    expect(typeof result.current.createFolder).toBe('function');
  });

  it('marks expanded folders correctly', () => {
    const { result } = renderHook(() => useFolderTree());

    const expandedFolder = result.current.flattenedItems.find(
      (item) => item.id === 'folder-1' && item.type === 'folder'
    );

    expect(expandedFolder?.isExpanded).toBe(true);
  });

  it('includes child folders when parent is expanded', () => {
    const { result } = renderHook(() => useFolderTree());

    const childFolder = result.current.flattenedItems.find(
      (item) => item.id === 'folder-2' && item.type === 'folder'
    );

    expect(childFolder).toBeDefined();
    expect(childFolder?.depth).toBe(1);
  });

  it('includes notes within expanded folder', () => {
    const { result } = renderHook(() => useFolderTree());

    const folderNotes = result.current.flattenedItems.filter(
      (item) => item.type === 'note' && item.parentId === 'folder-1'
    );

    expect(folderNotes.length).toBe(2);
  });

  it('sets correct depth for nested items', () => {
    const { result } = renderHook(() => useFolderTree());

    const folder1 = result.current.flattenedItems.find((i) => i.id === 'folder-1');
    const folder2 = result.current.flattenedItems.find((i) => i.id === 'folder-2');
    const folderNote = result.current.flattenedItems.find(
      (i) => i.type === 'note' && i.parentId === 'folder-1'
    );

    expect(folder1?.depth).toBe(0);
    expect(folder2?.depth).toBe(1);
    expect(folderNote?.depth).toBe(1);
  });
});
