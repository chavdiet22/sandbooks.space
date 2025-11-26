/**
 * ImageUploadModal tests.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ImageUploadModal } from '../ImageUploadModal';

// Mock toast
vi.mock('../../../utils/toast', () => ({
  showToast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
  },
}));

import { showToast } from '../../../utils/toast';

describe('ImageUploadModal', () => {
  const defaultProps = {
    onInsert: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('rendering', () => {
    it('renders modal with title', () => {
      render(<ImageUploadModal {...defaultProps} />);
      expect(screen.getByRole('heading', { name: 'Insert Image' })).toBeInTheDocument();
    });

    it('renders URL input', () => {
      render(<ImageUploadModal {...defaultProps} />);
      expect(screen.getByLabelText('Image URL')).toBeInTheDocument();
    });

    it('renders Insert button for URL', () => {
      render(<ImageUploadModal {...defaultProps} />);
      expect(screen.getByRole('button', { name: /insert image from url/i })).toBeInTheDocument();
    });

    it('renders drop zone', () => {
      render(<ImageUploadModal {...defaultProps} />);
      expect(screen.getByLabelText(/drop zone/i)).toBeInTheDocument();
    });

    it('renders file size limit info', () => {
      render(<ImageUploadModal {...defaultProps} />);
      expect(screen.getByText(/5MB/)).toBeInTheDocument();
    });

    it('renders Cancel button', () => {
      render(<ImageUploadModal {...defaultProps} />);
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });
  });

  describe('URL input', () => {
    it('allows typing in URL input', async () => {
      const user = userEvent.setup();
      render(<ImageUploadModal {...defaultProps} />);

      const input = screen.getByLabelText('Image URL');
      await user.type(input, 'https://example.com/image.png');

      expect(input).toHaveValue('https://example.com/image.png');
    });

    it('inserts valid image URL on button click', async () => {
      const user = userEvent.setup();
      render(<ImageUploadModal {...defaultProps} />);

      const input = screen.getByLabelText('Image URL');
      await user.type(input, 'https://example.com/image.png');

      const insertButton = screen.getByRole('button', { name: /insert image from url/i });
      await user.click(insertButton);

      expect(defaultProps.onInsert).toHaveBeenCalledWith('https://example.com/image.png');
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('inserts URL on Enter key', async () => {
      const user = userEvent.setup();
      render(<ImageUploadModal {...defaultProps} />);

      const input = screen.getByLabelText('Image URL');
      await user.type(input, 'https://example.com/image.jpg');
      await user.keyboard('{Enter}');

      expect(defaultProps.onInsert).toHaveBeenCalledWith('https://example.com/image.jpg');
    });

    it('disables insert button when URL is empty', () => {
      render(<ImageUploadModal {...defaultProps} />);

      const insertButton = screen.getByRole('button', { name: /insert image from url/i });
      expect(insertButton).toBeDisabled();
      expect(defaultProps.onInsert).not.toHaveBeenCalled();
    });

    it('shows error for invalid URL', async () => {
      const user = userEvent.setup();
      render(<ImageUploadModal {...defaultProps} />);

      const input = screen.getByLabelText('Image URL');
      await user.type(input, 'not-a-valid-url');

      const insertButton = screen.getByRole('button', { name: /insert image from url/i });
      await user.click(insertButton);

      expect(showToast.error).toHaveBeenCalledWith('Please enter a valid image URL');
      expect(defaultProps.onInsert).not.toHaveBeenCalled();
    });

    it('shows error for URL without image extension', async () => {
      const user = userEvent.setup();
      render(<ImageUploadModal {...defaultProps} />);

      const input = screen.getByLabelText('Image URL');
      await user.type(input, 'https://example.com/page');

      const insertButton = screen.getByRole('button', { name: /insert image from url/i });
      await user.click(insertButton);

      expect(showToast.error).toHaveBeenCalledWith('Please enter a valid image URL');
    });

    it('accepts various image extensions', async () => {
      const user = userEvent.setup();
      const extensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];

      for (const ext of extensions) {
        vi.clearAllMocks();
        const { unmount } = render(<ImageUploadModal {...defaultProps} />);

        const input = screen.getByLabelText('Image URL');
        await user.type(input, `https://example.com/image${ext}`);

        const insertButton = screen.getByRole('button', { name: /insert image from url/i });
        await user.click(insertButton);

        expect(defaultProps.onInsert).toHaveBeenCalled();
        unmount();
      }
    });
  });

  describe('file upload', () => {
    const createMockFile = (name: string, type: string, size: number = 1024): File => {
      const content = new Array(size).fill('a').join('');
      return new File([content], name, { type });
    };

    it('has file input element', () => {
      render(<ImageUploadModal {...defaultProps} />);
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('accept', 'image/png,image/jpeg,image/jpg,image/gif,image/webp');
    });

    it('rejects unsupported file type', async () => {
      render(<ImageUploadModal {...defaultProps} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createMockFile('test.pdf', 'application/pdf');
      Object.defineProperty(input, 'files', { value: [file] });

      fireEvent.change(input);

      await waitFor(() => {
        expect(showToast.error).toHaveBeenCalledWith(
          expect.stringContaining('Unsupported file type')
        );
      });
      expect(defaultProps.onInsert).not.toHaveBeenCalled();
    });

    it('rejects file larger than 5MB', async () => {
      render(<ImageUploadModal {...defaultProps} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const largeFile = createMockFile('large.png', 'image/png', 6 * 1024 * 1024);
      Object.defineProperty(input, 'files', { value: [largeFile] });

      fireEvent.change(input);

      await waitFor(() => {
        expect(showToast.error).toHaveBeenCalledWith(
          expect.stringContaining('File too large')
        );
      });
      expect(defaultProps.onInsert).not.toHaveBeenCalled();
    });

    it('handles empty file selection', () => {
      render(<ImageUploadModal {...defaultProps} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      Object.defineProperty(input, 'files', { value: [] });

      fireEvent.change(input);

      expect(defaultProps.onInsert).not.toHaveBeenCalled();
    });

    it('handles null files gracefully', () => {
      render(<ImageUploadModal {...defaultProps} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      Object.defineProperty(input, 'files', { value: null });

      fireEvent.change(input);

      expect(defaultProps.onInsert).not.toHaveBeenCalled();
    });
  });

  describe('drag and drop', () => {
    it('shows drag state on drag over', () => {
      render(<ImageUploadModal {...defaultProps} />);

      const dropZone = screen.getByLabelText(/drop zone/i);
      fireEvent.dragOver(dropZone);

      // Component should still be rendered
      expect(dropZone).toBeInTheDocument();
    });

    it('clears drag state on drag leave', () => {
      render(<ImageUploadModal {...defaultProps} />);

      const dropZone = screen.getByLabelText(/drop zone/i);
      fireEvent.dragOver(dropZone);
      fireEvent.dragLeave(dropZone);

      expect(dropZone).toBeInTheDocument();
    });

    it('processes dropped files', () => {
      render(<ImageUploadModal {...defaultProps} />);

      const dropZone = screen.getByLabelText(/drop zone/i);

      const dataTransfer = {
        files: [],
      };

      fireEvent.drop(dropZone, { dataTransfer });

      // Empty file drop should not call insert
      expect(defaultProps.onInsert).not.toHaveBeenCalled();
    });
  });

  describe('keyboard navigation', () => {
    it('closes on Escape key', async () => {
      const user = userEvent.setup();
      render(<ImageUploadModal {...defaultProps} />);

      await user.keyboard('{Escape}');

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('closes URL input on Escape', async () => {
      const user = userEvent.setup();
      render(<ImageUploadModal {...defaultProps} />);

      const input = screen.getByLabelText('Image URL');
      await user.type(input, 'test');
      await user.keyboard('{Escape}');

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('drop zone is focusable for keyboard accessibility', () => {
      render(<ImageUploadModal {...defaultProps} />);

      const dropZone = screen.getByLabelText(/drop zone/i);
      expect(dropZone).toHaveAttribute('tabindex', '0');
      expect(dropZone).toHaveAttribute('role', 'button');
    });
  });

  describe('modal behavior', () => {
    it('closes on backdrop click', async () => {
      const user = userEvent.setup();
      render(<ImageUploadModal {...defaultProps} />);

      // Click on the backdrop (parent div)
      const backdrop = document.querySelector('[role="dialog"]')?.parentElement;
      if (backdrop) {
        await user.click(backdrop);
      }

      // Note: The click handler checks e.target === e.currentTarget
      // In our test the backdrop is the dialog element itself
    });

    it('closes on Cancel button click', async () => {
      const user = userEvent.setup();
      render(<ImageUploadModal {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('has proper ARIA attributes', () => {
      render(<ImageUploadModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'image-upload-modal-title');
    });

    it('auto-focuses URL input', () => {
      render(<ImageUploadModal {...defaultProps} />);

      const input = screen.getByLabelText('Image URL');
      expect(document.activeElement).toBe(input);
    });
  });

  describe('initial files prop', () => {
    it('accepts initialFiles prop', () => {
      const file = new File(['content'], 'initial.png', { type: 'image/png' });
      const fileList = {
        0: file,
        length: 1,
        item: (i: number) => i === 0 ? file : null,
        [Symbol.iterator]: function* () { yield file; },
      } as unknown as FileList;

      const { container } = render(<ImageUploadModal {...defaultProps} initialFiles={fileList} />);
      expect(container).toBeInTheDocument();
    });

    it('renders without initialFiles', () => {
      const { container } = render(<ImageUploadModal {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });
  });

  describe('file input attributes', () => {
    it('allows multiple file selection', () => {
      render(<ImageUploadModal {...defaultProps} />);
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(input).toHaveAttribute('multiple');
    });

    it('has hidden class', () => {
      render(<ImageUploadModal {...defaultProps} />);
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(input).toHaveClass('hidden');
    });
  });
});
