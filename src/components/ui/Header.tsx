import { useNotesStore, createNewNote } from '../../store/notesStore';
import clsx from 'clsx';
import { Logo } from './Logo';
import { SyncStatusIcon } from './SyncStatusIcon';
import { Button } from './Button';
import { Tooltip } from './Tooltip';


interface HeaderProps {
  onToggleMobileSidebar: () => void;
}

export const Header = ({ onToggleMobileSidebar }: HeaderProps) => {
  const { notes, activeNoteId, darkModeEnabled, toggleDarkMode, isSidebarOpen, toggleSidebar, isTerminalOpen, toggleTerminal, addNote } = useNotesStore();

  const activeNote = notes.find(n => n.id === activeNoteId);

  const handleNewNote = () => {
    const newNote = createNewNote();
    addNote(newNote);
  };

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 px-4 md:px-6 lg:px-8 py-3 md:py-4 lg:py-6 flex items-center justify-between shadow-elevation-1 transition-all duration-200" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
      <div className="flex items-center gap-4 md:gap-6">
        {/* Mobile hamburger menu */}
        <div className="md:hidden -ml-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleMobileSidebar}
            aria-label="Toggle sidebar"
          >
            <svg className="w-6 h-6 text-stone-700 dark:text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </Button>
        </div>

        {/* Desktop sidebar toggle */}
        <div className="hidden md:block">
          <Tooltip content={isSidebarOpen ? "Hide sidebar" : "Show sidebar"} shortcut="⌘B">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              aria-label={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
            >
              <svg className="w-5 h-5 text-stone-600 dark:text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isSidebarOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                )}
              </svg>
            </Button>
          </Tooltip>
        </div>

        <div className="flex items-center gap-3">
          <Logo className="w-8 h-8 text-stone-900 dark:text-stone-50" />
          <h1 className="text-2xl md:text-3xl font-semibold text-stone-900 dark:text-stone-50 tracking-tight">
            Sandbooks
          </h1>
          <span className="hidden sm:inline text-sm font-medium text-stone-600 dark:text-stone-400 tracking-wide">
            dev notes
          </span>
        </div>
        {activeNote && (
          <span className="hidden sm:inline text-sm text-stone-500 dark:text-stone-400 ml-3 pl-3 border-l border-stone-300 dark:border-stone-700">
            {notes.length} {notes.length === 1 ? 'note' : 'notes'}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 md:gap-2 lg:gap-3">
        <Tooltip content={darkModeEnabled ? "Switch to light mode" : "Switch to dark mode"}>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            aria-label={darkModeEnabled ? "Switch to light mode" : "Switch to dark mode"}
          >
            <svg
              className={clsx(
                "w-5 h-5 transition-all duration-300 ease-out",
                darkModeEnabled ? "text-stone-300 rotate-180" : "text-stone-700 rotate-0"
              )}
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <circle cx="12" cy="12" r="9" fill="currentColor" opacity="0.15" />
              <path d="M12 3 A 9 9 0 0 1 12 21 Z" fill="currentColor" />
              <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
            </svg>
          </Button>
        </Tooltip>

        <Tooltip content={isTerminalOpen ? "Close terminal" : "Open terminal"} shortcut="Ctrl+`">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTerminal}
            className={clsx(
              isTerminalOpen && "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30"
            )}
            aria-label={isTerminalOpen ? "Close terminal" : "Open terminal"}
          >
            <svg
              className={clsx(
                "w-5 h-5 transition-colors duration-200",
                isTerminalOpen
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-stone-600 dark:text-stone-400"
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </Button>
        </Tooltip>

        <div className="hidden md:block w-px h-6 bg-stone-300 dark:bg-stone-700"></div>

        <Tooltip content="New note" shortcut="⌘N">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNewNote}
            aria-label="Create new note"
          >
            <svg className="w-5 h-5 text-stone-600 dark:text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </Button>
        </Tooltip>

        <div className="hidden md:block w-px h-6 bg-stone-300 dark:bg-stone-700"></div>

        <SyncStatusIcon />
      </div>
    </header>
  );
};
