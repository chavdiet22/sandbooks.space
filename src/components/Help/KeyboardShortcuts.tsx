import { useEffect, useMemo } from 'react';
import { useNotesStore } from '../../store/notesStore';
import { formatShortcut } from '../../utils/platform';
import { getShortcutsByCategory } from '../../constants/shortcuts';

export const KeyboardShortcuts = () => {
  const { isShortcutsOpen, toggleShortcuts } = useNotesStore();

  // Format shortcuts dynamically based on OS
  const shortcuts = useMemo(() => {
    const categories = getShortcutsByCategory();
    return Object.entries(categories).map(([category, items]) => ({
      category,
      shortcuts: items.map(shortcut => ({
        ...shortcut,
        displayKey: shortcut.rawKey || formatShortcut(shortcut.keys),
      })),
    }));
  }, []);

  // Handle Escape and ? to close
  useEffect(() => {
    if (!isShortcutsOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === '?') {
        e.preventDefault();
        toggleShortcuts();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isShortcutsOpen, toggleShortcuts]);

  if (!isShortcutsOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center glass-backdrop animate-fadeIn"
      onClick={toggleShortcuts}
    >
      <div
        className="w-full max-w-3xl max-h-[80vh] mx-4 glass-modal rounded-2xl shadow-elevation-5 overflow-hidden animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-stone-200 dark:border-stone-700">
          <div>
            <h2 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
              Keyboard Shortcuts
            </h2>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
              Use these shortcuts to navigate Sandbooks faster
            </p>
          </div>

          <button
            onClick={toggleShortcuts}
            className="p-2 text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-600 focus-visible:ring-offset-3"
            aria-label="Close shortcuts panel"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(80vh-140px)] px-8 py-6">
          <div className="grid gap-8 md:grid-cols-2">
            {shortcuts.map((category) => (
              <div key={category.category}>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-4">
                  {category.category}
                </h3>
                <div className="space-y-3">
                  {category.shortcuts.map((shortcut, idx) => (
                    <div
                      key={`${category.category}-${idx}`}
                      className="flex items-start justify-between gap-4"
                    >
                      <span className="text-sm text-stone-700 dark:text-stone-300 flex-1 pt-1.5">
                        {shortcut.action}
                      </span>
                      <kbd className="px-3 py-1.5 text-sm font-mono font-semibold bg-stone-100 dark:bg-stone-700 text-stone-900 dark:text-stone-100 rounded-lg border border-stone-300 dark:border-stone-600 shadow-sm whitespace-nowrap flex-shrink-0">
                        {shortcut.displayKey}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 pt-5 pb-6 border-t border-stone-200 dark:border-stone-700 bg-gradient-to-b from-stone-50 to-stone-100 dark:from-stone-900/50 dark:to-stone-950/50">
          <div className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              Press <kbd className="px-1.5 py-0.5 bg-white dark:bg-stone-800 rounded font-mono">Esc</kbd> or{' '}
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-stone-800 rounded font-mono">?</kbd> to close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
