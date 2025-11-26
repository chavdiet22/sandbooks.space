/**
 * FolderTree component tests.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FolderTree } from '../FolderTree';

// Mock framer-motion - filter out non-DOM props
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  m: {
    div: ({ children, layout: _layout, initial: _initial, animate: _animate, exit: _exit, variants: _variants, transition: _transition, ...props }: React.ComponentProps<'div'> & { layout?: boolean | string; initial?: unknown; animate?: unknown; exit?: unknown; variants?: unknown; transition?: unknown }) => (
      <div {...props}>{children}</div>
    ),
  },
}));

// Mock DnD kit
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  closestCenter: vi.fn(),
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
}));

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  sortableKeyboardCoordinates: vi.fn(),
  verticalListSortingStrategy: {},
}));

// Mock store
const mockStore = {
  notes: [
    { id: 'note-1', title: 'Note 1', content: { type: 'doc', content: [] }, folderId: null },
    { id: 'note-2', title: 'Note 2', content: { type: 'doc', content: [] }, folderId: 'folder-1' },
  ],
  folders: [
    { id: 'folder-1', name: 'My Folder', parentId: null, sortOrder: 0 },
  ],
  setActiveNote: vi.fn(),
  deleteNote: vi.fn(),
  deleteFolder: vi.fn(),
  updateFolder: vi.fn(),
  setFolderViewMode: vi.fn(),
};

vi.mock('../../../../store/notesStore', () => ({
  useNotesStore: vi.fn((selector) => {
    if (typeof selector === 'function') {
      return selector(mockStore);
    }
    return mockStore;
  }),
}));

// Mock folder tree hook
const mockFolderTree = {
  flattenedItems: [
    { id: 'folder-1', type: 'folder', depth: 0, parentId: null, folder: { id: 'folder-1', name: 'My Folder', parentId: null, sortOrder: 0 }, hasChildren: false },
    { id: 'note-2', type: 'note', depth: 1, parentId: 'folder-1', note: { id: 'note-2', title: 'Note 2', content: { type: 'doc' }, folderId: 'folder-1' } },
    { id: 'note-1', type: 'note', depth: 0, parentId: null, note: { id: 'note-1', title: 'Note 1', content: { type: 'doc' }, folderId: null } },
  ],
  activeFolderId: null,
  activeNoteId: 'note-1',
  expandedFolderIds: new Set<string>(['folder-1']),
  folderViewMode: 'tree' as const,
  folderNoteCounts: new Map([['folder-1', 1]]),
  toggleFolderExpanded: vi.fn(),
  setActiveFolder: vi.fn(),
  createFolder: vi.fn(),
};

vi.mock('../hooks/useFolderTree', () => ({
  useFolderTree: () => mockFolderTree,
}));

// Mock folder DnD hook
vi.mock('../hooks/useFolderDnd', () => ({
  useFolderDnd: () => ({
    activeId: null,
    activeData: null,
    handleDragStart: vi.fn(),
    handleDragOver: vi.fn(),
    handleDragEnd: vi.fn(),
    handleDragCancel: vi.fn(),
  }),
}));

// Mock child components
vi.mock('../FolderTreeNode', () => ({
  FolderTreeNode: ({ folder, onSelect, onToggleExpand, onRename, onDelete, onCreateSubfolder }: {
    folder: { id: string; name: string };
    onSelect: (id: string) => void;
    onToggleExpand: (id: string) => void;
    onRename?: (id: string) => void;
    onDelete?: (id: string) => void;
    onCreateSubfolder?: (id: string) => void;
  }) => (
    <div
      data-testid={`folder-${folder.id}`}
      role="treeitem"
      onClick={() => onSelect(folder.id)}
    >
      <span>{folder.name}</span>
      <button onClick={(e) => { e.stopPropagation(); onToggleExpand(folder.id); }} aria-label="Toggle">Toggle</button>
      {onRename && <button onClick={(e) => { e.stopPropagation(); onRename(folder.id); }} aria-label="Rename">Rename</button>}
      {onDelete && <button onClick={(e) => { e.stopPropagation(); onDelete(folder.id); }} aria-label="Delete folder">Delete</button>}
      {onCreateSubfolder && <button onClick={(e) => { e.stopPropagation(); onCreateSubfolder(folder.id); }} aria-label="Create subfolder">Subfolder</button>}
    </div>
  ),
}));

vi.mock('../NoteTreeItem', () => ({
  NoteTreeItem: ({ note, onSelect, onDelete, onCopyMarkdown }: {
    note: { id: string; title: string };
    onSelect: (id: string) => void;
    onDelete: (id: string, title: string) => void;
    onCopyMarkdown: (id: string) => void;
  }) => (
    <div
      data-testid={`note-${note.id}`}
      role="treeitem"
      onClick={() => onSelect(note.id)}
    >
      <span>{note.title}</span>
      <button onClick={(e) => { e.stopPropagation(); onDelete(note.id, note.title); }} aria-label="Delete note">Delete</button>
      <button onClick={(e) => { e.stopPropagation(); onCopyMarkdown(note.id); }} aria-label="Copy">Copy</button>
    </div>
  ),
}));

vi.mock('../DraggableTreeItem', () => ({
  DraggableTreeItem: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../TreeDragOverlay', () => ({
  TreeDragOverlay: () => null,
}));

vi.mock('../CreateFolderInline', () => ({
  CreateFolderInline: ({ onConfirm, onCancel }: {
    onConfirm: (name: string) => void;
    onCancel: () => void;
  }) => (
    <div data-testid="create-folder-inline">
      <input aria-label="Folder name" data-testid="folder-input" />
      <button onClick={() => onConfirm('New Folder')} aria-label="Create">Create</button>
      <button onClick={onCancel} aria-label="Cancel">Cancel</button>
    </div>
  ),
}));

vi.mock('../RenameFolderInline', () => ({
  RenameFolderInline: ({ currentName, onConfirm, onCancel }: {
    currentName: string;
    onConfirm: (name: string) => void;
    onCancel: () => void;
  }) => (
    <div data-testid="rename-folder-inline">
      <input aria-label="Folder name" defaultValue={currentName} />
      <button onClick={() => onConfirm('Renamed Folder')} aria-label="Save">Save</button>
      <button onClick={onCancel} aria-label="Cancel rename">Cancel</button>
    </div>
  ),
}));

// Mock utilities
vi.mock('../../../../utils/markdownSerializer', () => ({
  serializeToMarkdown: vi.fn(() => '# Test Markdown'),
}));

vi.mock('../../../../hooks/useCopyToClipboard', () => ({
  useCopyToClipboard: () => ({
    copy: vi.fn(),
  }),
}));

vi.mock('../../../../utils/toast', () => ({
  showToast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../../../ui/ConfirmDialog', () => ({
  ConfirmDialog: ({ isOpen, onConfirm, onCancel, title, message }: {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    title: string;
    message: string;
  }) => isOpen ? (
    <div data-testid="confirm-dialog" role="dialog">
      <h2>{title}</h2>
      <p>{message}</p>
      <button onClick={onConfirm}>Confirm</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ) : null,
}));

describe('FolderTree', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders header with Folders label', () => {
      render(<FolderTree />);
      expect(screen.getByText('Folders')).toBeInTheDocument();
    });

    it('renders tree role container', () => {
      render(<FolderTree />);
      expect(screen.getByRole('tree', { name: 'Folder tree' })).toBeInTheDocument();
    });

    it('renders All Notes row', () => {
      render(<FolderTree />);
      expect(screen.getByText('All Notes')).toBeInTheDocument();
    });

    it('shows total note count', () => {
      render(<FolderTree />);
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('renders view mode toggle button', () => {
      render(<FolderTree />);
      expect(screen.getByLabelText(/Switch to flat view/)).toBeInTheDocument();
    });

    it('renders create folder button', () => {
      render(<FolderTree />);
      expect(screen.getByLabelText('Create folder')).toBeInTheDocument();
    });

    it('renders folder nodes', () => {
      render(<FolderTree />);
      expect(screen.getByTestId('folder-folder-1')).toBeInTheDocument();
    });

    it('renders note items', () => {
      render(<FolderTree />);
      expect(screen.getByTestId('note-note-1')).toBeInTheDocument();
      expect(screen.getByTestId('note-note-2')).toBeInTheDocument();
    });
  });

  describe('All Notes selection', () => {
    it('calls setActiveFolder with null when All Notes clicked', () => {
      render(<FolderTree />);
      fireEvent.click(screen.getByText('All Notes'));
      expect(mockFolderTree.setActiveFolder).toHaveBeenCalledWith(null);
    });

    it('shows active state when activeFolderId is null', () => {
      render(<FolderTree />);
      const allNotesRow = screen.getByText('All Notes').closest('[role="treeitem"]');
      expect(allNotesRow).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('view mode toggle', () => {
    it('calls setFolderViewMode when toggle clicked', () => {
      render(<FolderTree />);
      fireEvent.click(screen.getByLabelText(/Switch to flat view/));
      expect(mockStore.setFolderViewMode).toHaveBeenCalledWith('flat');
    });
  });

  describe('folder creation', () => {
    it('shows create folder inline when button clicked', () => {
      render(<FolderTree />);
      fireEvent.click(screen.getByLabelText('Create folder'));
      expect(screen.getByTestId('create-folder-inline')).toBeInTheDocument();
    });

    it('creates folder when confirmed', async () => {
      render(<FolderTree />);
      fireEvent.click(screen.getByLabelText('Create folder'));

      const createButton = screen.getByLabelText('Create');
      fireEvent.click(createButton);

      expect(mockFolderTree.createFolder).toHaveBeenCalledWith('New Folder', null);
    });

    it('hides create folder inline when cancelled', () => {
      render(<FolderTree />);
      fireEvent.click(screen.getByLabelText('Create folder'));
      expect(screen.getByTestId('create-folder-inline')).toBeInTheDocument();

      fireEvent.click(screen.getByLabelText('Cancel'));
      expect(screen.queryByTestId('create-folder-inline')).not.toBeInTheDocument();
    });
  });

  describe('folder selection', () => {
    it('calls setActiveFolder when folder clicked', () => {
      render(<FolderTree />);
      fireEvent.click(screen.getByTestId('folder-folder-1'));
      expect(mockFolderTree.setActiveFolder).toHaveBeenCalledWith('folder-1');
    });
  });

  describe('folder rename', () => {
    it('shows rename inline when rename button clicked', () => {
      render(<FolderTree />);
      const renameButton = screen.getByLabelText('Rename');
      fireEvent.click(renameButton);
      expect(screen.getByTestId('rename-folder-inline')).toBeInTheDocument();
    });

    it('updates folder when rename confirmed', () => {
      render(<FolderTree />);
      fireEvent.click(screen.getByLabelText('Rename'));
      fireEvent.click(screen.getByLabelText('Save'));
      expect(mockStore.updateFolder).toHaveBeenCalledWith('folder-1', { name: 'Renamed Folder' });
    });

    it('hides rename inline when cancelled', () => {
      render(<FolderTree />);
      fireEvent.click(screen.getByLabelText('Rename'));
      expect(screen.getByTestId('rename-folder-inline')).toBeInTheDocument();

      fireEvent.click(screen.getByLabelText('Cancel rename'));
      expect(screen.queryByTestId('rename-folder-inline')).not.toBeInTheDocument();
    });
  });

  describe('folder deletion', () => {
    it('shows confirm dialog when delete clicked', () => {
      render(<FolderTree />);
      fireEvent.click(screen.getByLabelText('Delete folder'));
      expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
    });

    it('shows folder name in delete confirmation', () => {
      render(<FolderTree />);
      fireEvent.click(screen.getByLabelText('Delete folder'));
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveTextContent('My Folder');
    });

    it('deletes folder when confirmed', () => {
      render(<FolderTree />);
      fireEvent.click(screen.getByLabelText('Delete folder'));
      fireEvent.click(screen.getByText('Confirm'));
      expect(mockStore.deleteFolder).toHaveBeenCalledWith('folder-1');
    });

    it('closes dialog when cancelled', () => {
      render(<FolderTree />);
      fireEvent.click(screen.getByLabelText('Delete folder'));
      fireEvent.click(screen.getByText('Cancel'));
      expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument();
    });
  });

  describe('note selection', () => {
    it('calls setActiveNote when note clicked', () => {
      render(<FolderTree />);
      fireEvent.click(screen.getByTestId('note-note-1'));
      expect(mockStore.setActiveNote).toHaveBeenCalledWith('note-1');
    });
  });

  describe('note deletion', () => {
    it('shows confirm dialog when note delete clicked', () => {
      render(<FolderTree />);
      const deleteButtons = screen.getAllByLabelText('Delete note');
      fireEvent.click(deleteButtons[0]);
      expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
    });

    it('deletes note when confirmed', () => {
      render(<FolderTree />);
      const deleteButtons = screen.getAllByLabelText('Delete note');
      fireEvent.click(deleteButtons[0]);
      fireEvent.click(screen.getByText('Confirm'));
      expect(mockStore.deleteNote).toHaveBeenCalled();
    });
  });

  describe('subfolder creation', () => {
    it('shows create folder inline under parent when subfolder button clicked', () => {
      render(<FolderTree />);
      fireEvent.click(screen.getByLabelText('Create subfolder'));
      expect(screen.getByTestId('create-folder-inline')).toBeInTheDocument();
    });
  });

  describe('mobile mode', () => {
    it('applies mobile padding class', () => {
      const { container } = render(<FolderTree isMobile={true} />);
      const treeContainer = container.querySelector('.pb-safe');
      expect(treeContainer).toBeInTheDocument();
    });
  });

  describe('folder toggle', () => {
    it('calls toggleFolderExpanded when toggle clicked', () => {
      render(<FolderTree />);
      fireEvent.click(screen.getByLabelText('Toggle'));
      expect(mockFolderTree.toggleFolderExpanded).toHaveBeenCalledWith('folder-1');
    });
  });
});
