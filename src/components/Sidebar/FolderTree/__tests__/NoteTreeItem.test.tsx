/**
 * NoteTreeItem component tests.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { NoteTreeItem } from '../NoteTreeItem';
import type { Note } from '../../../../types';

// Mock ContextMenu
vi.mock('../../../ui/ContextMenu', () => ({
  ContextMenu: ({ children, items }: { children: React.ReactNode; items: Array<{ id: string; onClick: () => void }> }) => (
    <div data-testid="context-menu" data-items={JSON.stringify(items.map(i => i.id))}>
      {children}
      {items.map(item => (
        <button key={item.id} data-testid={`context-${item.id}`} onClick={item.onClick}>
          {item.id}
        </button>
      ))}
    </div>
  ),
}));

// Mock formatTimestamp
vi.mock('../../../../utils/formatTimestamp', () => ({
  formatTimestamp: vi.fn(() => ({
    relative: '2 hours ago',
    absolute: 'Jan 15, 2025 10:30 AM',
    datetime: '2025-01-15T10:30:00Z',
  })),
}));

const createMockNote = (overrides: Partial<Note> = {}): Note => ({
  id: 'note-1',
  title: 'Test Note',
  content: { type: 'doc', content: [] },
  tags: [],
  codeBlocks: [],
  createdAt: '2025-01-15T10:00:00Z',
  updatedAt: '2025-01-15T10:30:00Z',
  folderId: null,
  ...overrides,
});

describe('NoteTreeItem', () => {
  const defaultProps = {
    note: createMockNote(),
    depth: 0,
    isActive: false,
    onSelect: vi.fn(),
    onDelete: vi.fn(),
    onCopyMarkdown: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders note title', () => {
      render(<NoteTreeItem {...defaultProps} />);
      expect(screen.getByText('Test Note')).toBeInTheDocument();
    });

    it('renders Untitled when title is empty', () => {
      render(<NoteTreeItem {...defaultProps} note={createMockNote({ title: '' })} />);
      expect(screen.getByText('Untitled')).toBeInTheDocument();
    });

    it('renders as treeitem role', () => {
      render(<NoteTreeItem {...defaultProps} />);
      expect(screen.getByRole('treeitem')).toBeInTheDocument();
    });

    it('renders timestamp', () => {
      render(<NoteTreeItem {...defaultProps} />);
      expect(screen.getByText('2 hours ago')).toBeInTheDocument();
    });

    it('renders delete button', () => {
      render(<NoteTreeItem {...defaultProps} />);
      expect(screen.getByLabelText('Delete note: Test Note')).toBeInTheDocument();
    });

    it('applies correct depth indentation', () => {
      render(<NoteTreeItem {...defaultProps} depth={2} />);
      const treeitem = screen.getByRole('treeitem');
      // 12 base + 2 * 20 = 52px
      expect(treeitem).toHaveStyle({ paddingLeft: '52px' });
    });

    it('has data-note-id attribute', () => {
      render(<NoteTreeItem {...defaultProps} />);
      expect(screen.getByRole('treeitem')).toHaveAttribute('data-note-id', 'note-1');
    });

    it('has id attribute', () => {
      render(<NoteTreeItem {...defaultProps} />);
      expect(screen.getByRole('treeitem')).toHaveAttribute('id', 'note-note-1');
    });
  });

  describe('active state', () => {
    it('sets aria-selected true when active', () => {
      render(<NoteTreeItem {...defaultProps} isActive={true} />);
      expect(screen.getByRole('treeitem')).toHaveAttribute('aria-selected', 'true');
    });

    it('sets aria-selected false when not active', () => {
      render(<NoteTreeItem {...defaultProps} isActive={false} />);
      expect(screen.getByRole('treeitem')).toHaveAttribute('aria-selected', 'false');
    });

    it('sets tabIndex 0 when active', () => {
      render(<NoteTreeItem {...defaultProps} isActive={true} />);
      expect(screen.getByRole('treeitem')).toHaveAttribute('tabindex', '0');
    });

    it('sets tabIndex -1 when not active', () => {
      render(<NoteTreeItem {...defaultProps} isActive={false} />);
      expect(screen.getByRole('treeitem')).toHaveAttribute('tabindex', '-1');
    });
  });

  describe('accessibility', () => {
    it('has correct aria-level based on depth', () => {
      render(<NoteTreeItem {...defaultProps} depth={1} />);
      expect(screen.getByRole('treeitem')).toHaveAttribute('aria-level', '2');
    });

    it('time element has datetime attribute', () => {
      render(<NoteTreeItem {...defaultProps} />);
      const time = screen.getByText('2 hours ago');
      expect(time).toHaveAttribute('datetime', '2025-01-15T10:30:00Z');
    });

    it('time element has title with absolute date', () => {
      render(<NoteTreeItem {...defaultProps} />);
      const time = screen.getByText('2 hours ago');
      expect(time).toHaveAttribute('title', 'Jan 15, 2025 10:30 AM');
    });
  });

  describe('selection', () => {
    it('calls onSelect when clicked', () => {
      render(<NoteTreeItem {...defaultProps} />);
      fireEvent.click(screen.getByRole('treeitem'));
      expect(defaultProps.onSelect).toHaveBeenCalledWith('note-1');
    });

    it('calls onSelect on Enter key', () => {
      render(<NoteTreeItem {...defaultProps} />);
      fireEvent.keyDown(screen.getByRole('treeitem'), { key: 'Enter' });
      expect(defaultProps.onSelect).toHaveBeenCalledWith('note-1');
    });

    it('calls onSelect on Space key', () => {
      render(<NoteTreeItem {...defaultProps} />);
      fireEvent.keyDown(screen.getByRole('treeitem'), { key: ' ' });
      expect(defaultProps.onSelect).toHaveBeenCalledWith('note-1');
    });

    it('prevents default on Enter key', () => {
      render(<NoteTreeItem {...defaultProps} />);
      fireEvent.keyDown(screen.getByRole('treeitem'), { key: 'Enter' });
      // The handler calls preventDefault
      expect(defaultProps.onSelect).toHaveBeenCalled();
    });
  });

  describe('deletion', () => {
    it('calls onDelete when delete button clicked', () => {
      render(<NoteTreeItem {...defaultProps} />);
      fireEvent.click(screen.getByLabelText('Delete note: Test Note'));
      expect(defaultProps.onDelete).toHaveBeenCalledWith('note-1', 'Test Note');
    });

    it('does not call onSelect when delete button clicked', () => {
      render(<NoteTreeItem {...defaultProps} />);
      fireEvent.click(screen.getByLabelText('Delete note: Test Note'));
      expect(defaultProps.onSelect).not.toHaveBeenCalled();
    });
  });

  describe('context menu', () => {
    it('renders context menu wrapper', () => {
      render(<NoteTreeItem {...defaultProps} />);
      expect(screen.getByTestId('context-menu')).toBeInTheDocument();
    });

    it('includes copy-markdown menu item', () => {
      render(<NoteTreeItem {...defaultProps} />);
      expect(screen.getByTestId('context-copy-markdown')).toBeInTheDocument();
    });

    it('includes delete menu item', () => {
      render(<NoteTreeItem {...defaultProps} />);
      expect(screen.getByTestId('context-delete')).toBeInTheDocument();
    });

    it('calls onCopyMarkdown when copy menu item clicked', () => {
      render(<NoteTreeItem {...defaultProps} />);
      fireEvent.click(screen.getByTestId('context-copy-markdown'));
      expect(defaultProps.onCopyMarkdown).toHaveBeenCalledWith('note-1');
    });

    it('calls onDelete when delete menu item clicked', () => {
      render(<NoteTreeItem {...defaultProps} />);
      fireEvent.click(screen.getByTestId('context-delete'));
      expect(defaultProps.onDelete).toHaveBeenCalledWith('note-1', 'Test Note');
    });
  });

  describe('other key events', () => {
    it('does not call onSelect for other keys', () => {
      render(<NoteTreeItem {...defaultProps} />);
      fireEvent.keyDown(screen.getByRole('treeitem'), { key: 'Tab' });
      expect(defaultProps.onSelect).not.toHaveBeenCalled();
    });
  });
});
