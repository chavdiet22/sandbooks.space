/**
 * CreateFolderInline component tests.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { CreateFolderInline } from '../CreateFolderInline';

describe('CreateFolderInline', () => {
  const defaultProps = {
    depth: 0,
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('rendering', () => {
    it('renders input field', () => {
      render(<CreateFolderInline {...defaultProps} />);
      expect(screen.getByLabelText('Folder name')).toBeInTheDocument();
    });

    it('renders create button', () => {
      render(<CreateFolderInline {...defaultProps} />);
      expect(screen.getByLabelText('Create folder')).toBeInTheDocument();
    });

    it('renders cancel button', () => {
      render(<CreateFolderInline {...defaultProps} />);
      expect(screen.getByLabelText('Cancel')).toBeInTheDocument();
    });

    it('renders folder icon', () => {
      const { container } = render(<CreateFolderInline {...defaultProps} />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('uses custom placeholder when provided', () => {
      render(<CreateFolderInline {...defaultProps} placeholder="Custom placeholder" />);
      expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
    });

    it('uses default placeholder when not provided', () => {
      render(<CreateFolderInline {...defaultProps} />);
      expect(screen.getByPlaceholderText('New folder')).toBeInTheDocument();
    });

    it('applies correct depth indentation', () => {
      const { container } = render(<CreateFolderInline {...defaultProps} depth={2} />);
      const wrapper = container.firstChild as HTMLElement;
      // 12 base + 2 * 20 = 52px
      expect(wrapper).toHaveStyle({ paddingLeft: '52px' });
    });
  });

  describe('auto-focus', () => {
    it('focuses input on mount', () => {
      render(<CreateFolderInline {...defaultProps} />);
      expect(screen.getByLabelText('Folder name')).toHaveFocus();
    });
  });

  describe('input handling', () => {
    it('updates value on change', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      render(<CreateFolderInline {...defaultProps} />);

      const input = screen.getByLabelText('Folder name');
      await user.type(input, 'My Folder');

      expect(input).toHaveValue('My Folder');
    });
  });

  describe('confirmation', () => {
    it('calls onConfirm with trimmed name on Enter', () => {
      render(<CreateFolderInline {...defaultProps} />);

      const input = screen.getByLabelText('Folder name');
      fireEvent.change(input, { target: { value: '  My Folder  ' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(defaultProps.onConfirm).toHaveBeenCalledWith('My Folder');
    });

    it('calls onConfirm when create button clicked', () => {
      render(<CreateFolderInline {...defaultProps} />);

      const input = screen.getByLabelText('Folder name');
      fireEvent.change(input, { target: { value: 'Test Folder' } });

      fireEvent.click(screen.getByLabelText('Create folder'));

      expect(defaultProps.onConfirm).toHaveBeenCalledWith('Test Folder');
    });

    it('calls onCancel when name is empty', () => {
      render(<CreateFolderInline {...defaultProps} />);

      const input = screen.getByLabelText('Folder name');
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(defaultProps.onCancel).toHaveBeenCalled();
    });

    it('calls onCancel when name is only whitespace', () => {
      render(<CreateFolderInline {...defaultProps} />);

      const input = screen.getByLabelText('Folder name');
      fireEvent.change(input, { target: { value: '   ' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(defaultProps.onCancel).toHaveBeenCalled();
    });

    it('prevents multiple submissions', () => {
      render(<CreateFolderInline {...defaultProps} />);

      const input = screen.getByLabelText('Folder name');
      fireEvent.change(input, { target: { value: 'Folder' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
    });
  });

  describe('cancellation', () => {
    it('calls onCancel on Escape key', () => {
      render(<CreateFolderInline {...defaultProps} />);

      const input = screen.getByLabelText('Folder name');
      fireEvent.keyDown(input, { key: 'Escape' });

      expect(defaultProps.onCancel).toHaveBeenCalled();
    });

    it('calls onCancel when cancel button clicked', () => {
      render(<CreateFolderInline {...defaultProps} />);

      fireEvent.click(screen.getByLabelText('Cancel'));

      expect(defaultProps.onCancel).toHaveBeenCalled();
    });
  });

  describe('blur handling', () => {
    it('handles blur event', async () => {
      render(<CreateFolderInline {...defaultProps} />);

      const input = screen.getByLabelText('Folder name');
      fireEvent.change(input, { target: { value: 'Test' } });
      fireEvent.blur(input);

      // The blur handler sets a timeout - this tests that it doesn't error
      vi.advanceTimersByTime(100);

      // Component should still be present
      expect(input).toBeInTheDocument();
    });

    it('does not submit on blur if input is refocused', async () => {
      render(<CreateFolderInline {...defaultProps} />);

      const input = screen.getByLabelText('Folder name');
      fireEvent.change(input, { target: { value: 'Test' } });
      fireEvent.blur(input);

      // Refocus before timeout
      input.focus();
      vi.advanceTimersByTime(100);

      // Should not call because input is still focused
      expect(defaultProps.onConfirm).not.toHaveBeenCalled();
    });
  });

  describe('button titles', () => {
    it('create button has correct title', () => {
      render(<CreateFolderInline {...defaultProps} />);
      expect(screen.getByTitle('Create folder')).toBeInTheDocument();
    });

    it('cancel button has correct title', () => {
      render(<CreateFolderInline {...defaultProps} />);
      expect(screen.getByTitle('Cancel')).toBeInTheDocument();
    });
  });
});
