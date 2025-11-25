import { useCallback, useState, useRef } from 'react';
import { useNotesStore } from '../../store/notesStore';
import { formatTimestamp } from '../../utils/formatTimestamp';
import { serializeToMarkdown } from '../../utils/markdownSerializer';
import clsx from 'clsx';
import { Logo } from '../ui/Logo';
import { ContextMenu } from '../ui/ContextMenu';
import type { ContextMenuItem } from '../ui/ContextMenu';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { VscCopy, VscTrash, VscEllipsis } from 'react-icons/vsc';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { showToast } from '../../utils/toast';

export const Sidebar = ({ isMobile = false, onClose }: { isMobile?: boolean; onClose?: () => void }) => {
  const { notes, activeNoteId, isSidebarOpen, setActiveNote, deleteNote } = useNotesStore();

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{ noteId: string; title: string } | null>(null);
  // Delete exit animation state
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  // Refs for focus management after delete
  const noteRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const listRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation for notes list
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const currentIndex = notes.findIndex(n => n.id === activeNoteId);
    let newIndex = currentIndex;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        newIndex = Math.min(currentIndex + 1, notes.length - 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        newIndex = Math.max(currentIndex - 1, 0);
        break;
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        newIndex = notes.length - 1;
        break;
      default:
        return;
    }

    if (newIndex !== currentIndex && notes[newIndex]) {
      setActiveNote(notes[newIndex].id);
      noteRefs.current.get(notes[newIndex].id)?.focus();
    }
  }, [notes, activeNoteId, setActiveNote]);

  const { copy } = useCopyToClipboard({
    onSuccess: () => showToast.success('Copied to clipboard'),
    onError: (err) => showToast.error(err.message || 'Failed to copy'),
  });

  // Show delete confirmation dialog
  const handleDeleteClick = (e: React.MouseEvent, noteId: string, noteTitle: string) => {
    e.stopPropagation();
    setDeleteConfirm({ noteId, title: noteTitle });
  };

  // Confirm delete with animation
  const handleConfirmDelete = () => {
    if (!deleteConfirm) return;

    const noteId = deleteConfirm.noteId;
    const noteIndex = notes.findIndex(n => n.id === noteId);

    // Start exit animation
    setDeletingNoteId(noteId);
    setDeleteConfirm(null);

    // After animation, delete and manage focus
    setTimeout(() => {
      deleteNote(noteId);
      setDeletingNoteId(null);

      // Focus management: focus next note, or previous, or nothing
      const remainingNotes = notes.filter(n => n.id !== noteId);
      if (remainingNotes.length > 0) {
        const nextIndex = Math.min(noteIndex, remainingNotes.length - 1);
        const nextNoteId = remainingNotes[nextIndex]?.id;
        if (nextNoteId) {
          const nextButton = noteRefs.current.get(nextNoteId);
          nextButton?.focus();
        }
      }
    }, 200);
  };

  const handleCancelDelete = () => {
    setDeleteConfirm(null);
  };

  const getContextMenuItems = useCallback((noteId: string, _noteTitle: string): ContextMenuItem[] => {
    const note = notes.find(n => n.id === noteId);
    return [
      {
        id: 'copy-markdown',
        label: 'Copy as Markdown',
        icon: <VscCopy size={14} />,
        onClick: () => {
          if (note?.content) {
            const markdown = serializeToMarkdown(note.content);
            copy(markdown);
          }
        },
      },
      {
        id: 'delete',
        label: 'Delete',
        icon: <VscTrash size={14} />,
        variant: 'danger',
        onClick: () => {
          const note = notes.find(n => n.id === noteId);
          setDeleteConfirm({ noteId, title: note?.title || 'Untitled' });
        },
      },
    ];
  }, [notes, copy]);

  // Mobile sidebar is always "open" when rendered (controlled by parent overlay)
  const isOpen = isMobile ? true : isSidebarOpen;

  if (notes.length === 0) {
    return (
      <div className={clsx(
        "bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 p-6 flex flex-col items-center justify-center self-stretch",
        isMobile ? "w-full h-full justify-center" : "hidden md:flex transition-[width] duration-300 ease-in-out",
        !isMobile && (isOpen ? "w-64 lg:w-72" : "w-0 hidden")
      )}>
        <div className="text-center">
          <Logo className="w-16 h-16 mx-auto text-stone-300 dark:text-stone-600 mb-6" />
          <p className="text-sm font-medium text-stone-600 dark:text-stone-400 tracking-tight">No notes yet</p>
          <p className="text-xs text-stone-500 dark:text-stone-500 mt-2">Press <kbd className="font-mono bg-stone-100 dark:bg-stone-800 px-1 rounded">⌘N</kbd> to start writing</p>
        </div>
      </div>
    );
  }

  return (
    <aside aria-label="Notes sidebar" className={clsx(
      "bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 overflow-y-auto flex-shrink-0",
      isMobile ? "w-full h-full" : "hidden md:block transition-[width,opacity] duration-300 ease-in-out",
      !isMobile && (isOpen ? "w-64 lg:w-72" : "w-0 opacity-0")
    )}>
      <div className="py-4 px-2">
        {isMobile && (
          <div className="flex items-center justify-between mb-6 pl-2 pr-1">
            <div className="flex items-center gap-3">
              <Logo className="w-6 h-6 text-stone-900 dark:text-stone-100" />
              <span className="font-semibold text-lg text-stone-900 dark:text-stone-100 tracking-tight">Sandbooks</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
              aria-label="Close sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        {/* Notes list with keyboard navigation */}
        <div
          ref={listRef}
          role="listbox"
          aria-label="Notes"
          aria-activedescendant={activeNoteId ? `note-${activeNoteId}` : undefined}
          onKeyDown={handleKeyDown}
        >
        {notes.map((note) => {
          const timestamp = formatTimestamp(note.updatedAt);

          return (
            <ContextMenu key={note.id} items={getContextMenuItems(note.id, note.title)}>
              <div
                id={`note-${note.id}`}
                role="option"
                aria-selected={activeNoteId === note.id}
                className={clsx(
                  'px-3 py-2 mb-1 rounded-lg transition-all duration-200 ease-spring group relative touch-manipulation',
                  'motion-reduce:transition-none motion-reduce:hover:translate-x-0',
                  deletingNoteId === note.id && 'animate-fadeOutSlideLeft motion-reduce:animate-none motion-reduce:opacity-0 pointer-events-none',
                  activeNoteId === note.id
                    ? 'bg-stone-100 dark:bg-stone-800/80'
                    : 'hover:bg-stone-50 dark:hover:bg-stone-800/50 hover:translate-x-0.5 hover:shadow-sm active:bg-stone-100 dark:active:bg-stone-800/70'
                )}
              >
              {/* Active Indicator - always rendered for exit animation */}
              <div className={clsx(
                "absolute -left-0.5 top-2 bottom-2 w-0.5 bg-blue-500 rounded-full transition-all duration-200 ease-spring motion-reduce:transition-none",
                activeNoteId === note.id
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 -translate-x-full motion-reduce:hidden"
              )} />
              {/* Context menu hint - indicates right-click available */}
              <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-30 transition-opacity duration-150 pointer-events-none">
                <VscEllipsis size={14} className="text-stone-500 dark:text-stone-400" />
              </div>
              <div className="flex items-start justify-between gap-2">
                <button
                  ref={(el) => el && noteRefs.current.set(note.id, el)}
                  onClick={() => setActiveNote(note.id)}
                  tabIndex={activeNoteId === note.id ? 0 : -1}
                  className="flex-1 min-w-0 text-left focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-600 focus-visible:ring-offset-3 rounded"
                  aria-label={`Select note: ${note.title}`}
                >
                  <h3 className={clsx(
                    'truncate text-base font-medium leading-snug tracking-tight',
                    activeNoteId === note.id
                      ? 'text-stone-900 dark:text-stone-50'
                      : 'text-stone-600 dark:text-stone-300 group-hover:text-stone-800 dark:group-hover:text-stone-100'
                  )}>
                    {note.title}
                  </h3>
                  <time
                    dateTime={timestamp.datetime}
                    aria-label={`Last edited ${timestamp.absolute}`}
                    title={timestamp.absolute}
                    className="block text-xs mt-0.5 text-stone-400 dark:text-stone-500"
                  >
                    {timestamp.relative}
                  </time>

                  {/* Tags - minimal text-only display */}
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex items-center flex-wrap gap-1.5 mt-1.5 text-xs text-stone-400 dark:text-stone-500">
                      {note.tags.slice(0, 3).map((tag, idx) => {
                        const colorMap: Record<string, string> = {
                          gray: '#78716c', red: '#ef4444', orange: '#f97316', amber: '#f59e0b',
                          yellow: '#eab308', green: '#22c55e', emerald: '#10b981', blue: '#3b82f6',
                          indigo: '#6366f1', purple: '#a855f7', pink: '#ec4899', rose: '#f43f5e',
                        };
                        return (
                          <span key={tag.id} className="inline-flex items-center gap-1">
                            <span
                              className="w-1 h-1 rounded-full"
                              style={{ backgroundColor: colorMap[tag.color] || '#3b82f6' }}
                            />
                            <span className="font-medium">{tag.name}</span>
                            {idx < Math.min(note.tags!.length, 3) - 1 && <span className="text-stone-400">·</span>}
                          </span>
                        );
                      })}
                      {note.tags.length > 3 && (
                        <span className="text-stone-500 dark:text-stone-500">+{note.tags.length - 3}</span>
                      )}
                    </div>
                  )}
                </button>
                <button
                  onClick={(e) => handleDeleteClick(e, note.id, note.title)}
                  className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 text-stone-400 dark:text-stone-500 hover:text-red-600 dark:hover:text-red-400 transition-[opacity,color,background-color,transform] duration-200 flex-shrink-0 p-2 -mr-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-red-600 focus-visible:ring-offset-3 focus-visible:opacity-100 active:scale-[0.95]"
                  title="Delete note"
                  aria-label={`Delete note: ${note.title}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
              </div>
            </ContextMenu>
          );
        })}
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        title="Delete note?"
        message={`"${deleteConfirm?.title}" will be permanently deleted. This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
      />
    </aside>
  );
};
