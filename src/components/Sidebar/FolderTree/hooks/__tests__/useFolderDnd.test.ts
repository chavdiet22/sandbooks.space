/**
 * useFolderDnd hook tests.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFolderDnd } from '../useFolderDnd';
import type { DragStartEvent, DragEndEvent, DragOverEvent } from '@dnd-kit/core';

// Mock the store
const mockMoveFolder = vi.fn();
const mockMoveNoteToFolder = vi.fn();
const mockReorderNotesInFolder = vi.fn();

const mockStoreState = {
  notes: [
    { id: 'note-1', title: 'Note 1', folderId: 'folder-1', folderOrder: 0 },
    { id: 'note-2', title: 'Note 2', folderId: 'folder-1', folderOrder: 1 },
    { id: 'note-3', title: 'Note 3', folderId: null, folderOrder: 0 },
  ],
};

vi.mock('../../../../../store/notesStore', () => ({
  useNotesStore: Object.assign(
    vi.fn((selector) => {
      const store = {
        moveFolder: mockMoveFolder,
        moveNoteToFolder: mockMoveNoteToFolder,
        reorderNotesInFolder: mockReorderNotesInFolder,
      };
      return selector(store);
    }),
    {
      getState: () => mockStoreState,
    }
  ),
}));

describe('useFolderDnd', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns initial state', () => {
    const { result } = renderHook(() => useFolderDnd());

    expect(result.current.activeId).toBe(null);
    expect(result.current.activeData).toBe(null);
    expect(result.current.overId).toBe(null);
  });

  it('returns drag handler functions', () => {
    const { result } = renderHook(() => useFolderDnd());

    expect(typeof result.current.handleDragStart).toBe('function');
    expect(typeof result.current.handleDragOver).toBe('function');
    expect(typeof result.current.handleDragEnd).toBe('function');
    expect(typeof result.current.handleDragCancel).toBe('function');
  });

  describe('handleDragStart', () => {
    it('sets active id and data', () => {
      const { result } = renderHook(() => useFolderDnd());

      const event: Partial<DragStartEvent> = {
        active: {
          id: 'folder-1',
          data: {
            current: { type: 'folder', id: 'folder-1', parentId: null },
          },
          rect: {} as DragStartEvent['active']['rect'],
        },
      };

      act(() => {
        result.current.handleDragStart(event as DragStartEvent);
      });

      expect(result.current.activeId).toBe('folder-1');
      expect(result.current.activeData).toEqual({
        type: 'folder',
        id: 'folder-1',
        parentId: null,
      });
    });
  });

  describe('handleDragOver', () => {
    it('sets over id when over a droppable', () => {
      const { result } = renderHook(() => useFolderDnd());

      const event: Partial<DragOverEvent> = {
        over: {
          id: 'folder-2',
          rect: {} as DragOverEvent['over']['rect'],
          disabled: false,
          data: { current: {} },
        },
      };

      act(() => {
        result.current.handleDragOver(event as DragOverEvent);
      });

      expect(result.current.overId).toBe('folder-2');
    });

    it('sets over id to null when not over anything', () => {
      const { result } = renderHook(() => useFolderDnd());

      const event: Partial<DragOverEvent> = {
        over: null,
      };

      act(() => {
        result.current.handleDragOver(event as DragOverEvent);
      });

      expect(result.current.overId).toBe(null);
    });
  });

  describe('handleDragEnd', () => {
    it('resets state after drag end', () => {
      const { result } = renderHook(() => useFolderDnd());

      // First start a drag
      act(() => {
        result.current.handleDragStart({
          active: {
            id: 'folder-1',
            data: { current: { type: 'folder', id: 'folder-1', parentId: null } },
            rect: {} as DragStartEvent['active']['rect'],
          },
        } as DragStartEvent);
      });

      // Then end it
      act(() => {
        result.current.handleDragEnd({
          active: {
            id: 'folder-1',
            data: { current: { type: 'folder', id: 'folder-1', parentId: null } },
            rect: {} as DragEndEvent['active']['rect'],
          },
          over: null,
        } as DragEndEvent);
      });

      expect(result.current.activeId).toBe(null);
      expect(result.current.activeData).toBe(null);
      expect(result.current.overId).toBe(null);
    });

    it('does nothing when dropped on itself', () => {
      const { result } = renderHook(() => useFolderDnd());

      act(() => {
        result.current.handleDragEnd({
          active: {
            id: 'folder-1',
            data: { current: { type: 'folder', id: 'folder-1', parentId: null } },
            rect: {} as DragEndEvent['active']['rect'],
          },
          over: {
            id: 'folder-1',
            rect: {} as DragEndEvent['over']['rect'],
            disabled: false,
            data: { current: {} },
          },
        } as DragEndEvent);
      });

      expect(mockMoveFolder).not.toHaveBeenCalled();
    });

    it('moves folder inside another folder', () => {
      const { result } = renderHook(() => useFolderDnd());

      act(() => {
        result.current.handleDragEnd({
          active: {
            id: 'folder-1',
            data: { current: { type: 'folder', id: 'folder-1', parentId: null } },
            rect: {} as DragEndEvent['active']['rect'],
          },
          over: {
            id: 'folder-2',
            rect: {} as DragEndEvent['over']['rect'],
            disabled: false,
            data: { current: { type: 'folder', id: 'folder-2', parentId: null } },
          },
        } as DragEndEvent);
      });

      expect(mockMoveFolder).toHaveBeenCalledWith('folder-1', 'folder-2');
    });

    it('moves folder to root', () => {
      const { result } = renderHook(() => useFolderDnd());

      act(() => {
        result.current.handleDragEnd({
          active: {
            id: 'folder-1',
            data: { current: { type: 'folder', id: 'folder-1', parentId: 'parent-id' } },
            rect: {} as DragEndEvent['active']['rect'],
          },
          over: {
            id: 'root-drop-zone',
            rect: {} as DragEndEvent['over']['rect'],
            disabled: false,
            data: { current: {} },
          },
        } as DragEndEvent);
      });

      expect(mockMoveFolder).toHaveBeenCalledWith('folder-1', null);
    });

    it('moves note to a folder', () => {
      const { result } = renderHook(() => useFolderDnd());

      act(() => {
        result.current.handleDragEnd({
          active: {
            id: 'note-1',
            data: { current: { type: 'note', id: 'note-1', parentId: null } },
            rect: {} as DragEndEvent['active']['rect'],
          },
          over: {
            id: 'folder-1',
            rect: {} as DragEndEvent['over']['rect'],
            disabled: false,
            data: { current: { type: 'folder', id: 'folder-1', parentId: null } },
          },
        } as DragEndEvent);
      });

      expect(mockMoveNoteToFolder).toHaveBeenCalledWith('note-1', 'folder-1');
    });

    it('reorders notes within same folder', () => {
      const { result } = renderHook(() => useFolderDnd());

      act(() => {
        result.current.handleDragEnd({
          active: {
            id: 'note-1',
            data: { current: { type: 'note', id: 'note-1', parentId: 'folder-1' } },
            rect: {} as DragEndEvent['active']['rect'],
          },
          over: {
            id: 'note-2',
            rect: {} as DragEndEvent['over']['rect'],
            disabled: false,
            data: { current: { type: 'note', id: 'note-2', parentId: 'folder-1' } },
          },
        } as DragEndEvent);
      });

      expect(mockReorderNotesInFolder).toHaveBeenCalled();
    });

    it('moves note to another note\'s folder', () => {
      const { result } = renderHook(() => useFolderDnd());

      act(() => {
        result.current.handleDragEnd({
          active: {
            id: 'note-3',
            data: { current: { type: 'note', id: 'note-3', parentId: null } },
            rect: {} as DragEndEvent['active']['rect'],
          },
          over: {
            id: 'note-1',
            rect: {} as DragEndEvent['over']['rect'],
            disabled: false,
            data: { current: { type: 'note', id: 'note-1', parentId: 'folder-1' } },
          },
        } as DragEndEvent);
      });

      expect(mockMoveNoteToFolder).toHaveBeenCalledWith('note-3', 'folder-1');
    });

    it('moves note to root (unfiled)', () => {
      const { result } = renderHook(() => useFolderDnd());

      act(() => {
        result.current.handleDragEnd({
          active: {
            id: 'note-1',
            data: { current: { type: 'note', id: 'note-1', parentId: 'folder-1' } },
            rect: {} as DragEndEvent['active']['rect'],
          },
          over: {
            id: 'root-drop-zone',
            rect: {} as DragEndEvent['over']['rect'],
            disabled: false,
            data: { current: {} },
          },
        } as DragEndEvent);
      });

      expect(mockMoveNoteToFolder).toHaveBeenCalledWith('note-1', null);
    });

    it('handles missing drag data', () => {
      const { result } = renderHook(() => useFolderDnd());

      act(() => {
        result.current.handleDragEnd({
          active: {
            id: 'folder-1',
            data: { current: undefined },
            rect: {} as DragEndEvent['active']['rect'],
          },
          over: {
            id: 'folder-2',
            rect: {} as DragEndEvent['over']['rect'],
            disabled: false,
            data: { current: {} },
          },
        } as DragEndEvent);
      });

      expect(mockMoveFolder).not.toHaveBeenCalled();
      expect(mockMoveNoteToFolder).not.toHaveBeenCalled();
    });
  });

  describe('handleDragCancel', () => {
    it('resets all state', () => {
      const { result } = renderHook(() => useFolderDnd());

      // First start a drag
      act(() => {
        result.current.handleDragStart({
          active: {
            id: 'folder-1',
            data: { current: { type: 'folder', id: 'folder-1', parentId: null } },
            rect: {} as DragStartEvent['active']['rect'],
          },
        } as DragStartEvent);
      });

      // Then cancel it
      act(() => {
        result.current.handleDragCancel();
      });

      expect(result.current.activeId).toBe(null);
      expect(result.current.activeData).toBe(null);
      expect(result.current.overId).toBe(null);
    });
  });
});
