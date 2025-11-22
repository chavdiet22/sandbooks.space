import toast, { type ToastOptions } from 'react-hot-toast';
import { Toast } from '../components/ui/Toast';

export const showToast = {
    success: (message: string, options?: ToastOptions) => {
        return toast.custom((t) => <Toast t={t} type="success" message={message} />, options);
    },
    error: (message: string, options?: ToastOptions) => {
        return toast.custom((t) => <Toast t={t} type="error" message={message} />, options);
    },
    loading: (message: string, options?: ToastOptions) => {
        return toast.custom((t) => <Toast t={t} type="loading" message={message} />, options);
    },
    custom: (message: React.ReactNode, options?: ToastOptions) => {
        return toast.custom((t) => <Toast t={t} type="custom" message={message} />, options);
    },
    dismiss: (toastId?: string) => {
        toast.dismiss(toastId);
    },
};
