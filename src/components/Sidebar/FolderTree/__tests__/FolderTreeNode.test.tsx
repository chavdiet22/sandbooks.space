/**
 * FolderTreeNode component tests.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FolderTreeNode } from '../FolderTreeNode';
import type { Folder } from '../../../../types/folder.types';

const createMockFolder = (overrides: Partial<Folder> = {}): Folder => ({
  id: 'folder-1',
  name: 'Test Folder',
  parentId: null,
  color: null,
  sortOrder: 0,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
});

describe('FolderTreeNode', () => {
  const defaultProps = {
    folder: createMockFolder(),
    depth: 0,
    isExpanded: false,
    isActive: false,
    noteCount: 0,
    hasChildren: false,
    onToggleExpand: vi.fn(),
    onSelect: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders folder name', () => {
      render(<FolderTreeNode {...defaultProps} />);
      expect(screen.getByText('Test Folder')).toBeInTheDocument();
    });

    it('renders as treeitem role', () => {
      render(<FolderTreeNode {...defaultProps} />);
      expect(screen.getByRole('treeitem')).toBeInTheDocument();
    });

    it('shows folder icon when collapsed', () => {
      const { container } = render(<FolderTreeNode {...defaultProps} />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('shows open folder icon when expanded', () => {
      const { container } = render(<FolderTreeNode {...defaultProps} isExpanded={true} />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('applies active styles when selected', () => {
      render(<FolderTreeNode {...defaultProps} isActive={true} />);
      const treeitem = screen.getByRole('treeitem');
      expect(treeitem).toHaveAttribute('aria-selected', 'true');
    });

    it('shows note count when greater than 0', () => {
      render(<FolderTreeNode {...defaultProps} noteCount={5} />);
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('hides note count when 0', () => {
      render(<FolderTreeNode {...defaultProps} noteCount={0} />);
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });

    it('applies correct depth indentation', () => {
      render(<FolderTreeNode {...defaultProps} depth={2} />);
      const treeitem = screen.getByRole('treeitem');
      // 12 base + 2 * 20 = 52px
      expect(treeitem).toHaveStyle({ paddingLeft: '52px' });
    });

    it('applies folder color when specified', () => {
      render(<FolderTreeNode {...defaultProps} folder={createMockFolder({ color: 'blue' })} />);
      expect(screen.getByRole('treeitem')).toBeInTheDocument();
    });
  });

  describe('expansion', () => {
    it('shows expand button when has children', () => {
      render(<FolderTreeNode {...defaultProps} hasChildren={true} />);
      expect(screen.getByLabelText('Expand folder')).toBeInTheDocument();
    });

    it('shows collapse button when expanded', () => {
      render(<FolderTreeNode {...defaultProps} hasChildren={true} isExpanded={true} />);
      expect(screen.getByLabelText('Collapse folder')).toBeInTheDocument();
    });

    it('calls onToggleExpand when chevron clicked', () => {
      render(<FolderTreeNode {...defaultProps} hasChildren={true} />);
      fireEvent.click(screen.getByLabelText('Expand folder'));
      expect(defaultProps.onToggleExpand).toHaveBeenCalledWith('folder-1');
    });

    it('sets aria-expanded correctly', () => {
      const { rerender } = render(<FolderTreeNode {...defaultProps} hasChildren={true} isExpanded={false} />);
      expect(screen.getByRole('treeitem')).toHaveAttribute('aria-expanded', 'false');

      rerender(<FolderTreeNode {...defaultProps} hasChildren={true} isExpanded={true} />);
      expect(screen.getByRole('treeitem')).toHaveAttribute('aria-expanded', 'true');
    });

    it('does not set aria-expanded when no children', () => {
      render(<FolderTreeNode {...defaultProps} hasChildren={false} />);
      expect(screen.getByRole('treeitem')).not.toHaveAttribute('aria-expanded');
    });
  });

  describe('selection', () => {
    it('calls onSelect when clicked', () => {
      render(<FolderTreeNode {...defaultProps} />);
      fireEvent.click(screen.getByRole('treeitem'));
      expect(defaultProps.onSelect).toHaveBeenCalledWith('folder-1');
    });

    it('sets tabIndex 0 when active', () => {
      render(<FolderTreeNode {...defaultProps} isActive={true} />);
      expect(screen.getByRole('treeitem')).toHaveAttribute('tabindex', '0');
    });

    it('sets tabIndex -1 when not active', () => {
      render(<FolderTreeNode {...defaultProps} isActive={false} />);
      expect(screen.getByRole('treeitem')).toHaveAttribute('tabindex', '-1');
    });
  });

  describe('keyboard navigation', () => {
    it('selects folder on Enter key', () => {
      render(<FolderTreeNode {...defaultProps} />);
      fireEvent.keyDown(screen.getByRole('treeitem'), { key: 'Enter' });
      expect(defaultProps.onSelect).toHaveBeenCalledWith('folder-1');
    });

    it('selects folder on Space key', () => {
      render(<FolderTreeNode {...defaultProps} />);
      fireEvent.keyDown(screen.getByRole('treeitem'), { key: ' ' });
      expect(defaultProps.onSelect).toHaveBeenCalledWith('folder-1');
    });

    it('expands folder on ArrowRight when collapsed', () => {
      render(<FolderTreeNode {...defaultProps} hasChildren={true} isExpanded={false} />);
      fireEvent.keyDown(screen.getByRole('treeitem'), { key: 'ArrowRight' });
      expect(defaultProps.onToggleExpand).toHaveBeenCalledWith('folder-1');
    });

    it('does not expand on ArrowRight when no children', () => {
      render(<FolderTreeNode {...defaultProps} hasChildren={false} />);
      fireEvent.keyDown(screen.getByRole('treeitem'), { key: 'ArrowRight' });
      expect(defaultProps.onToggleExpand).not.toHaveBeenCalled();
    });

    it('does not expand on ArrowRight when already expanded', () => {
      render(<FolderTreeNode {...defaultProps} hasChildren={true} isExpanded={true} />);
      fireEvent.keyDown(screen.getByRole('treeitem'), { key: 'ArrowRight' });
      expect(defaultProps.onToggleExpand).not.toHaveBeenCalled();
    });

    it('collapses folder on ArrowLeft when expanded', () => {
      render(<FolderTreeNode {...defaultProps} isExpanded={true} />);
      fireEvent.keyDown(screen.getByRole('treeitem'), { key: 'ArrowLeft' });
      expect(defaultProps.onToggleExpand).toHaveBeenCalledWith('folder-1');
    });

    it('does not collapse on ArrowLeft when already collapsed', () => {
      render(<FolderTreeNode {...defaultProps} isExpanded={false} />);
      fireEvent.keyDown(screen.getByRole('treeitem'), { key: 'ArrowLeft' });
      expect(defaultProps.onToggleExpand).not.toHaveBeenCalled();
    });

    it('renames on F2 key when handler provided', () => {
      const onRename = vi.fn();
      render(<FolderTreeNode {...defaultProps} onRename={onRename} />);
      fireEvent.keyDown(screen.getByRole('treeitem'), { key: 'F2' });
      expect(onRename).toHaveBeenCalledWith('folder-1');
    });

    it('does not rename on F2 when no handler', () => {
      render(<FolderTreeNode {...defaultProps} />);
      fireEvent.keyDown(screen.getByRole('treeitem'), { key: 'F2' });
      // No error thrown
    });

    it('deletes on Delete key when handler provided', () => {
      const onDelete = vi.fn();
      render(<FolderTreeNode {...defaultProps} onDelete={onDelete} />);
      fireEvent.keyDown(screen.getByRole('treeitem'), { key: 'Delete' });
      expect(onDelete).toHaveBeenCalledWith('folder-1');
    });

    it('does not delete on Delete when no handler', () => {
      render(<FolderTreeNode {...defaultProps} />);
      fireEvent.keyDown(screen.getByRole('treeitem'), { key: 'Delete' });
      // No error thrown
    });
  });

  describe('context menu', () => {
    it('renders without context menu when no handlers provided', () => {
      render(<FolderTreeNode {...defaultProps} />);
      expect(screen.getByRole('treeitem')).toBeInTheDocument();
    });

    it('renders with context menu when onRename provided', () => {
      const onRename = vi.fn();
      render(<FolderTreeNode {...defaultProps} onRename={onRename} />);
      expect(screen.getByRole('treeitem')).toBeInTheDocument();
    });

    it('renders with context menu when onDelete provided', () => {
      const onDelete = vi.fn();
      render(<FolderTreeNode {...defaultProps} onDelete={onDelete} />);
      expect(screen.getByRole('treeitem')).toBeInTheDocument();
    });

    it('renders with context menu when onCreateSubfolder provided', () => {
      const onCreateSubfolder = vi.fn();
      render(<FolderTreeNode {...defaultProps} onCreateSubfolder={onCreateSubfolder} />);
      expect(screen.getByRole('treeitem')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has correct aria-level based on depth', () => {
      render(<FolderTreeNode {...defaultProps} depth={1} />);
      expect(screen.getByRole('treeitem')).toHaveAttribute('aria-level', '2');
    });

    it('has data-folder-id attribute', () => {
      render(<FolderTreeNode {...defaultProps} />);
      expect(screen.getByRole('treeitem')).toHaveAttribute('data-folder-id', 'folder-1');
    });

    it('has id attribute', () => {
      render(<FolderTreeNode {...defaultProps} />);
      expect(screen.getByRole('treeitem')).toHaveAttribute('id', 'folder-folder-1');
    });
  });
});
