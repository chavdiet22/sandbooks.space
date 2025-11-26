/**
 * FolderTree barrel file exports test.
 */
import { describe, it, expect } from 'vitest';
import {
  FolderTree,
  FolderTreeNode,
  NoteTreeItem,
  CreateFolderInline,
  useFolderTree,
} from '../index';
import type { FlattenedTreeItem } from '../index';

describe('FolderTree index exports', () => {
  it('exports FolderTree component', () => {
    expect(FolderTree).toBeDefined();
    expect(typeof FolderTree).toBe('function');
  });

  it('exports FolderTreeNode component', () => {
    expect(FolderTreeNode).toBeDefined();
    expect(typeof FolderTreeNode).toBe('function');
  });

  it('exports NoteTreeItem component', () => {
    expect(NoteTreeItem).toBeDefined();
    expect(typeof NoteTreeItem).toBe('function');
  });

  it('exports CreateFolderInline component', () => {
    expect(CreateFolderInline).toBeDefined();
    expect(typeof CreateFolderInline).toBe('function');
  });

  it('exports useFolderTree hook', () => {
    expect(useFolderTree).toBeDefined();
    expect(typeof useFolderTree).toBe('function');
  });

  it('FlattenedTreeItem type is usable', () => {
    // Type check - this will fail at compile time if type is not exported
    const item: FlattenedTreeItem = {
      id: 'test',
      type: 'note',
      depth: 0,
      parentId: null,
    };
    expect(item.id).toBe('test');
  });
});
