/**
 * TreeDragOverlay component tests.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TreeDragOverlay } from '../TreeDragOverlay';

// Mock DnD kit DragOverlay
vi.mock('@dnd-kit/core', () => ({
  DragOverlay: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="drag-overlay">{children}</div>
  ),
}));

// Mock store
const mockStore = {
  notes: [
    { id: 'note-1', title: 'Test Note' },
    { id: 'note-2', title: '' },
  ],
  folders: [
    { id: 'folder-1', name: 'Test Folder' },
    { id: 'folder-2', name: '' },
  ],
};

vi.mock('../../../../store/notesStore', () => ({
  useNotesStore: vi.fn((selector) => selector(mockStore)),
}));

describe('TreeDragOverlay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('returns null when activeData is null', () => {
      const { container } = render(<TreeDragOverlay activeData={null} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders DragOverlay wrapper when activeData provided', () => {
      render(<TreeDragOverlay activeData={{ type: 'note', id: 'note-1', parentId: null }} />);
      expect(screen.getByTestId('drag-overlay')).toBeInTheDocument();
    });
  });

  describe('folder drag', () => {
    it('displays folder name', () => {
      render(<TreeDragOverlay activeData={{ type: 'folder', id: 'folder-1', parentId: null }} />);
      expect(screen.getByText('Test Folder')).toBeInTheDocument();
    });

    it('shows fallback name when folder not found', () => {
      render(<TreeDragOverlay activeData={{ type: 'folder', id: 'non-existent', parentId: null }} />);
      expect(screen.getByText('Folder')).toBeInTheDocument();
    });

    it('renders empty name folder correctly', () => {
      render(<TreeDragOverlay activeData={{ type: 'folder', id: 'folder-2', parentId: null }} />);
      // Empty string passes nullish coalescing, so renders empty
      const overlay = screen.getByTestId('drag-overlay');
      expect(overlay).toBeInTheDocument();
    });
  });

  describe('note drag', () => {
    it('displays note title', () => {
      render(<TreeDragOverlay activeData={{ type: 'note', id: 'note-1', parentId: null }} />);
      expect(screen.getByText('Test Note')).toBeInTheDocument();
    });

    it('shows fallback name when note not found', () => {
      render(<TreeDragOverlay activeData={{ type: 'note', id: 'non-existent', parentId: null }} />);
      expect(screen.getByText('Note')).toBeInTheDocument();
    });

    it('renders empty title note correctly', () => {
      render(<TreeDragOverlay activeData={{ type: 'note', id: 'note-2', parentId: null }} />);
      // Empty string passes nullish coalescing, so renders empty
      const overlay = screen.getByTestId('drag-overlay');
      expect(overlay).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('renders with scale transform', () => {
      render(<TreeDragOverlay activeData={{ type: 'folder', id: 'folder-1', parentId: null }} />);
      const overlayContent = screen.getByText('Test Folder').parentElement;
      expect(overlayContent).toHaveStyle({ transform: 'scale(1.02)' });
    });

    it('has truncate class for text overflow', () => {
      render(<TreeDragOverlay activeData={{ type: 'note', id: 'note-1', parentId: null }} />);
      const textSpan = screen.getByText('Test Note');
      expect(textSpan).toHaveClass('truncate');
    });
  });
});
