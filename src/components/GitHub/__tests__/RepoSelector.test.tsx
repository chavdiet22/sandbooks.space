/**
 * RepoSelector tests.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RepoSelector } from '../RepoSelector';

// Mock the store
vi.mock('../../../store/notesStore', () => ({
  useNotesStore: vi.fn(),
}));

// Mock the github service
vi.mock('../../../services/github', () => ({
  gitHubService: {
    listRepos: vi.fn(),
  },
}));

// Mock toast
vi.mock('../../../utils/toast', () => ({
  showToast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { useNotesStore } from '../../../store/notesStore';
import { gitHubService } from '../../../services/github';

describe('RepoSelector', () => {
  const mockSetRepoSelectorOpen = vi.fn();
  const mockSelectGitHubRepo = vi.fn();
  const mockUseNotesStore = useNotesStore as ReturnType<typeof vi.fn>;

  const mockRepos = [
    { id: 1, name: 'notes', fullName: 'user/notes', defaultBranch: 'main', private: false },
    { id: 2, name: 'private-notes', fullName: 'user/private-notes', defaultBranch: 'main', private: true },
    { id: 3, name: 'sandbooks-backup', fullName: 'user/sandbooks-backup', defaultBranch: 'main', private: false },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(gitHubService.listRepos).mockResolvedValue(mockRepos);

    mockUseNotesStore.mockReturnValue({
      isRepoSelectorOpen: true,
      setRepoSelectorOpen: mockSetRepoSelectorOpen,
      selectGitHubRepo: mockSelectGitHubRepo,
      gitHubRepo: null,
      gitHubUser: { id: 1, login: 'testuser', name: 'Test User' },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns null when not open', () => {
    mockUseNotesStore.mockReturnValue({
      isRepoSelectorOpen: false,
      setRepoSelectorOpen: mockSetRepoSelectorOpen,
      selectGitHubRepo: mockSelectGitHubRepo,
      gitHubRepo: null,
      gitHubUser: null,
    });

    const { container } = render(<RepoSelector />);

    expect(container.firstChild).toBeNull();
  });

  it('renders modal when open', async () => {
    render(<RepoSelector />);

    // Wait for async effects to complete
    await waitFor(() => {
      expect(screen.getByText('Select Repository')).toBeInTheDocument();
    });
  });

  it('loads repos when opened', async () => {
    render(<RepoSelector />);

    await waitFor(() => {
      expect(gitHubService.listRepos).toHaveBeenCalled();
    });
  });

  it('displays loaded repos', async () => {
    render(<RepoSelector />);

    await waitFor(() => {
      expect(screen.getByText('notes')).toBeInTheDocument();
      expect(screen.getByText('private-notes')).toBeInTheDocument();
      expect(screen.getByText('sandbooks-backup')).toBeInTheDocument();
    });
  });

  it('shows error state when loading fails', async () => {
    vi.mocked(gitHubService.listRepos).mockRejectedValue(new Error('Network error'));

    render(<RepoSelector />);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('filters repos by search query', async () => {
    render(<RepoSelector />);

    await waitFor(() => {
      expect(screen.getByText('notes')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'sandbooks' } });

    expect(screen.getByText('sandbooks-backup')).toBeInTheDocument();
    expect(screen.queryByText('private-notes')).not.toBeInTheDocument();
  });

  it('closes on Escape key', async () => {
    render(<RepoSelector />);

    // Wait for async effects before interacting
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(mockSetRepoSelectorOpen).toHaveBeenCalledWith(false);
  });

  describe('accessibility', () => {
    it('has search input with placeholder', async () => {
      render(<RepoSelector />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
      });
    });

    it('has aria-modal and role dialog', async () => {
      render(<RepoSelector />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
      });
    });
  });

  describe('close behavior', () => {
    it('closes on backdrop click', async () => {
      render(<RepoSelector />);

      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

      const backdrop = screen.getByRole('dialog');
      fireEvent.click(backdrop);

      expect(mockSetRepoSelectorOpen).toHaveBeenCalledWith(false);
    });

    it('closes on close button click', async () => {
      render(<RepoSelector />);

      await waitFor(() => expect(screen.getByLabelText('Close')).toBeInTheDocument());

      const closeButton = screen.getByLabelText('Close');
      fireEvent.click(closeButton);

      expect(mockSetRepoSelectorOpen).toHaveBeenCalledWith(false);
    });

    it('closes on cancel button click', async () => {
      render(<RepoSelector />);

      await waitFor(() => expect(screen.getByText('Cancel')).toBeInTheDocument());

      fireEvent.click(screen.getByText('Cancel'));

      expect(mockSetRepoSelectorOpen).toHaveBeenCalledWith(false);
    });
  });

  describe('repo selection', () => {
    it('calls selectGitHubRepo when repo clicked', async () => {
      mockSelectGitHubRepo.mockResolvedValue(undefined);

      render(<RepoSelector />);

      await waitFor(() => expect(screen.getByText('notes')).toBeInTheDocument());

      await act(async () => {
        fireEvent.click(screen.getByText('notes'));
      });

      await waitFor(() => {
        expect(mockSelectGitHubRepo).toHaveBeenCalledWith('user/notes');
      });
    });

    it('shows toast on successful selection', async () => {
      mockSelectGitHubRepo.mockResolvedValue(undefined);
      const { showToast } = await import('../../../utils/toast');

      render(<RepoSelector />);

      await waitFor(() => expect(screen.getByText('notes')).toBeInTheDocument());

      await act(async () => {
        fireEvent.click(screen.getByText('notes'));
      });

      await waitFor(() => {
        expect(showToast.success).toHaveBeenCalledWith('Selected user/notes');
      });
    });

    it('shows error toast on selection failure', async () => {
      mockSelectGitHubRepo.mockRejectedValue(new Error('Selection failed'));
      const { showToast } = await import('../../../utils/toast');

      render(<RepoSelector />);

      await waitFor(() => expect(screen.getByText('notes')).toBeInTheDocument());

      await act(async () => {
        fireEvent.click(screen.getByText('notes'));
      });

      await waitFor(() => {
        expect(showToast.error).toHaveBeenCalledWith('Selection failed');
      });
    });

    it('shows check mark for currently selected repo', async () => {
      mockUseNotesStore.mockReturnValue({
        isRepoSelectorOpen: true,
        setRepoSelectorOpen: mockSetRepoSelectorOpen,
        selectGitHubRepo: mockSelectGitHubRepo,
        gitHubRepo: 'user/notes',
        gitHubUser: { id: 1, login: 'testuser', name: 'Test User' },
      });

      render(<RepoSelector />);

      await waitFor(() => expect(screen.getByText('notes')).toBeInTheDocument());

      // The selected repo should have a highlighted background
      const noteRow = screen.getByText('notes').closest('button');
      expect(noteRow).toHaveClass('bg-stone-100');
    });
  });

  describe('create new repo', () => {
    it('shows create new repo option initially', async () => {
      render(<RepoSelector />);

      await waitFor(() => {
        expect(screen.getByText('Create new repository')).toBeInTheDocument();
      });
    });

    it('shows create form when clicked', async () => {
      render(<RepoSelector />);

      await waitFor(() => expect(screen.getByText('Create new repository')).toBeInTheDocument());

      fireEvent.click(screen.getByText('Create new repository'));

      expect(screen.getByPlaceholderText('sandbooks-notes')).toBeInTheDocument();
      expect(screen.getByText('Create')).toBeInTheDocument();
    });

    it('cancels create form', async () => {
      render(<RepoSelector />);

      await waitFor(() => expect(screen.getByText('Create new repository')).toBeInTheDocument());

      fireEvent.click(screen.getByText('Create new repository'));

      await waitFor(() => expect(screen.getByText('Create')).toBeInTheDocument());

      // Find and click the Cancel button in the create form
      const cancelButtons = screen.getAllByText('Cancel');
      // The first Cancel is in the form, the second is in footer
      fireEvent.click(cancelButtons[0]);

      // Should go back to showing Create new repository button
      await waitFor(() => {
        expect(screen.getByText('Create new repository')).toBeInTheDocument();
      });
    });

    it('creates new repo when form submitted', async () => {
      mockSelectGitHubRepo.mockResolvedValue(undefined);

      render(<RepoSelector />);

      await waitFor(() => expect(screen.getByText('Create new repository')).toBeInTheDocument());

      fireEvent.click(screen.getByText('Create new repository'));

      await waitFor(() => expect(screen.getByText('Create')).toBeInTheDocument());

      // Type a repo name
      const input = screen.getByPlaceholderText('sandbooks-notes');
      fireEvent.change(input, { target: { value: 'my-notes' } });

      await act(async () => {
        fireEvent.click(screen.getByText('Create'));
      });

      await waitFor(() => {
        expect(mockSelectGitHubRepo).toHaveBeenCalledWith('testuser/my-notes', true);
      });
    });

    it('sanitizes repo name input', async () => {
      render(<RepoSelector />);

      await waitFor(() => expect(screen.getByText('Create new repository')).toBeInTheDocument());

      fireEvent.click(screen.getByText('Create new repository'));

      const input = screen.getByPlaceholderText('sandbooks-notes');
      fireEvent.change(input, { target: { value: 'my notes@special!' } });

      // Should strip invalid characters
      expect(input).toHaveValue('mynotesspecial');
    });
  });

  describe('error recovery', () => {
    it('shows try again button on error', async () => {
      vi.mocked(gitHubService.listRepos).mockRejectedValue(new Error('Network error'));

      render(<RepoSelector />);

      await waitFor(() => {
        expect(screen.getByText('Try again')).toBeInTheDocument();
      });
    });

    it('reloads repos when try again clicked', async () => {
      vi.mocked(gitHubService.listRepos)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockRepos);

      render(<RepoSelector />);

      await waitFor(() => expect(screen.getByText('Try again')).toBeInTheDocument());

      await act(async () => {
        fireEvent.click(screen.getByText('Try again'));
      });

      await waitFor(() => {
        expect(screen.getByText('notes')).toBeInTheDocument();
      });
    });
  });

  describe('search functionality', () => {
    it('shows no results message when search has no matches', async () => {
      render(<RepoSelector />);

      await waitFor(() => expect(screen.getByText('notes')).toBeInTheDocument());

      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      expect(screen.getByText(/no repositories matching "nonexistent"/i)).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('shows loading spinner while fetching repos', async () => {
      // Make listRepos return a never-resolving promise
      vi.mocked(gitHubService.listRepos).mockImplementation(() => new Promise(() => {}));

      render(<RepoSelector />);

      expect(screen.getByText('Loading repositories...')).toBeInTheDocument();
    });
  });

  describe('private repos', () => {
    it('shows lock icon for private repos', async () => {
      render(<RepoSelector />);

      await waitFor(() => expect(screen.getByText('private-notes')).toBeInTheDocument());

      // The private repo should have a lock icon
      const privateRepoRow = screen.getByText('private-notes').closest('button');
      expect(privateRepoRow?.querySelector('svg')).toBeInTheDocument();
    });
  });
});
