import { useState, useRef, useEffect } from 'react';
import { useNotesStore } from '../../store/notesStore';
import clsx from 'clsx';
import { FaDownload, FaUpload } from 'react-icons/fa';
import { FileSystemSync } from '../FileSystemSync';
import { showToast as toast } from '../../utils/toast';
import { parseIpynb, convertIpynbToNote } from '../../utils/ipynb';
import { Popover } from './Popover';
import { Button } from './Button';

export const SyncStatusIcon = () => {
    const { syncStatus, lastSyncedAt, importNotes, exportNotes, notes, storageType, storageName, addNote } = useNotesStore();
    const [isOpen, setIsOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const notebookInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleExport = () => {
        const data = exportNotes();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sandbooks-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setIsOpen(false);
    };



    const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = event.target?.result as string;
                importNotes(data);
                toast.success('Notes imported successfully!');
                setIsOpen(false);
            } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Import failed');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleImportNotebook = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            toast.loading('Importing notebook...', { id: 'import' });
            const notebook = await parseIpynb(file);
            const note = convertIpynbToNote(notebook, file.name);
            addNote(note);
            toast.success(`Imported ${note.title}`, { id: 'import' });
            setIsOpen(false);
        } catch (error) {
            toast.error(
                `Failed to import: ${error instanceof Error ? error.message : 'Unknown error'}`,
                { id: 'import' }
            );
        }

        // Reset input
        if (notebookInputRef.current) {
            notebookInputRef.current.value = '';
        }
    };

    const getIcon = () => {
        switch (syncStatus) {
            case 'saving':
                return (
                    <div className="relative">
                        <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                        <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-yellow-500 rounded-full border-2 border-white dark:border-stone-900 animate-ping" />
                    </div>
                );
            case 'disconnected':
            case 'error':
                return (
                    <div className="relative">
                        <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                        <div className="absolute -bottom-1 -right-1 flex items-center justify-center w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-stone-900">
                            <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M6 18L18 6M6 6l12 12" /></svg>
                        </div>
                    </div>
                );
            case 'synced':
            default:
                return (
                    <div className="relative">
                        <svg className="w-5 h-5 text-stone-600 dark:text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                        <div className="absolute -bottom-1 -right-1 flex items-center justify-center w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-stone-900">
                            <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                        </div>
                    </div>
                );
        }
    };

    const getStatusText = () => {
        switch (syncStatus) {
            case 'saving': return 'Saving...';
            case 'disconnected': return 'Disconnected';
            case 'error': return 'Sync Error';
            case 'synced': return 'Up to date';
            default: return 'Unknown';
        }
    };

    return (
        <Popover
            align="right"
            trigger={
                <Button
                    variant="ghost"
                    size="icon"
                    className={clsx(isOpen && "bg-stone-100 dark:bg-stone-800")}
                    aria-label={`Sync status: ${getStatusText()}`}
                >
                    {getIcon()}
                </Button>
            }
            isOpen={isOpen}
            onOpenChange={setIsOpen}
            content={
                <div className="w-72 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-stone-900 dark:text-stone-100">Sync Status</span>
                        <span className={clsx(
                            "text-xs px-2 py-0.5 rounded-full font-medium",
                            syncStatus === 'synced' && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                            syncStatus === 'saving' && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
                            (syncStatus === 'disconnected' || syncStatus === 'error') && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        )}>
                            {getStatusText()}
                        </span>
                    </div>

                    <div className="text-xs text-stone-500 dark:text-stone-400 mb-4 space-y-1">
                        <div>
                            {lastSyncedAt
                                ? `Last synced: ${new Date(lastSyncedAt).toLocaleString(undefined, {
                                    dateStyle: 'medium',
                                    timeStyle: 'short'
                                })}`
                                : 'Not synced yet'}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span>Synced to:</span>
                            <span className={clsx(
                                "inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-xs font-medium max-w-[180px]",
                                storageType === 'fileSystem'
                                    ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"
                                    : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700"
                            )}>
                                {storageType === 'fileSystem' ? (
                                    <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                    </svg>
                                ) : (
                                    <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                )}
                                <span className="truncate">{storageName}</span>
                            </span>
                        </div>
                    </div>

                    <div className="h-px bg-stone-200 dark:bg-stone-800 my-3" />

                    <div className="space-y-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { handleExport(); setIsOpen(false); }}
                            disabled={notes.length === 0}
                            className="w-full justify-start gap-3 px-2"
                        >
                            <FaDownload className="w-4 h-4 shrink-0 text-stone-500 dark:text-stone-400" />
                            <span>Export Notes</span>
                        </Button>

                        {/* Import from JSON */}
                        <label className="w-full flex items-center gap-3 px-2 py-2 text-left text-sm text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-200 transition-all duration-200 rounded-lg cursor-pointer">
                            <FaUpload className="w-4 h-4 shrink-0" />
                            <span className="flex-1 font-medium">Import from JSON</span>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".json"
                                onChange={handleImportFile}
                                className="hidden"
                            />
                        </label>

                        {/* Import Jupyter Notebook */}
                        <label className="w-full flex items-center gap-3 px-2 py-2 text-left text-sm text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-200 transition-all duration-200 rounded-lg cursor-pointer">
                            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <span className="flex-1 font-medium">Import Jupyter Notebook</span>
                            <input
                                ref={notebookInputRef}
                                type="file"
                                accept=".ipynb"
                                onChange={handleImportNotebook}
                                className="hidden"
                            />
                        </label>

                        <div className="h-px bg-stone-200 dark:bg-stone-800 my-2" />

                        {/* Markdown Actions */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                const activeNote = notes.find(n => n.id === useNotesStore.getState().activeNoteId);
                                if (activeNote) {
                                    import('../../utils/markdownSerializer').then(({ serializeToMarkdown }) => {
                                        const md = serializeToMarkdown(activeNote.content);
                                        const blob = new Blob([md], { type: 'text/markdown' });
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `${activeNote.title || 'untitled'}.md`;
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                        URL.revokeObjectURL(url);
                                        setIsOpen(false);
                                        toast.success('Note exported as Markdown');
                                    });
                                } else {
                                    toast.error('No active note to export');
                                }
                            }}
                            disabled={!useNotesStore.getState().activeNoteId}
                            className="w-full justify-start gap-3 px-2"
                        >
                            <svg className="w-4 h-4 shrink-0 text-stone-500 dark:text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span>Export Current (Markdown)</span>
                        </Button>

                        <label className="w-full flex items-center gap-3 px-2 py-2 text-left text-sm text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-200 transition-all duration-200 rounded-lg cursor-pointer">
                            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            <span className="flex-1 font-medium">Import Markdown</span>
                            <input
                                type="file"
                                accept=".md,.markdown,.txt"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    if (file) {
                                        useNotesStore.getState().importMarkdownNote(file);
                                    }
                                    setIsOpen(false);
                                    e.target.value = '';
                                }}
                                className="hidden"
                            />
                        </label>

                        <div className="h-px bg-stone-200 dark:bg-stone-800 my-2" />

                        <div className="px-1">
                            <FileSystemSync />
                        </div>
                    </div>
                </div>
            }
        />
    );
};

