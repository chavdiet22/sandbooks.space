/**
 * SyncConflictModal tests.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SyncConflictModal } from '../SyncConflictModal';

// Mock the store
vi.mock('../../../store/notesStore', () => ({
  useNotesStore: vi.fn(),
}));

// Mock toast
vi.mock('../../../utils/toast', () => ({
  showToast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { useNotesStore } from '../../../store/notesStore';

describe('SyncConflictModal', () => {
  const mockSetSyncConflictModalOpen = vi.fn();
  const mockResolveInitialSyncConflict = vi.fn();
  const mockUseNotesStore = useNotesStore as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseNotesStore.mockReturnValue({
      isSyncConflictModalOpen: true,
      setSyncConflictModalOpen: mockSetSyncConflictModalOpen,
      resolveInitialSyncConflict: mockResolveInitialSyncConflict,
      notes: [{ id: '1', title: 'Test Note' }],
      gitHubRepo: 'user/repo',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns null when not open', () => {
    mockUseNotesStore.mockReturnValue({
      isSyncConflictModalOpen: false,
      setSyncConflictModalOpen: mockSetSyncConflictModalOpen,
      resolveInitialSyncConflict: mockResolveInitialSyncConflict,
      notes: [],
      gitHubRepo: null,
    });

    const { container } = render(<SyncConflictModal />);

    expect(container.firstChild).toBeNull();
  });

  it('renders modal when open', () => {
    render(<SyncConflictModal />);

    // Check for modal content
    expect(screen.getByText('Merge Both')).toBeInTheDocument();
    expect(screen.getByText('Use GitHub')).toBeInTheDocument();
    expect(screen.getByText('Use Local')).toBeInTheDocument();
  });

  it('displays all strategy options', () => {
    render(<SyncConflictModal />);

    expect(screen.getByText('Merge Both')).toBeInTheDocument();
    expect(screen.getByText('Use GitHub')).toBeInTheDocument();
    expect(screen.getByText('Use Local')).toBeInTheDocument();
  });

  it('closes on Escape key when not resolving', () => {
    render(<SyncConflictModal />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(mockSetSyncConflictModalOpen).toHaveBeenCalledWith(false);
  });

  it('shows note count in modal', () => {
    mockUseNotesStore.mockReturnValue({
      isSyncConflictModalOpen: true,
      setSyncConflictModalOpen: mockSetSyncConflictModalOpen,
      resolveInitialSyncConflict: mockResolveInitialSyncConflict,
      notes: [
        { id: '1', title: 'Note 1' },
        { id: '2', title: 'Note 2' },
        { id: '3', title: 'Note 3' },
      ],
      gitHubRepo: 'user/repo',
    });

    render(<SyncConflictModal />);

    // Should show local notes count somewhere in the modal
    expect(screen.getByText(/3/)).toBeInTheDocument();
  });

  describe('strategy selection', () => {
    it('defaults to merge strategy', () => {
      render(<SyncConflictModal />);

      const mergeButton = screen.getByRole('radio', { name: /merge both/i });
      expect(mergeButton).toHaveAttribute('aria-checked', 'true');
    });

    it('can select github strategy', () => {
      render(<SyncConflictModal />);

      const githubButton = screen.getByRole('radio', { name: /use github/i });
      fireEvent.click(githubButton);

      expect(githubButton).toHaveAttribute('aria-checked', 'true');
    });

    it('can select local strategy', () => {
      render(<SyncConflictModal />);

      const localButton = screen.getByRole('radio', { name: /use local/i });
      fireEvent.click(localButton);

      expect(localButton).toHaveAttribute('aria-checked', 'true');
    });

    it('shows strategy details for merge', () => {
      render(<SyncConflictModal />);

      expect(screen.getByText(/local notes will be preserved/i)).toBeInTheDocument();
    });

    it('shows strategy details for github when selected', () => {
      render(<SyncConflictModal />);

      const githubButton = screen.getByRole('radio', { name: /use github/i });
      fireEvent.click(githubButton);

      expect(screen.getByText(/all local notes will be replaced/i)).toBeInTheDocument();
    });

    it('shows strategy details for local when selected', () => {
      render(<SyncConflictModal />);

      const localButton = screen.getByRole('radio', { name: /use local/i });
      fireEvent.click(localButton);

      expect(screen.getByText(/your local notes will overwrite/i)).toBeInTheDocument();
    });
  });

  describe('resolve action', () => {
    it('calls resolveInitialSyncConflict with selected strategy', async () => {
      mockResolveInitialSyncConflict.mockResolvedValue(undefined);

      render(<SyncConflictModal />);

      // Select github strategy
      const githubButton = screen.getByRole('radio', { name: /use github/i });
      fireEvent.click(githubButton);

      // Click continue button
      const continueButton = screen.getByRole('button', { name: /continue with/i });
      await act(async () => {
        fireEvent.click(continueButton);
      });

      await waitFor(() => {
        expect(mockResolveInitialSyncConflict).toHaveBeenCalledWith('github');
      });
    });

    it('shows success toast on resolve', async () => {
      mockResolveInitialSyncConflict.mockResolvedValue(undefined);
      const { showToast } = await import('../../../utils/toast');

      render(<SyncConflictModal />);

      const continueButton = screen.getByRole('button', { name: /continue with/i });
      await act(async () => {
        fireEvent.click(continueButton);
      });

      await waitFor(() => {
        expect(showToast.success).toHaveBeenCalledWith('Sync conflict resolved');
      });
    });

    it('shows error toast on resolve failure', async () => {
      mockResolveInitialSyncConflict.mockRejectedValue(new Error('Sync failed'));
      const { showToast } = await import('../../../utils/toast');

      render(<SyncConflictModal />);

      const continueButton = screen.getByRole('button', { name: /continue with/i });
      await act(async () => {
        fireEvent.click(continueButton);
      });

      await waitFor(() => {
        expect(showToast.error).toHaveBeenCalledWith('Sync failed');
      });
    });

    it('shows generic error on failure without message', async () => {
      mockResolveInitialSyncConflict.mockRejectedValue('unknown');
      const { showToast } = await import('../../../utils/toast');

      render(<SyncConflictModal />);

      const continueButton = screen.getByRole('button', { name: /continue with/i });
      await act(async () => {
        fireEvent.click(continueButton);
      });

      await waitFor(() => {
        expect(showToast.error).toHaveBeenCalledWith('Failed to resolve conflict');
      });
    });

    it('closes modal on successful resolve', async () => {
      mockResolveInitialSyncConflict.mockResolvedValue(undefined);

      render(<SyncConflictModal />);

      const continueButton = screen.getByRole('button', { name: /continue with/i });
      await act(async () => {
        fireEvent.click(continueButton);
      });

      await waitFor(() => {
        expect(mockSetSyncConflictModalOpen).toHaveBeenCalledWith(false);
      });
    });
  });

  describe('close behavior', () => {
    it('closes on close button click', () => {
      render(<SyncConflictModal />);

      const closeButton = screen.getByLabelText('Close');
      fireEvent.click(closeButton);

      expect(mockSetSyncConflictModalOpen).toHaveBeenCalledWith(false);
    });

    it('closes on cancel button click', () => {
      render(<SyncConflictModal />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockSetSyncConflictModalOpen).toHaveBeenCalledWith(false);
    });

    it('closes on backdrop click', () => {
      render(<SyncConflictModal />);

      const backdrop = screen.getByRole('dialog');
      fireEvent.click(backdrop);

      expect(mockSetSyncConflictModalOpen).toHaveBeenCalledWith(false);
    });
  });

  describe('accessibility', () => {
    it('has aria-modal attribute', () => {
      render(<SyncConflictModal />);

      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    });

    it('has radiogroup role for strategy selector', () => {
      render(<SyncConflictModal />);

      expect(screen.getByRole('radiogroup', { name: /sync strategy/i })).toBeInTheDocument();
    });

    it('shows repo name in modal', () => {
      render(<SyncConflictModal />);

      expect(screen.getByText('user/repo')).toBeInTheDocument();
    });
  });
});
