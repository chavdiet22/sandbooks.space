import { showToast } from './toast';
import toast from 'react-hot-toast';
import { vi } from 'vitest';

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
    default: {
        custom: vi.fn(),
        dismiss: vi.fn(),
    },
}));

describe('toast utility', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('calls toast.custom for success', () => {
        showToast.success('Success message');
        expect(toast.custom).toHaveBeenCalled();
    });

    it('calls toast.custom for error', () => {
        showToast.error('Error message');
        expect(toast.custom).toHaveBeenCalled();
    });

    it('calls toast.custom for loading', () => {
        showToast.loading('Loading message');
        expect(toast.custom).toHaveBeenCalled();
    });

    it('calls toast.custom for custom', () => {
        showToast.custom('Custom message');
        expect(toast.custom).toHaveBeenCalled();
    });

    it('calls toast.dismiss', () => {
        showToast.dismiss('test-id');
        expect(toast.dismiss).toHaveBeenCalledWith('test-id');
    });
});
