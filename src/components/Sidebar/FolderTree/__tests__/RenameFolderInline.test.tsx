/**
 * RenameFolderInline component tests.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { RenameFolderInline } from '../RenameFolderInline';

describe('RenameFolderInline', () => {
  const defaultProps = {
    depth: 0,
    currentName: 'Original Name',
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
    it('renders input field with current name', () => {
      render(<RenameFolderInline {...defaultProps} />);
      expect(screen.getByLabelText('Folder name')).toHaveValue('Original Name');
    });

    it('renders save button', () => {
      render(<RenameFolderInline {...defaultProps} />);
      expect(screen.getByLabelText('Save')).toBeInTheDocument();
    });

    it('renders cancel button', () => {
      render(<RenameFolderInline {...defaultProps} />);
      expect(screen.getByLabelText('Cancel')).toBeInTheDocument();
    });

    it('renders folder icon', () => {
      const { container } = render(<RenameFolderInline {...defaultProps} />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('applies correct depth indentation', () => {
      const { container } = render(<RenameFolderInline {...defaultProps} depth={3} />);
      const wrapper = container.firstChild as HTMLElement;
      // 12 base + 3 * 20 = 72px
      expect(wrapper).toHaveStyle({ paddingLeft: '72px' });
    });
  });

  describe('auto-focus', () => {
    it('focuses input on mount', () => {
      render(<RenameFolderInline {...defaultProps} />);
      expect(screen.getByLabelText('Folder name')).toHaveFocus();
    });
  });

  describe('input handling', () => {
    it('updates value on change', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      render(<RenameFolderInline {...defaultProps} />);

      const input = screen.getByLabelText('Folder name');
      await user.clear(input);
      await user.type(input, 'New Name');

      expect(input).toHaveValue('New Name');
    });
  });

  describe('confirmation', () => {
    it('calls onConfirm with trimmed name when changed', () => {
      render(<RenameFolderInline {...defaultProps} />);

      const input = screen.getByLabelText('Folder name');
      fireEvent.change(input, { target: { value: '  New Name  ' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(defaultProps.onConfirm).toHaveBeenCalledWith('New Name');
    });

    it('calls onConfirm when save button clicked', () => {
      render(<RenameFolderInline {...defaultProps} />);

      const input = screen.getByLabelText('Folder name');
      fireEvent.change(input, { target: { value: 'Different Name' } });

      fireEvent.click(screen.getByLabelText('Save'));

      expect(defaultProps.onConfirm).toHaveBeenCalledWith('Different Name');
    });

    it('calls onCancel when name unchanged', () => {
      render(<RenameFolderInline {...defaultProps} />);

      const input = screen.getByLabelText('Folder name');
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(defaultProps.onCancel).toHaveBeenCalled();
    });

    it('calls onCancel when name is empty', () => {
      render(<RenameFolderInline {...defaultProps} />);

      const input = screen.getByLabelText('Folder name');
      fireEvent.change(input, { target: { value: '' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(defaultProps.onCancel).toHaveBeenCalled();
    });

    it('calls onCancel when name is only whitespace', () => {
      render(<RenameFolderInline {...defaultProps} />);

      const input = screen.getByLabelText('Folder name');
      fireEvent.change(input, { target: { value: '   ' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(defaultProps.onCancel).toHaveBeenCalled();
    });

    it('calls onCancel when trimmed name equals original', () => {
      render(<RenameFolderInline {...defaultProps} />);

      const input = screen.getByLabelText('Folder name');
      fireEvent.change(input, { target: { value: '  Original Name  ' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(defaultProps.onCancel).toHaveBeenCalled();
      expect(defaultProps.onConfirm).not.toHaveBeenCalled();
    });
  });

  describe('cancellation', () => {
    it('calls onCancel on Escape key', () => {
      render(<RenameFolderInline {...defaultProps} />);

      const input = screen.getByLabelText('Folder name');
      fireEvent.keyDown(input, { key: 'Escape' });

      expect(defaultProps.onCancel).toHaveBeenCalled();
    });

    it('calls onCancel when cancel button clicked', () => {
      render(<RenameFolderInline {...defaultProps} />);

      fireEvent.click(screen.getByLabelText('Cancel'));

      expect(defaultProps.onCancel).toHaveBeenCalled();
    });
  });

  describe('blur handling', () => {
    it('handles blur event', () => {
      render(<RenameFolderInline {...defaultProps} />);

      const input = screen.getByLabelText('Folder name');
      fireEvent.change(input, { target: { value: 'Changed' } });
      fireEvent.blur(input);

      vi.advanceTimersByTime(100);

      expect(input).toBeInTheDocument();
    });

    it('does not submit on blur if input is refocused', () => {
      render(<RenameFolderInline {...defaultProps} />);

      const input = screen.getByLabelText('Folder name');
      fireEvent.change(input, { target: { value: 'Changed' } });
      fireEvent.blur(input);

      input.focus();
      vi.advanceTimersByTime(100);

      expect(defaultProps.onConfirm).not.toHaveBeenCalled();
    });
  });

  describe('button titles', () => {
    it('save button has correct title', () => {
      render(<RenameFolderInline {...defaultProps} />);
      expect(screen.getByTitle('Save')).toBeInTheDocument();
    });

    it('cancel button has correct title', () => {
      render(<RenameFolderInline {...defaultProps} />);
      expect(screen.getByTitle('Cancel')).toBeInTheDocument();
    });
  });
});
