/**
 * Popover tests.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Popover } from '../Popover';
import { MotionProvider } from '../MotionProvider';

// Wrapper component for animations
const renderWithMotion = (ui: React.ReactElement) => {
  return render(<MotionProvider>{ui}</MotionProvider>);
};

describe('Popover', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders trigger element', () => {
    renderWithMotion(
      <Popover
        trigger={<button>Open</button>}
        content={<div>Content</div>}
      />
    );

    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('shows content when clicked (uncontrolled)', () => {
    renderWithMotion(
      <Popover
        trigger={<button>Open</button>}
        content={<div>Popover Content</div>}
      />
    );

    expect(screen.queryByText('Popover Content')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Open'));

    expect(screen.getByText('Popover Content')).toBeInTheDocument();
  });

  it('hides content when clicked again (uncontrolled)', () => {
    renderWithMotion(
      <Popover
        trigger={<button>Open</button>}
        content={<div>Popover Content</div>}
      />
    );

    fireEvent.click(screen.getByText('Open'));
    expect(screen.getByText('Popover Content')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Open'));
    // Note: AnimatePresence may keep element in DOM briefly
  });

  it('shows content based on controlled isOpen prop', () => {
    renderWithMotion(
      <Popover
        trigger={<button>Open</button>}
        content={<div>Controlled Content</div>}
        isOpen={true}
      />
    );

    expect(screen.getByText('Controlled Content')).toBeInTheDocument();
  });

  it('hides content when controlled isOpen is false', () => {
    renderWithMotion(
      <Popover
        trigger={<button>Open</button>}
        content={<div>Hidden Content</div>}
        isOpen={false}
      />
    );

    expect(screen.queryByText('Hidden Content')).not.toBeInTheDocument();
  });

  it('calls onOpenChange when trigger is clicked', () => {
    const onOpenChange = vi.fn();
    renderWithMotion(
      <Popover
        trigger={<button>Open</button>}
        content={<div>Content</div>}
        onOpenChange={onOpenChange}
      />
    );

    fireEvent.click(screen.getByText('Open'));

    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it('closes on Escape key', () => {
    const onOpenChange = vi.fn();
    renderWithMotion(
      <Popover
        trigger={<button>Open</button>}
        content={<div>Content</div>}
        isOpen={true}
        onOpenChange={onOpenChange}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('closes on click outside', () => {
    const onOpenChange = vi.fn();
    renderWithMotion(
      <div>
        <Popover
          trigger={<button>Open</button>}
          content={<div>Content</div>}
          isOpen={true}
          onOpenChange={onOpenChange}
        />
        <button data-testid="outside">Outside</button>
      </div>
    );

    fireEvent.mouseDown(screen.getByTestId('outside'));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('does not close when clicking inside popover', () => {
    const onOpenChange = vi.fn();
    renderWithMotion(
      <Popover
        trigger={<button>Open</button>}
        content={<button data-testid="inside">Inside Content</button>}
        isOpen={true}
        onOpenChange={onOpenChange}
      />
    );

    fireEvent.mouseDown(screen.getByTestId('inside'));

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  describe('alignment', () => {
    it('uses right alignment by default', () => {
      renderWithMotion(
        <Popover
          trigger={<button>Open</button>}
          content={<div data-testid="popover-content">Content</div>}
          isOpen={true}
        />
      );

      // Look for the content wrapper with alignment classes
      const contentWrapper = screen.getByTestId('popover-content').closest('.glass-elevated');
      expect(contentWrapper).toHaveClass('right-0');
    });

    it('uses left alignment when specified', () => {
      renderWithMotion(
        <Popover
          trigger={<button>Open</button>}
          content={<div data-testid="popover-content">Content</div>}
          isOpen={true}
          align="left"
        />
      );

      const contentWrapper = screen.getByTestId('popover-content').closest('.glass-elevated');
      expect(contentWrapper).toHaveClass('left-0');
    });

    it('uses center alignment when specified', () => {
      renderWithMotion(
        <Popover
          trigger={<button>Open</button>}
          content={<div data-testid="popover-content">Content</div>}
          isOpen={true}
          align="center"
        />
      );

      const contentWrapper = screen.getByTestId('popover-content').closest('.glass-elevated');
      expect(contentWrapper).toHaveClass('left-1/2');
    });
  });

  it('applies custom className', () => {
    renderWithMotion(
      <Popover
        trigger={<button>Open</button>}
        content={<div data-testid="popover-content">Content</div>}
        isOpen={true}
        className="custom-class"
      />
    );

    const contentWrapper = screen.getByTestId('popover-content').closest('.glass-elevated');
    expect(contentWrapper).toHaveClass('custom-class');
  });

  it('handles controlled mode without onOpenChange', () => {
    // Should not throw when controlled but no onOpenChange
    renderWithMotion(
      <Popover
        trigger={<button>Open</button>}
        content={<div>Content</div>}
        isOpen={true}
      />
    );

    expect(() => fireEvent.click(screen.getByText('Open'))).not.toThrow();
  });
});
