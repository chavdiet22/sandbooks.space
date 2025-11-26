import clsx from 'clsx';

export type KernelStatus = 'idle' | 'busy' | 'error' | 'starting' | 'disconnected';

interface KernelStatusDotProps {
  status: KernelStatus;
  className?: string;
}

const statusConfig: Record<KernelStatus, { color: string; label: string }> = {
  idle: {
    color: 'bg-emerald-500',
    label: 'Kernel ready',
  },
  busy: {
    color: 'bg-amber-500 animate-pulse',
    label: 'Executing',
  },
  error: {
    color: 'bg-red-500',
    label: 'Kernel error',
  },
  starting: {
    color: 'bg-stone-400 animate-pulse',
    label: 'Starting kernel',
  },
  disconnected: {
    color: 'bg-stone-400',
    label: 'No session',
  },
};

export const KernelStatusDot = ({ status, className }: KernelStatusDotProps) => {
  const config = statusConfig[status];

  return (
    <span
      className={clsx(
        'w-2 h-2 rounded-full inline-block flex-shrink-0',
        config.color,
        className
      )}
      aria-label={config.label}
      role="status"
      title={config.label}
    />
  );
};
