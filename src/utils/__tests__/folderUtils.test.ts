/**
 * Folder utility tests.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { faker } from '@faker-js/faker';
import type { Folder, FolderTreeNode } from '../../types/folder.types';
import type { Note } from '../../types';
import {
  MAX_FOLDER_DEPTH,
  FOLDER_STORAGE_KEYS,
  computeFolderPath,
  resolveFolderIdFromPath,
  getAncestorFolderIds,
  buildFolderTree,
  flattenFolderTree,
  validateFolderMove,
  validateFolderDepth,
  findOrphanedFolders,
  repairOrphanedFolders,
  createFolder,
  getNotesInFolder,
  addPathToFolder,
  normalizeSortOrders,
  sanitizeFolderName,
  loadFoldersFromStorage,
  saveFoldersToStorage,
  loadFolderUIState,
  saveFolderUIState,
} from '../folderUtils';

// Factory functions
function createFolder(
  overrides: Partial<Folder> = {}
): Folder {
  return {
    id: faker.string.uuid(),
    name: faker.word.noun(),
    parentId: null,
    sortOrder: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

function createNote(overrides: Partial<Note> = {}): Note {
  return {
    id: faker.string.uuid(),
    title: faker.lorem.sentence(),
    content: { type: 'doc', content: [] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('folderUtils', () => {
  describe('constants', () => {
    it('should have correct MAX_FOLDER_DEPTH', () => {
      expect(MAX_FOLDER_DEPTH).toBe(20);
    });

    it('should have correct storage keys', () => {
      expect(FOLDER_STORAGE_KEYS.FOLDERS).toBe('sandbooks_folders');
      expect(FOLDER_STORAGE_KEYS.FOLDER_UI_STATE).toBe('sandbooks_folder_ui');
    });
  });

  describe('computeFolderPath', () => {
    it('should return empty string for non-existent folder', () => {
      const folders: Folder[] = [];
      expect(computeFolderPath('non-existent', folders)).toBe('');
    });

    it('should return folder name for root folder', () => {
      const folder = createFolder({ id: 'folder-1', name: 'Work' });
      expect(computeFolderPath('folder-1', [folder])).toBe('Work');
    });

    it('should build path for nested folder', () => {
      const root = createFolder({ id: 'root', name: 'Work', parentId: null });
      const child = createFolder({ id: 'child', name: 'Projects', parentId: 'root' });
      const grandchild = createFolder({ id: 'grandchild', name: 'Alpha', parentId: 'child' });

      const folders = [root, child, grandchild];
      expect(computeFolderPath('grandchild', folders)).toBe('Work/Projects/Alpha');
    });

    it('should use cache when provided', () => {
      const folder = createFolder({ id: 'folder-1', name: 'Work' });
      const cache = new Map<string, string>();

      computeFolderPath('folder-1', [folder], cache);
      expect(cache.get('folder-1')).toBe('Work');

      // Second call should use cache
      cache.set('folder-1', 'Cached');
      expect(computeFolderPath('folder-1', [folder], cache)).toBe('Cached');
    });

    it('should handle missing parent in chain', () => {
      const folder = createFolder({ id: 'folder-1', name: 'Orphan', parentId: 'missing' });
      expect(computeFolderPath('folder-1', [folder])).toBe('Orphan');
    });

    it('should respect MAX_FOLDER_DEPTH to prevent infinite loops', () => {
      // Create a deeply nested structure beyond MAX_FOLDER_DEPTH
      const folders: Folder[] = [];
      for (let i = 0; i <= MAX_FOLDER_DEPTH + 5; i++) {
        folders.push(
          createFolder({
            id: `folder-${i}`,
            name: `Level${i}`,
            parentId: i > 0 ? `folder-${i - 1}` : null,
          })
        );
      }

      // Should truncate at MAX_FOLDER_DEPTH
      const path = computeFolderPath(`folder-${MAX_FOLDER_DEPTH + 5}`, folders);
      const segments = path.split('/');
      expect(segments.length).toBeLessThanOrEqual(MAX_FOLDER_DEPTH + 1);
    });
  });

  describe('resolveFolderIdFromPath', () => {
    it('should return null for empty path', () => {
      expect(resolveFolderIdFromPath('', [])).toBe(null);
    });

    it('should resolve root level folder', () => {
      const folder = createFolder({ id: 'folder-1', name: 'Work' });
      expect(resolveFolderIdFromPath('Work', [folder])).toBe('folder-1');
    });

    it('should resolve nested path', () => {
      const root = createFolder({ id: 'root', name: 'Work', parentId: null });
      const child = createFolder({ id: 'child', name: 'Projects', parentId: 'root' });

      expect(resolveFolderIdFromPath('Work/Projects', [root, child])).toBe('child');
    });

    it('should return null for non-existent path', () => {
      const folder = createFolder({ id: 'folder-1', name: 'Work' });
      expect(resolveFolderIdFromPath('NonExistent', [folder])).toBe(null);
    });

    it('should handle paths with empty segments', () => {
      const folder = createFolder({ id: 'folder-1', name: 'Work' });
      expect(resolveFolderIdFromPath('//Work//', [folder])).toBe('folder-1');
    });
  });

  describe('getAncestorFolderIds', () => {
    it('should return empty array for non-existent folder', () => {
      expect(getAncestorFolderIds('non-existent', [])).toEqual([]);
    });

    it('should return empty array for root folder', () => {
      const folder = createFolder({ id: 'folder-1', parentId: null });
      expect(getAncestorFolderIds('folder-1', [folder])).toEqual([]);
    });

    it('should return ancestor IDs in order', () => {
      const root = createFolder({ id: 'root', parentId: null });
      const child = createFolder({ id: 'child', parentId: 'root' });
      const grandchild = createFolder({ id: 'grandchild', parentId: 'child' });

      const ancestors = getAncestorFolderIds('grandchild', [root, child, grandchild]);
      expect(ancestors).toEqual(['root', 'child']);
    });
  });

  describe('buildFolderTree', () => {
    it('should return empty array for no folders', () => {
      const tree = buildFolderTree([], [], new Set());
      expect(tree).toEqual([]);
    });

    it('should build tree with root folders', () => {
      const folder1 = createFolder({ id: 'f1', name: 'A', sortOrder: 1 });
      const folder2 = createFolder({ id: 'f2', name: 'B', sortOrder: 0 });

      const tree = buildFolderTree([folder1, folder2], [], new Set());

      expect(tree).toHaveLength(2);
      expect(tree[0].folder.name).toBe('B'); // Sorted by sortOrder
      expect(tree[1].folder.name).toBe('A');
    });

    it('should nest child folders correctly', () => {
      const root = createFolder({ id: 'root', name: 'Root', parentId: null, sortOrder: 0 });
      const child = createFolder({ id: 'child', name: 'Child', parentId: 'root', sortOrder: 0 });

      const tree = buildFolderTree([root, child], [], new Set());

      expect(tree).toHaveLength(1);
      expect(tree[0].folder.id).toBe('root');
      expect(tree[0].children).toHaveLength(1);
      expect(tree[0].children[0].folder.id).toBe('child');
    });

    it('should include note IDs in tree nodes', () => {
      const folder = createFolder({ id: 'f1' });
      const note = createNote({ id: 'note-1', folderId: 'f1' });

      const tree = buildFolderTree([folder], [note], new Set());

      expect(tree[0].noteIds).toContain('note-1');
    });

    it('should respect expanded state', () => {
      const folder = createFolder({ id: 'f1' });
      const expandedIds = new Set(['f1']);

      const tree = buildFolderTree([folder], [], expandedIds);

      expect(tree[0].isExpanded).toBe(true);
    });

    it('should compute depths correctly', () => {
      const root = createFolder({ id: 'root', parentId: null });
      const child = createFolder({ id: 'child', parentId: 'root' });
      const grandchild = createFolder({ id: 'grandchild', parentId: 'child' });

      const tree = buildFolderTree([root, child, grandchild], [], new Set(['root', 'child']));

      expect(tree[0].depth).toBe(0);
      expect(tree[0].children[0].depth).toBe(1);
      expect(tree[0].children[0].children[0].depth).toBe(2);
    });

    it('should treat orphaned folders as root', () => {
      const orphan = createFolder({ id: 'orphan', parentId: 'missing-parent' });
      const tree = buildFolderTree([orphan], [], new Set());

      expect(tree).toHaveLength(1);
      expect(tree[0].folder.id).toBe('orphan');
    });
  });

  describe('flattenFolderTree', () => {
    it('should return empty array for empty tree', () => {
      expect(flattenFolderTree([])).toEqual([]);
    });

    it('should flatten tree in order', () => {
      const root = createFolder({ id: 'root' });
      const child = createFolder({ id: 'child', parentId: 'root' });

      const tree: FolderTreeNode[] = [
        {
          folder: root,
          children: [
            { folder: child, children: [], noteIds: [], isExpanded: false, depth: 1 },
          ],
          noteIds: [],
          isExpanded: true,
          depth: 0,
        },
      ];

      const flat = flattenFolderTree(tree);

      expect(flat).toHaveLength(2);
      expect(flat[0].folder.id).toBe('root');
      expect(flat[1].folder.id).toBe('child');
    });

    it('should not include children of collapsed nodes', () => {
      const root = createFolder({ id: 'root' });
      const child = createFolder({ id: 'child', parentId: 'root' });

      const tree: FolderTreeNode[] = [
        {
          folder: root,
          children: [
            { folder: child, children: [], noteIds: [], isExpanded: false, depth: 1 },
          ],
          noteIds: [],
          isExpanded: false, // Not expanded
          depth: 0,
        },
      ];

      const flat = flattenFolderTree(tree);

      expect(flat).toHaveLength(1);
      expect(flat[0].folder.id).toBe('root');
    });
  });

  describe('validateFolderMove', () => {
    it('should allow move to root', () => {
      const result = validateFolderMove('folder-1', null, []);
      expect(result.valid).toBe(true);
    });

    it('should reject moving folder into itself', () => {
      const folder = createFolder({ id: 'folder-1' });
      const result = validateFolderMove('folder-1', 'folder-1', [folder]);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('itself');
    });

    it('should reject circular reference', () => {
      const parent = createFolder({ id: 'parent', parentId: null });
      const child = createFolder({ id: 'child', parentId: 'parent' });

      // Try to move parent into child
      const result = validateFolderMove('parent', 'child', [parent, child]);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('circular');
    });

    it('should allow valid moves', () => {
      const folder1 = createFolder({ id: 'f1', parentId: null });
      const folder2 = createFolder({ id: 'f2', parentId: null });

      const result = validateFolderMove('f1', 'f2', [folder1, folder2]);
      expect(result.valid).toBe(true);
    });
  });

  describe('validateFolderDepth', () => {
    it('should allow creation at root', () => {
      expect(validateFolderDepth(null, [])).toBe(true);
    });

    it('should allow creation within depth limit', () => {
      const parent = createFolder({ id: 'parent', parentId: null });
      expect(validateFolderDepth('parent', [parent])).toBe(true);
    });

    it('should reject creation beyond depth limit', () => {
      const folders: Folder[] = [];
      for (let i = 0; i < MAX_FOLDER_DEPTH; i++) {
        folders.push(
          createFolder({
            id: `folder-${i}`,
            parentId: i > 0 ? `folder-${i - 1}` : null,
          })
        );
      }

      // Try to create folder under the deepest one
      expect(validateFolderDepth(`folder-${MAX_FOLDER_DEPTH - 1}`, folders)).toBe(false);
    });
  });

  describe('findOrphanedFolders', () => {
    it('should return empty array when no orphans', () => {
      const root = createFolder({ id: 'root', parentId: null });
      const child = createFolder({ id: 'child', parentId: 'root' });

      expect(findOrphanedFolders([root, child])).toEqual([]);
    });

    it('should find orphaned folders', () => {
      const orphan = createFolder({ id: 'orphan', parentId: 'missing' });
      const root = createFolder({ id: 'root', parentId: null });

      const orphans = findOrphanedFolders([orphan, root]);

      expect(orphans).toHaveLength(1);
      expect(orphans[0].id).toBe('orphan');
    });
  });

  describe('repairOrphanedFolders', () => {
    it('should not modify valid folders', () => {
      const root = createFolder({ id: 'root', parentId: null });
      const child = createFolder({ id: 'child', parentId: 'root' });

      const repaired = repairOrphanedFolders([root, child]);

      expect(repaired[0].parentId).toBe(null);
      expect(repaired[1].parentId).toBe('root');
    });

    it('should repair orphaned folders by setting parentId to null', () => {
      const orphan = createFolder({ id: 'orphan', parentId: 'missing' });

      const repaired = repairOrphanedFolders([orphan]);

      expect(repaired[0].parentId).toBe(null);
    });
  });

  describe('createFolder (factory)', () => {
    // Note: Using imported function from folderUtils with different name
    // We import at top level as 'createFolder as createFolderFromUtils'
    // but since we shadow it locally, we need to access via module
    it('should create folder with provided name', async () => {
      // Dynamic import to avoid name collision with test factory
      const utils = await import('../folderUtils');
      const folder = utils.createFolder('Test Folder', null, []);

      expect(folder.name).toBe('Test Folder');
      expect(folder.parentId).toBe(null);
      expect(folder.id).toBeDefined();
    });

    it('should trim folder name', async () => {
      const utils = await import('../folderUtils');
      const folder = utils.createFolder('  Spaced Name  ', null, []);
      expect(folder.name).toBe('Spaced Name');
    });

    it('should assign sortOrder after siblings', async () => {
      const utils = await import('../folderUtils');
      const existing = createFolder({ id: 'sibling', parentId: null, sortOrder: 5 });
      const folder = utils.createFolder('New', null, [existing]);

      expect(folder.sortOrder).toBe(6);
    });

    it('should handle no siblings', async () => {
      const utils = await import('../folderUtils');
      const folder = utils.createFolder('First', null, []);
      expect(folder.sortOrder).toBe(0);
    });
  });

  describe('getNotesInFolder', () => {
    it('should return empty array for non-existent folder', () => {
      expect(getNotesInFolder('non-existent', [], [])).toEqual([]);
    });

    it('should return notes directly in folder', () => {
      const folder = createFolder({ id: 'f1' });
      const note1 = createNote({ id: 'n1', folderId: 'f1' });
      const note2 = createNote({ id: 'n2', folderId: 'f2' });

      const notes = getNotesInFolder('f1', [note1, note2], [folder]);

      expect(notes).toHaveLength(1);
      expect(notes[0].id).toBe('n1');
    });

    it('should include child folder notes when recursive', () => {
      const parent = createFolder({ id: 'parent', parentId: null });
      const child = createFolder({ id: 'child', parentId: 'parent' });
      const parentNote = createNote({ id: 'n1', folderId: 'parent' });
      const childNote = createNote({ id: 'n2', folderId: 'child' });

      const notes = getNotesInFolder('parent', [parentNote, childNote], [parent, child], {
        recursive: true,
      });

      expect(notes).toHaveLength(2);
    });

    it('should not duplicate notes in recursive mode', () => {
      const parent = createFolder({ id: 'parent', parentId: null });
      const note = createNote({ id: 'n1', folderId: 'parent' });

      const notes = getNotesInFolder('parent', [note], [parent], { recursive: true });

      expect(notes).toHaveLength(1);
    });
  });

  describe('addPathToFolder', () => {
    it('should add path and depth to folder', () => {
      const folder = createFolder({ id: 'f1', name: 'Root' });
      const result = addPathToFolder(folder, [folder]);

      expect(result.path).toBe('Root');
      expect(result.depth).toBe(0);
    });

    it('should calculate correct depth for nested folder', () => {
      const root = createFolder({ id: 'root', name: 'Root', parentId: null });
      const child = createFolder({ id: 'child', name: 'Child', parentId: 'root' });

      const result = addPathToFolder(child, [root, child]);

      expect(result.path).toBe('Root/Child');
      expect(result.depth).toBe(1);
    });

    it('should use cache when provided', () => {
      const folder = createFolder({ id: 'f1', name: 'Root' });
      const cache = new Map<string, string>();

      addPathToFolder(folder, [folder], cache);
      expect(cache.has('f1')).toBe(true);
    });
  });

  describe('normalizeSortOrders', () => {
    it('should normalize sort orders to sequential integers', () => {
      const f1 = createFolder({ id: 'f1', parentId: null, sortOrder: 5 });
      const f2 = createFolder({ id: 'f2', parentId: null, sortOrder: 10 });
      const f3 = createFolder({ id: 'f3', parentId: null, sortOrder: 2 });

      const normalized = normalizeSortOrders([f1, f2, f3]);
      const byId = new Map(normalized.map((f) => [f.id, f]));

      // Should be sorted by original order, then assigned 0, 1, 2
      expect(byId.get('f3')?.sortOrder).toBe(0);
      expect(byId.get('f1')?.sortOrder).toBe(1);
      expect(byId.get('f2')?.sortOrder).toBe(2);
    });

    it('should handle multiple parent groups', () => {
      const f1 = createFolder({ id: 'f1', parentId: null, sortOrder: 1 });
      const f2 = createFolder({ id: 'f2', parentId: null, sortOrder: 0 });
      const c1 = createFolder({ id: 'c1', parentId: 'f1', sortOrder: 5 });
      const c2 = createFolder({ id: 'c2', parentId: 'f1', sortOrder: 1 });

      const normalized = normalizeSortOrders([f1, f2, c1, c2]);
      const byId = new Map(normalized.map((f) => [f.id, f]));

      expect(byId.get('f2')?.sortOrder).toBe(0);
      expect(byId.get('f1')?.sortOrder).toBe(1);
      expect(byId.get('c2')?.sortOrder).toBe(0);
      expect(byId.get('c1')?.sortOrder).toBe(1);
    });
  });

  describe('sanitizeFolderName', () => {
    it('should remove invalid filesystem characters', () => {
      expect(sanitizeFolderName('test<>:"/\\|?*name')).toBe('test---------name');
    });

    it('should remove leading dots', () => {
      expect(sanitizeFolderName('...hidden')).toBe('hidden');
    });

    it('should remove trailing dots', () => {
      expect(sanitizeFolderName('folder...')).toBe('folder');
    });

    it('should collapse whitespace', () => {
      expect(sanitizeFolderName('folder   name')).toBe('folder name');
    });

    it('should trim whitespace', () => {
      expect(sanitizeFolderName('  folder  ')).toBe('folder');
    });

    it('should truncate to 100 characters', () => {
      const longName = 'a'.repeat(150);
      expect(sanitizeFolderName(longName).length).toBe(100);
    });

    it('should return "unnamed" for empty result', () => {
      expect(sanitizeFolderName('...')).toBe('unnamed');
      expect(sanitizeFolderName('')).toBe('unnamed');
    });

    it('should handle control characters', () => {
      const withControl = 'test\x00\x1fname';
      expect(sanitizeFolderName(withControl)).toBe('test--name');
    });
  });

  describe('localStorage operations', () => {
    let mockStorage: Record<string, string>;

    beforeEach(() => {
      mockStorage = {};
      // Mock localStorage methods
      vi.spyOn(window.localStorage, 'getItem').mockImplementation(
        (key: string) => mockStorage[key] || null
      );
      vi.spyOn(window.localStorage, 'setItem').mockImplementation(
        (key: string, value: string) => {
          mockStorage[key] = value;
        }
      );
      vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    describe('loadFoldersFromStorage', () => {
      it('should return empty array when no data', () => {
        expect(loadFoldersFromStorage()).toEqual([]);
      });

      it('should parse stored folders', () => {
        const folders = [createFolder({ id: 'f1' })];
        mockStorage[FOLDER_STORAGE_KEYS.FOLDERS] = JSON.stringify(folders);

        const loaded = loadFoldersFromStorage();
        expect(loaded).toHaveLength(1);
        expect(loaded[0].id).toBe('f1');
      });

      it('should deduplicate by ID', () => {
        const folder = createFolder({ id: 'f1', name: 'First' });
        const duplicate = createFolder({ id: 'f1', name: 'Duplicate' });
        mockStorage[FOLDER_STORAGE_KEYS.FOLDERS] = JSON.stringify([folder, duplicate]);

        const loaded = loadFoldersFromStorage();
        expect(loaded).toHaveLength(1);
        expect(loaded[0].name).toBe('First');
      });

      it('should repair orphaned folders', () => {
        const orphan = createFolder({ id: 'orphan', parentId: 'missing' });
        mockStorage[FOLDER_STORAGE_KEYS.FOLDERS] = JSON.stringify([orphan]);

        const loaded = loadFoldersFromStorage();
        expect(loaded[0].parentId).toBe(null);
      });

      it('should handle invalid JSON', () => {
        mockStorage[FOLDER_STORAGE_KEYS.FOLDERS] = 'invalid json';
        expect(loadFoldersFromStorage()).toEqual([]);
      });

      it('should handle non-array data', () => {
        mockStorage[FOLDER_STORAGE_KEYS.FOLDERS] = JSON.stringify({ notAnArray: true });
        expect(loadFoldersFromStorage()).toEqual([]);
      });
    });

    describe('saveFoldersToStorage', () => {
      it('should save folders to localStorage', () => {
        const folders = [createFolder({ id: 'f1' })];
        saveFoldersToStorage(folders);

        expect(mockStorage[FOLDER_STORAGE_KEYS.FOLDERS]).toBeDefined();
        const parsed = JSON.parse(mockStorage[FOLDER_STORAGE_KEYS.FOLDERS]);
        expect(parsed).toHaveLength(1);
      });
    });

    describe('loadFolderUIState', () => {
      it('should return defaults when no data', () => {
        const state = loadFolderUIState();

        expect(state.expandedFolderIds).toEqual([]);
        expect(state.activeFolderId).toBe(null);
        expect(state.folderViewMode).toBe('tree');
      });

      it('should parse stored state', () => {
        const state = {
          expandedFolderIds: ['f1', 'f2'],
          activeFolderId: 'f1',
          folderViewMode: 'flat',
        };
        mockStorage[FOLDER_STORAGE_KEYS.FOLDER_UI_STATE] = JSON.stringify(state);

        const loaded = loadFolderUIState();
        expect(loaded).toEqual(state);
      });

      it('should handle invalid JSON', () => {
        mockStorage[FOLDER_STORAGE_KEYS.FOLDER_UI_STATE] = 'invalid';
        const state = loadFolderUIState();

        expect(state.expandedFolderIds).toEqual([]);
      });
    });

    describe('saveFolderUIState', () => {
      it('should save UI state to localStorage', () => {
        const state = {
          expandedFolderIds: ['f1'],
          activeFolderId: 'f1' as string | null,
          folderViewMode: 'tree' as const,
        };

        saveFolderUIState(state);

        const parsed = JSON.parse(mockStorage[FOLDER_STORAGE_KEYS.FOLDER_UI_STATE]);
        expect(parsed).toEqual(state);
      });
    });
  });

  // Separate describe for storage error tests to avoid mock interference
  describe('localStorage error handling', () => {
    beforeEach(() => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage full');
      });
      vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('saveFoldersToStorage should handle storage errors gracefully', () => {
      expect(() => saveFoldersToStorage([])).not.toThrow();
      expect(console.error).toHaveBeenCalled();
    });

    it('saveFolderUIState should handle storage errors gracefully', () => {
      expect(() =>
        saveFolderUIState({
          expandedFolderIds: [],
          activeFolderId: null,
          folderViewMode: 'tree',
        })
      ).not.toThrow();
    });
  });
});
