import { useNotesStore } from '../../store/notesStore';
import clsx from 'clsx';

/**
 * EditorModeIndicator - Unified glass morphism status indicators
 *
 * Design Philosophy:
 * - Cohesive glass material matching the word counter
 * - Single container with horizontal icon layout
 * - Positioned above counter to avoid overlap
 * - Icon-only for minimal footprint, labels via tooltip
 * - Smooth enter/exit animations
 * - Respects reduced motion preferences
 */
export const EditorModeIndicator = () => {
  const { typewriterModeEnabled, focusModeEnabled, toggleTypewriterMode, toggleFocusMode } = useNotesStore();

  // Don't render anything if both modes are disabled
  if (!typewriterModeEnabled && !focusModeEnabled) {
    return null;
  }

  return (
    <div
      className={clsx(
        // Position: above the counter with clearance
        'fixed bottom-16 right-4 z-40',
        // Glass morphism base (matching counter exactly)
        'backdrop-blur-md backdrop-saturate-150',
        'bg-white/75 dark:bg-stone-900/75',
        'border border-stone-200/40 dark:border-stone-700/40',
        // Shape
        'rounded-xl',
        // Shadow (matching counter)
        'shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08),0_4px_16px_-4px_rgba(0,0,0,0.06)]',
        'dark:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.3),0_4px_16px_-4px_rgba(0,0,0,0.2)]',
        // Layout
        'flex items-center gap-1 p-1',
        // Animation (uses project's fadeInSlideUp keyframe)
        'animate-fadeInSlideUp',
        'motion-reduce:animate-none motion-reduce:opacity-100'
      )}
      role="status"
      aria-live="polite"
      aria-label={`Editor modes: ${typewriterModeEnabled ? 'Typewriter' : ''} ${focusModeEnabled ? 'Focus' : ''}`}
    >
      {/* Inner glow overlay for glass thickness illusion */}
      <div
        className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 via-transparent to-transparent dark:from-white/5 pointer-events-none"
        aria-hidden="true"
      />

      {/* Typewriter Mode Button */}
      {typewriterModeEnabled && (
        <button
          onClick={toggleTypewriterMode}
          className={clsx(
            'group relative',
            'p-2 rounded-lg',
            'transition-all duration-200 ease-out',
            // Hover
            'hover:bg-blue-500/10 dark:hover:bg-blue-400/10',
            'hover:scale-105',
            // Active
            'active:scale-95',
            // Focus
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-1',
            // GPU acceleration
            'will-change-transform'
          )}
          title="Typewriter mode (⌘⌥T) · Keeps cursor centered"
          aria-label="Typewriter mode active. Click to disable."
        >
          {/* Icon: Centered cursor */}
          <svg
            className="w-4 h-4 text-blue-600 dark:text-blue-400 relative z-10 transition-transform duration-200 group-hover:scale-110"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
            aria-hidden="true"
          >
            {/* Vertical line with arrows */}
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 8l4-4 4 4" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16l4 4 4-4" />
            {/* Center dot */}
            <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
          </svg>

          {/* Subtle active indicator dot */}
          <div
            className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400 animate-pulse"
            style={{ animationDuration: '2s' }}
            aria-hidden="true"
          />
        </button>
      )}

      {/* Divider when both modes active */}
      {typewriterModeEnabled && focusModeEnabled && (
        <div
          className="w-px h-4 bg-stone-300/50 dark:bg-stone-600/50"
          aria-hidden="true"
        />
      )}

      {/* Focus Mode Button */}
      {focusModeEnabled && (
        <button
          onClick={toggleFocusMode}
          className={clsx(
            'group relative',
            'p-2 rounded-lg',
            'transition-all duration-200 ease-out',
            // Hover
            'hover:bg-purple-500/10 dark:hover:bg-purple-400/10',
            'hover:scale-105',
            // Active
            'active:scale-95',
            // Focus
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 focus-visible:ring-offset-1',
            // GPU acceleration
            'will-change-transform'
          )}
          title="Focus mode (⌘⇧F) · Dims non-active paragraphs"
          aria-label="Focus mode active. Click to disable."
        >
          {/* Icon: Target/focus */}
          <svg
            className="w-4 h-4 text-purple-600 dark:text-purple-400 relative z-10 transition-transform duration-200 group-hover:scale-110"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="8" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
          </svg>

          {/* Subtle active indicator dot */}
          <div
            className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-purple-500 dark:bg-purple-400 animate-pulse"
            style={{ animationDuration: '2s' }}
            aria-hidden="true"
          />
        </button>
      )}
    </div>
  );
};
