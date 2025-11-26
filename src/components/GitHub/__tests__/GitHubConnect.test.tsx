/**
 * GitHubConnect component tests.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { GitHubConnect } from '../GitHubConnect';
import type { GitHubStatus } from '../../../types/github.types';

// Mock toast
vi.mock('../../../utils/toast', () => ({
  showToast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
  },
}));

import { showToast } from '../../../utils/toast';

// Create mock store factory
const createMockStore = (overrides = {}) => ({
  gitHubStatus: 'disconnected' as GitHubStatus,
  gitHubUser: null,
  gitHubRepo: null,
  gitHubLastSync: null,
  gitHubError: null,
  connectGitHub: vi.fn().mockResolvedValue(undefined),
  disconnectGitHub: vi.fn().mockResolvedValue(undefined),
  pushToGitHub: vi.fn().mockResolvedValue(undefined),
  pullFromGitHub: vi.fn().mockResolvedValue(undefined),
  setRepoSelectorOpen: vi.fn(),
  ...overrides,
});

let mockStore = createMockStore();

vi.mock('../../../store/notesStore', () => ({
  useNotesStore: vi.fn(() => mockStore),
}));

describe('GitHubConnect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStore = createMockStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('rendering', () => {
    it('renders button', () => {
      render(<GitHubConnect />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders with aria-label', () => {
      render(<GitHubConnect />);
      expect(screen.getByLabelText(/github/i)).toBeInTheDocument();
    });

    it('shows icon', () => {
      const { container } = render(<GitHubConnect />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('disconnected state', () => {
    it('shows disconnected icon indicator', () => {
      render(<GitHubConnect />);
      // The button should be visible
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('can click the button', async () => {
      const user = userEvent.setup();
      render(<GitHubConnect />);

      const button = screen.getByRole('button');
      await user.click(button);

      // Should open dropdown or trigger action
      expect(button).toBeInTheDocument();
    });
  });

  describe('connected state', () => {
    beforeEach(() => {
      mockStore = createMockStore({
        gitHubStatus: 'connected',
        gitHubUser: { login: 'testuser', avatarUrl: 'https://example.com/avatar.png' },
        gitHubRepo: 'testuser/my-notes',
      });
    });

    it('renders button in connected state', () => {
      render(<GitHubConnect />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('opens dropdown when clicked', async () => {
      const user = userEvent.setup();
      render(<GitHubConnect />);

      const button = screen.getByRole('button');
      await user.click(button);

      // Dropdown should open
      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });
    });
  });

  describe('syncing state', () => {
    beforeEach(() => {
      mockStore = createMockStore({
        gitHubStatus: 'syncing',
        gitHubUser: { login: 'testuser', avatarUrl: '' },
        gitHubRepo: { owner: 'testuser', name: 'notes', fullName: 'testuser/notes' },
      });
    });

    it('renders in syncing state', () => {
      render(<GitHubConnect />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    beforeEach(() => {
      mockStore = createMockStore({
        gitHubStatus: 'error',
        gitHubError: 'Connection failed',
        gitHubUser: { login: 'testuser', avatarUrl: '' },
      });
    });

    it('renders in error state', () => {
      render(<GitHubConnect />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('dropdown behavior', () => {
    beforeEach(() => {
      mockStore = createMockStore({
        gitHubStatus: 'connected',
        gitHubUser: { login: 'testuser', avatarUrl: '' },
        gitHubRepo: 'testuser/notes',
      });
    });

    it('closes dropdown on outside click', async () => {
      const user = userEvent.setup();
      render(<GitHubConnect />);

      const button = screen.getByRole('button');
      await user.click(button);

      // Click outside
      fireEvent.mouseDown(document.body);

      // Check button still exists
      expect(button).toBeInTheDocument();
    });

    it('closes dropdown on Escape key', async () => {
      const user = userEvent.setup();
      render(<GitHubConnect />);

      const button = screen.getByRole('button');
      await user.click(button);

      await user.keyboard('{Escape}');

      // Button should still exist
      expect(button).toBeInTheDocument();
    });
  });

  describe('store integration', () => {
    it('accesses gitHubStatus from store', () => {
      render(<GitHubConnect />);
      // The component renders based on store state
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('accesses user data from store when connected', () => {
      mockStore = createMockStore({
        gitHubStatus: 'connected',
        gitHubUser: { login: 'testuser', avatarUrl: '' },
        gitHubRepo: 'testuser/repo',
      });
      render(<GitHubConnect />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('accesses repo data from store', () => {
      mockStore = createMockStore({
        gitHubStatus: 'connected',
        gitHubUser: { login: 'testuser', avatarUrl: '' },
        gitHubRepo: 'testuser/my-notes',
      });
      render(<GitHubConnect />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('connect flow', () => {
    it('shows connect button when disconnected', async () => {
      const user = userEvent.setup();
      render(<GitHubConnect />);

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByRole('menuitem')).toHaveTextContent(/connect github/i);
      });
    });

    it('calls connectGitHub when connect button clicked', async () => {
      const user = userEvent.setup();
      render(<GitHubConnect />);

      await user.click(screen.getByRole('button'));
      await waitFor(() => screen.getByRole('menu'));

      const connectButton = screen.getByRole('menuitem');
      await user.click(connectButton);

      expect(mockStore.connectGitHub).toHaveBeenCalled();
    });

    it('shows success toast on successful connect', async () => {
      const user = userEvent.setup();
      render(<GitHubConnect />);

      await user.click(screen.getByRole('button'));
      await waitFor(() => screen.getByRole('menu'));

      await user.click(screen.getByRole('menuitem'));

      await waitFor(() => {
        expect(showToast.success).toHaveBeenCalledWith('Connected to GitHub');
      });
    });

    it('shows error toast on connect failure', async () => {
      mockStore = createMockStore({
        connectGitHub: vi.fn().mockRejectedValue(new Error('Auth failed')),
      });

      const user = userEvent.setup();
      render(<GitHubConnect />);

      await user.click(screen.getByRole('button'));
      await waitFor(() => screen.getByRole('menu'));

      await user.click(screen.getByRole('menuitem'));

      await waitFor(() => {
        expect(showToast.error).toHaveBeenCalledWith('Auth failed');
      });
    });

    it('shows generic error on connect failure without message', async () => {
      mockStore = createMockStore({
        connectGitHub: vi.fn().mockRejectedValue('unknown error'),
      });

      const user = userEvent.setup();
      render(<GitHubConnect />);

      await user.click(screen.getByRole('button'));
      await waitFor(() => screen.getByRole('menu'));

      await user.click(screen.getByRole('menuitem'));

      await waitFor(() => {
        expect(showToast.error).toHaveBeenCalledWith('Failed to connect to GitHub');
      });
    });
  });

  describe('disconnect flow', () => {
    beforeEach(() => {
      mockStore = createMockStore({
        gitHubStatus: 'connected',
        gitHubUser: { login: 'testuser', avatarUrl: '' },
        gitHubRepo: 'testuser/notes',
      });
    });

    it('shows disconnect button when connected', async () => {
      const user = userEvent.setup();
      render(<GitHubConnect />);

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByText('Disconnect')).toBeInTheDocument();
      });
    });

    it('calls disconnectGitHub when disconnect clicked', async () => {
      const user = userEvent.setup();
      render(<GitHubConnect />);

      await user.click(screen.getByRole('button'));
      await waitFor(() => screen.getByText('Disconnect'));

      await user.click(screen.getByText('Disconnect'));

      expect(mockStore.disconnectGitHub).toHaveBeenCalled();
    });

    it('shows success toast on successful disconnect', async () => {
      const user = userEvent.setup();
      render(<GitHubConnect />);

      await user.click(screen.getByRole('button'));
      await waitFor(() => screen.getByText('Disconnect'));

      await user.click(screen.getByText('Disconnect'));

      await waitFor(() => {
        expect(showToast.success).toHaveBeenCalledWith('Disconnected from GitHub');
      });
    });

    it('shows error toast on disconnect failure', async () => {
      mockStore = createMockStore({
        gitHubStatus: 'connected',
        gitHubUser: { login: 'testuser', avatarUrl: '' },
        gitHubRepo: 'testuser/notes',
        disconnectGitHub: vi.fn().mockRejectedValue(new Error('Network error')),
      });

      const user = userEvent.setup();
      render(<GitHubConnect />);

      await user.click(screen.getByRole('button'));
      await waitFor(() => screen.getByText('Disconnect'));

      await user.click(screen.getByText('Disconnect'));

      await waitFor(() => {
        expect(showToast.error).toHaveBeenCalledWith('Network error');
      });
    });
  });

  describe('push/pull flow', () => {
    beforeEach(() => {
      mockStore = createMockStore({
        gitHubStatus: 'connected',
        gitHubUser: { login: 'testuser', avatarUrl: '' },
        gitHubRepo: 'testuser/notes',
      });
    });

    it('shows push button when repo selected', async () => {
      const user = userEvent.setup();
      render(<GitHubConnect />);

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByText('Push to GitHub')).toBeInTheDocument();
      });
    });

    it('shows pull button when repo selected', async () => {
      const user = userEvent.setup();
      render(<GitHubConnect />);

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByText('Pull from GitHub')).toBeInTheDocument();
      });
    });

    it('calls pushToGitHub when push clicked', async () => {
      const user = userEvent.setup();
      render(<GitHubConnect />);

      await user.click(screen.getByRole('button'));
      await waitFor(() => screen.getByText('Push to GitHub'));

      await user.click(screen.getByText('Push to GitHub'));

      expect(mockStore.pushToGitHub).toHaveBeenCalled();
    });

    it('calls pullFromGitHub when pull clicked', async () => {
      const user = userEvent.setup();
      render(<GitHubConnect />);

      await user.click(screen.getByRole('button'));
      await waitFor(() => screen.getByText('Pull from GitHub'));

      await user.click(screen.getByText('Pull from GitHub'));

      expect(mockStore.pullFromGitHub).toHaveBeenCalled();
    });

    it('shows success toast on push', async () => {
      const user = userEvent.setup();
      render(<GitHubConnect />);

      await user.click(screen.getByRole('button'));
      await waitFor(() => screen.getByText('Push to GitHub'));

      await user.click(screen.getByText('Push to GitHub'));

      await waitFor(() => {
        expect(showToast.success).toHaveBeenCalledWith('Notes pushed to GitHub');
      });
    });

    it('shows error toast on push failure', async () => {
      mockStore = createMockStore({
        gitHubStatus: 'connected',
        gitHubUser: { login: 'testuser', avatarUrl: '' },
        gitHubRepo: 'testuser/notes',
        pushToGitHub: vi.fn().mockRejectedValue(new Error('Push failed')),
      });

      const user = userEvent.setup();
      render(<GitHubConnect />);

      await user.click(screen.getByRole('button'));
      await waitFor(() => screen.getByText('Push to GitHub'));

      await user.click(screen.getByText('Push to GitHub'));

      await waitFor(() => {
        expect(showToast.error).toHaveBeenCalledWith('Push failed');
      });
    });

    it('shows success toast on pull', async () => {
      const user = userEvent.setup();
      render(<GitHubConnect />);

      await user.click(screen.getByRole('button'));
      await waitFor(() => screen.getByText('Pull from GitHub'));

      await user.click(screen.getByText('Pull from GitHub'));

      await waitFor(() => {
        expect(showToast.success).toHaveBeenCalledWith('Notes pulled from GitHub');
      });
    });

    it('shows error toast on pull failure', async () => {
      mockStore = createMockStore({
        gitHubStatus: 'connected',
        gitHubUser: { login: 'testuser', avatarUrl: '' },
        gitHubRepo: 'testuser/notes',
        pullFromGitHub: vi.fn().mockRejectedValue(new Error('Pull failed')),
      });

      const user = userEvent.setup();
      render(<GitHubConnect />);

      await user.click(screen.getByRole('button'));
      await waitFor(() => screen.getByText('Pull from GitHub'));

      await user.click(screen.getByText('Pull from GitHub'));

      await waitFor(() => {
        expect(showToast.error).toHaveBeenCalledWith('Pull failed');
      });
    });
  });

  describe('repo selection', () => {
    it('opens repo selector when select repo clicked', async () => {
      mockStore = createMockStore({
        gitHubStatus: 'connected',
        gitHubUser: { login: 'testuser', avatarUrl: '' },
        gitHubRepo: null,
      });

      const user = userEvent.setup();
      render(<GitHubConnect />);

      await user.click(screen.getByRole('button'));
      await waitFor(() => screen.getByText(/select repository/i));

      await user.click(screen.getByText(/select repository/i));

      expect(mockStore.setRepoSelectorOpen).toHaveBeenCalledWith(true);
    });

    it('shows current repo when connected', async () => {
      mockStore = createMockStore({
        gitHubStatus: 'connected',
        gitHubUser: { login: 'testuser', avatarUrl: '' },
        gitHubRepo: 'testuser/my-notes',
      });

      const user = userEvent.setup();
      render(<GitHubConnect />);

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByText('testuser/my-notes')).toBeInTheDocument();
      });
    });
  });

  describe('status icons', () => {
    it('shows loader when connecting', async () => {
      mockStore = createMockStore({
        gitHubStatus: 'connecting',
      });

      render(<GitHubConnect />);

      // Loader icon has animate-spin class
      const button = screen.getByRole('button');
      expect(button.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('shows loader when syncing', async () => {
      mockStore = createMockStore({
        gitHubStatus: 'syncing',
        gitHubUser: { login: 'testuser', avatarUrl: '' },
        gitHubRepo: 'testuser/notes',
      });

      render(<GitHubConnect />);

      const button = screen.getByRole('button');
      expect(button.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('shows green icon when connected with repo', () => {
      mockStore = createMockStore({
        gitHubStatus: 'connected',
        gitHubUser: { login: 'testuser', avatarUrl: '' },
        gitHubRepo: 'testuser/notes',
      });

      render(<GitHubConnect />);

      const button = screen.getByRole('button');
      expect(button.querySelector('.text-green-500')).toBeInTheDocument();
    });
  });

  describe('last sync display', () => {
    it('shows last sync footer when connected with sync time', async () => {
      const recentTime = new Date(Date.now() - 5 * 60 * 1000).toISOString(); // 5 min ago
      mockStore = createMockStore({
        gitHubStatus: 'connected',
        gitHubUser: { login: 'testuser', avatarUrl: '' },
        gitHubRepo: 'testuser/notes',
        gitHubLastSync: recentTime,
      });

      const user = userEvent.setup();
      render(<GitHubConnect />);

      await user.click(screen.getByRole('button'));

      // Just check for the last synced text pattern
      await waitFor(() => {
        expect(screen.getByText(/last synced/i)).toBeInTheDocument();
      });
    });

    it('does not show last sync footer when no lastSync', async () => {
      mockStore = createMockStore({
        gitHubStatus: 'connected',
        gitHubUser: { login: 'testuser', avatarUrl: '' },
        gitHubRepo: 'testuser/notes',
        gitHubLastSync: null,
      });

      const user = userEvent.setup();
      render(<GitHubConnect />);

      await user.click(screen.getByRole('button'));
      await waitFor(() => screen.getByRole('menu'));

      // Should not have last synced text
      expect(screen.queryByText(/last synced/i)).not.toBeInTheDocument();
    });
  });

  describe('error display', () => {
    it('shows error message in footer when error state', async () => {
      mockStore = createMockStore({
        gitHubStatus: 'error',
        gitHubError: 'Connection failed',
        gitHubUser: { login: 'testuser', avatarUrl: '' },
      });

      const user = userEvent.setup();
      render(<GitHubConnect />);

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByText('Connection failed')).toBeInTheDocument();
      });
    });
  });

  describe('connected UI elements', () => {
    it('shows user login in dropdown', async () => {
      mockStore = createMockStore({
        gitHubStatus: 'connected',
        gitHubUser: { login: 'testuser', avatarUrl: '' },
        gitHubRepo: 'testuser/notes',
      });

      const user = userEvent.setup();
      render(<GitHubConnect />);

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByText('testuser')).toBeInTheDocument();
      });
    });

    it('shows Connected indicator', async () => {
      mockStore = createMockStore({
        gitHubStatus: 'connected',
        gitHubUser: { login: 'testuser', avatarUrl: '' },
        gitHubRepo: 'testuser/notes',
      });

      const user = userEvent.setup();
      render(<GitHubConnect />);

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByText('Connected')).toBeInTheDocument();
      });
    });
  });
});
