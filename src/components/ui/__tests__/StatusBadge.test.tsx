/**
 * StatusBadge tests.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StatusBadge } from '../StatusBadge';

// Mock the store
vi.mock('../../../store/notesStore', () => ({
  useNotesStore: vi.fn(),
}));

import { useNotesStore } from '../../../store/notesStore';

describe('StatusBadge', () => {
  const mockUseNotesStore = useNotesStore as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock - no issues
    mockUseNotesStore.mockReturnValue({
      isOnline: true,
      gitHubStatus: 'idle',
      isSyncConflictModalOpen: false,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns null when hidden (all good)', () => {
    mockUseNotesStore.mockReturnValue({
      isOnline: true,
      gitHubStatus: 'idle',
      isSyncConflictModalOpen: false,
    });

    const { container } = render(<StatusBadge />);

    expect(container.firstChild).toBeNull();
  });

  it('shows syncing state', () => {
    mockUseNotesStore.mockReturnValue({
      isOnline: true,
      gitHubStatus: 'syncing',
      isSyncConflictModalOpen: false,
    });

    render(<StatusBadge />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Syncing')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Status: Syncing');
  });

  it('shows conflict state (priority over syncing)', () => {
    mockUseNotesStore.mockReturnValue({
      isOnline: true,
      gitHubStatus: 'syncing',
      isSyncConflictModalOpen: true,
    });

    render(<StatusBadge />);

    expect(screen.getByText('Conflict')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Status: Conflict');
  });

  it('shows error state', () => {
    mockUseNotesStore.mockReturnValue({
      isOnline: true,
      gitHubStatus: 'error',
      isSyncConflictModalOpen: false,
    });

    render(<StatusBadge />);

    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Status: Error');
  });

  it('shows offline state', () => {
    mockUseNotesStore.mockReturnValue({
      isOnline: false,
      gitHubStatus: 'idle',
      isSyncConflictModalOpen: false,
    });

    render(<StatusBadge />);

    expect(screen.getByText('Offline')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Status: Offline');
  });

  it('error takes priority over offline', () => {
    mockUseNotesStore.mockReturnValue({
      isOnline: false,
      gitHubStatus: 'error',
      isSyncConflictModalOpen: false,
    });

    render(<StatusBadge />);

    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('conflict takes priority over error', () => {
    mockUseNotesStore.mockReturnValue({
      isOnline: true,
      gitHubStatus: 'error',
      isSyncConflictModalOpen: true,
    });

    render(<StatusBadge />);

    expect(screen.getByText('Conflict')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    mockUseNotesStore.mockReturnValue({
      isOnline: true,
      gitHubStatus: 'syncing',
      isSyncConflictModalOpen: false,
    });

    render(<StatusBadge className="custom-class" />);

    expect(screen.getByRole('status')).toHaveClass('custom-class');
  });

  it('has correct accessibility attributes', () => {
    mockUseNotesStore.mockReturnValue({
      isOnline: true,
      gitHubStatus: 'syncing',
      isSyncConflictModalOpen: false,
    });

    render(<StatusBadge />);

    const badge = screen.getByRole('status');
    expect(badge).toHaveAttribute('aria-live', 'polite');
  });
});
