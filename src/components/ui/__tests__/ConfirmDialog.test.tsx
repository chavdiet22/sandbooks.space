/**
 * ConfirmDialog tests.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ConfirmDialog } from '../ConfirmDialog';
import { MotionProvider } from '../MotionProvider';

// Wrapper component for animations
const renderWithMotion = (ui: React.ReactElement) => {
  return render(<MotionProvider>{ui}</MotionProvider>);
};

describe('ConfirmDialog', () => {
  const defaultProps = {
    isOpen: true,
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
    title: 'Test Title',
    message: 'Test message content',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders when open', () => {
    renderWithMotion(<ConfirmDialog {...defaultProps} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test message content')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    renderWithMotion(<ConfirmDialog {...defaultProps} isOpen={false} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('displays custom button labels', () => {
    renderWithMotion(
      <ConfirmDialog
        {...defaultProps}
        confirmLabel="Delete"
        cancelLabel="Keep"
      />
    );

    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('Keep')).toBeInTheDocument();
  });

  it('uses default button labels', () => {
    renderWithMotion(<ConfirmDialog {...defaultProps} />);

    expect(screen.getByText('Confirm')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', () => {
    renderWithMotion(<ConfirmDialog {...defaultProps} />);

    fireEvent.click(screen.getByText('Confirm'));

    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button is clicked', () => {
    renderWithMotion(<ConfirmDialog {...defaultProps} />);

    fireEvent.click(screen.getByText('Cancel'));

    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when backdrop is clicked', () => {
    renderWithMotion(<ConfirmDialog {...defaultProps} />);

    // Find and click the backdrop (the aria-hidden element)
    const backdrop = document.querySelector('[aria-hidden="true"]');
    if (backdrop) {
      fireEvent.click(backdrop);
    }

    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when Escape key is pressed', async () => {
    renderWithMotion(<ConfirmDialog {...defaultProps} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('does not call onCancel on Escape when closed', () => {
    renderWithMotion(<ConfirmDialog {...defaultProps} isOpen={false} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(defaultProps.onCancel).not.toHaveBeenCalled();
  });

  describe('variant styles', () => {
    it('renders danger variant', () => {
      renderWithMotion(<ConfirmDialog {...defaultProps} variant="danger" />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('renders warning variant', () => {
      renderWithMotion(<ConfirmDialog {...defaultProps} variant="warning" />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('renders default variant', () => {
      renderWithMotion(<ConfirmDialog {...defaultProps} variant="default" />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has correct aria attributes', () => {
      renderWithMotion(<ConfirmDialog {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'confirm-dialog-title');
      expect(dialog).toHaveAttribute('aria-describedby', 'confirm-dialog-message');
    });

    it('focuses confirm button on open', async () => {
      renderWithMotion(<ConfirmDialog {...defaultProps} />);

      await waitFor(() => {
        const confirmButton = screen.getByText('Confirm');
        expect(document.activeElement).toBe(confirmButton);
      });
    });
  });

  describe('focus trap', () => {
    it('traps focus within dialog', async () => {
      renderWithMotion(<ConfirmDialog {...defaultProps} />);

      const cancelButton = screen.getByText('Cancel');
      const confirmButton = screen.getByText('Confirm');

      // Focus last element and tab
      confirmButton.focus();
      fireEvent.keyDown(document, { key: 'Tab' });

      // Focus should wrap to first element
      await waitFor(() => {
        expect(document.activeElement).toBe(cancelButton);
      });
    });

    it('traps focus with shift+tab', async () => {
      renderWithMotion(<ConfirmDialog {...defaultProps} />);

      const cancelButton = screen.getByText('Cancel');

      // Focus first element and shift+tab
      cancelButton.focus();
      fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });

      // Focus should wrap to last element
      await waitFor(() => {
        const confirmButton = screen.getByText('Confirm');
        expect(document.activeElement).toBe(confirmButton);
      });
    });
  });
});
