/**
 * toast utility tests.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { showToast } from '../toast';
import toast from 'react-hot-toast';

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    custom: vi.fn(() => 'toast-id'),
    dismiss: vi.fn(),
  },
}));

// Mock Toast component
vi.mock('../../components/ui/Toast', () => ({
  Toast: ({ type, message }: { type: string; message: string }) => (
    <div data-testid="toast" data-type={type}>{message}</div>
  ),
}));

describe('showToast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('success', () => {
    it('calls toast.custom with success type', () => {
      showToast.success('Success message');
      expect(toast.custom).toHaveBeenCalled();
    });

    it('passes options to toast.custom', () => {
      const options = { duration: 5000 };
      showToast.success('Success', options);
      expect(toast.custom).toHaveBeenCalledWith(expect.any(Function), options);
    });

    it('returns toast id', () => {
      const result = showToast.success('Success');
      expect(result).toBe('toast-id');
    });
  });

  describe('error', () => {
    it('calls toast.custom with error type', () => {
      showToast.error('Error message');
      expect(toast.custom).toHaveBeenCalled();
    });

    it('passes options to toast.custom', () => {
      const options = { duration: 3000 };
      showToast.error('Error', options);
      expect(toast.custom).toHaveBeenCalledWith(expect.any(Function), options);
    });

    it('returns toast id', () => {
      const result = showToast.error('Error');
      expect(result).toBe('toast-id');
    });
  });

  describe('loading', () => {
    it('calls toast.custom with loading type', () => {
      showToast.loading('Loading message');
      expect(toast.custom).toHaveBeenCalled();
    });

    it('passes options to toast.custom', () => {
      const options = { duration: Infinity };
      showToast.loading('Loading', options);
      expect(toast.custom).toHaveBeenCalledWith(expect.any(Function), options);
    });

    it('returns toast id', () => {
      const result = showToast.loading('Loading');
      expect(result).toBe('toast-id');
    });
  });

  describe('custom', () => {
    it('calls toast.custom with custom type', () => {
      showToast.custom('Custom message');
      expect(toast.custom).toHaveBeenCalled();
    });

    it('accepts ReactNode as message', () => {
      const customNode = <span>Custom Node</span>;
      showToast.custom(customNode);
      expect(toast.custom).toHaveBeenCalled();
    });

    it('passes options to toast.custom', () => {
      const options = { id: 'custom-toast' };
      showToast.custom('Custom', options);
      expect(toast.custom).toHaveBeenCalledWith(expect.any(Function), options);
    });

    it('returns toast id', () => {
      const result = showToast.custom('Custom');
      expect(result).toBe('toast-id');
    });
  });

  describe('dismiss', () => {
    it('calls toast.dismiss without id', () => {
      showToast.dismiss();
      expect(toast.dismiss).toHaveBeenCalledWith(undefined);
    });

    it('calls toast.dismiss with specific id', () => {
      showToast.dismiss('toast-123');
      expect(toast.dismiss).toHaveBeenCalledWith('toast-123');
    });
  });

  describe('render callbacks', () => {
    it('success callback renders Toast component with success type', () => {
      showToast.success('Test success');
      const call = (toast.custom as ReturnType<typeof vi.fn>).mock.calls[0];
      const renderFn = call[0];
      const mockToastArg = { id: 'test-toast', visible: true };
      const element = renderFn(mockToastArg);
      expect(element.props.type).toBe('success');
      expect(element.props.message).toBe('Test success');
    });

    it('error callback renders Toast component with error type', () => {
      showToast.error('Test error');
      const call = (toast.custom as ReturnType<typeof vi.fn>).mock.calls[0];
      const renderFn = call[0];
      const mockToastArg = { id: 'test-toast', visible: true };
      const element = renderFn(mockToastArg);
      expect(element.props.type).toBe('error');
      expect(element.props.message).toBe('Test error');
    });

    it('loading callback renders Toast component with loading type', () => {
      showToast.loading('Test loading');
      const call = (toast.custom as ReturnType<typeof vi.fn>).mock.calls[0];
      const renderFn = call[0];
      const mockToastArg = { id: 'test-toast', visible: true };
      const element = renderFn(mockToastArg);
      expect(element.props.type).toBe('loading');
      expect(element.props.message).toBe('Test loading');
    });

    it('custom callback renders Toast component with custom type', () => {
      showToast.custom('Test custom');
      const call = (toast.custom as ReturnType<typeof vi.fn>).mock.calls[0];
      const renderFn = call[0];
      const mockToastArg = { id: 'test-toast', visible: true };
      const element = renderFn(mockToastArg);
      expect(element.props.type).toBe('custom');
      expect(element.props.message).toBe('Test custom');
    });
  });
});
