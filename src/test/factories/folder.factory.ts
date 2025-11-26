/**
 * Test factories for Folder-related types.
 */
import { faker } from '@faker-js/faker';
import type {
  Folder,
  FolderColor,
  FolderTreeNode,
  FolderWithChildren,
  FolderWithPath,
} from '../../types/folder.types';

const FOLDER_COLORS: FolderColor[] = [
  'gray', 'red', 'orange', 'amber', 'yellow', 'green',
  'emerald', 'blue', 'indigo', 'purple', 'pink', 'rose',
];

/**
 * Creates a mock Folder with sensible defaults.
 */
export const createFolder = (overrides: Partial<Folder> = {}): Folder => ({
  id: overrides.id ?? faker.string.nanoid(),
  name: overrides.name ?? faker.lorem.word(),
  parentId: overrides.parentId ?? null,
  color: overrides.color ?? faker.helpers.arrayElement(FOLDER_COLORS),
  icon: overrides.icon,
  sortOrder: overrides.sortOrder ?? 0,
  createdAt: overrides.createdAt ?? Date.now(),
  updatedAt: overrides.updatedAt ?? Date.now(),
  ...overrides,
});

/**
 * Creates a FolderWithPath for breadcrumb testing.
 */
export const createFolderWithPath = (
  path = 'Root/Folder',
  depth = 1,
  overrides: Partial<Folder> = {}
): FolderWithPath => ({
  ...createFolder(overrides),
  path,
  depth,
});

/**
 * Creates a FolderWithChildren for tree rendering tests.
 */
export const createFolderWithChildren = (
  children: FolderWithChildren[] = [],
  noteCount = 0,
  overrides: Partial<Folder> = {}
): FolderWithChildren => ({
  ...createFolder(overrides),
  children,
  noteCount,
  totalNoteCount: noteCount + children.reduce((sum, c) => sum + c.totalNoteCount, 0),
});

/**
 * Creates a FolderTreeNode for tree rendering.
 */
export const createFolderTreeNode = (
  overrides: Partial<FolderTreeNode> = {}
): FolderTreeNode => ({
  folder: overrides.folder ?? createFolder(),
  children: overrides.children ?? [],
  noteIds: overrides.noteIds ?? [],
  isExpanded: overrides.isExpanded ?? false,
  depth: overrides.depth ?? 0,
  ...overrides,
});

/**
 * Creates a simple folder hierarchy.
 */
export const createFolderHierarchy = (): {
  root: Folder;
  child: Folder;
  grandchild: Folder;
} => {
  const root = createFolder({ name: 'Root' });
  const child = createFolder({ name: 'Child', parentId: root.id });
  const grandchild = createFolder({ name: 'Grandchild', parentId: child.id });
  return { root, child, grandchild };
};

/**
 * Creates multiple folders at root level.
 */
export const createFolders = (count: number): Folder[] =>
  Array.from({ length: count }, (_, i) =>
    createFolder({ name: `Folder ${i + 1}`, sortOrder: i })
  );
