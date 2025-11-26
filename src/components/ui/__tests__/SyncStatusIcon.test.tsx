import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SyncStatusIcon } from '../SyncStatusIcon';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { parseIpynb, convertIpynbToNote } from '../../../utils/ipynb';
import { showToast } from '../../../utils/toast';

// Create mock store factory
const createMockStore = (overrides = {}) => ({
    syncStatus: 'synced' as const,
    lastSyncedAt: new Date().toISOString(),
    importNotes: vi.fn(),
    exportNotes: vi.fn().mockReturnValue('{"notes":[]}'),
    notes: [{ id: 'test-note', title: 'Test Note', content: { type: 'doc' } }],
    addNote: vi.fn(),
    storageType: 'localStorage' as const,
    storageName: 'Browser Storage',
    activeNoteId: 'test-note',
    importMarkdownNote: vi.fn(),
    ...overrides,
});

let mockStore = createMockStore();

// Mocks
vi.mock('../../../store/notesStore', () => {
    const useNotesStoreMock = vi.fn(() => mockStore);
    useNotesStoreMock.getState = () => mockStore;
    return {
        useNotesStore: useNotesStoreMock,
    };
});

vi.mock('../../../utils/toast', () => ({
    showToast: {
        success: vi.fn(),
        error: vi.fn(),
        loading: vi.fn(),
    },
}));

vi.mock('../../../utils/ipynb', () => ({
    parseIpynb: vi.fn(),
    convertIpynbToNote: vi.fn(),
}));

vi.mock('../../../utils/markdownSerializer', () => ({
    serializeToMarkdown: vi.fn().mockReturnValue('# Test Note'),
}));

vi.mock('../../FileSystemSync', () => ({
    FileSystemSync: () => <div data-testid="fs-sync">FS Sync</div>,
}));

describe('SyncStatusIcon Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockStore = createMockStore();

        // Mock URL methods
        global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
        global.URL.revokeObjectURL = vi.fn();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('rendering', () => {
        it('renders correctly', () => {
            render(<SyncStatusIcon />);
            expect(screen.getByLabelText(/Sync status/i)).toBeInTheDocument();
        });

        it('renders with synced status icon', () => {
            mockStore = createMockStore({ syncStatus: 'synced' });
            render(<SyncStatusIcon />);
            expect(screen.getByLabelText(/up to date/i)).toBeInTheDocument();
        });

        it('renders with saving status', () => {
            mockStore = createMockStore({ syncStatus: 'saving' });
            render(<SyncStatusIcon />);
            expect(screen.getByLabelText(/saving/i)).toBeInTheDocument();
        });

        it('renders with disconnected status', () => {
            mockStore = createMockStore({ syncStatus: 'disconnected' });
            render(<SyncStatusIcon />);
            expect(screen.getByLabelText(/disconnected/i)).toBeInTheDocument();
        });

        it('renders with error status', () => {
            mockStore = createMockStore({ syncStatus: 'error' });
            render(<SyncStatusIcon />);
            expect(screen.getByLabelText(/sync error/i)).toBeInTheDocument();
        });
    });

    describe('popover', () => {
        it('opens popover on click', () => {
            render(<SyncStatusIcon />);
            const button = screen.getByLabelText(/Sync status/i);
            fireEvent.click(button);
            expect(screen.getByText('Sync Status')).toBeInTheDocument();
        });

        it('shows last synced time', () => {
            render(<SyncStatusIcon />);
            fireEvent.click(screen.getByLabelText(/Sync status/i));
            expect(screen.getByText(/last synced/i)).toBeInTheDocument();
        });

        it('shows not synced yet when no lastSyncedAt', () => {
            mockStore = createMockStore({ lastSyncedAt: null });
            render(<SyncStatusIcon />);
            fireEvent.click(screen.getByLabelText(/Sync status/i));
            expect(screen.getByText('Not synced yet')).toBeInTheDocument();
        });

        it('shows storage type name', () => {
            render(<SyncStatusIcon />);
            fireEvent.click(screen.getByLabelText(/Sync status/i));
            expect(screen.getByText('Browser Storage')).toBeInTheDocument();
        });

        it('shows file system storage type', () => {
            mockStore = createMockStore({ storageType: 'fileSystem', storageName: 'My Folder' });
            render(<SyncStatusIcon />);
            fireEvent.click(screen.getByLabelText(/Sync status/i));
            expect(screen.getByText('My Folder')).toBeInTheDocument();
        });

        it('shows FileSystemSync component', () => {
            render(<SyncStatusIcon />);
            fireEvent.click(screen.getByLabelText(/Sync status/i));
            expect(screen.getByTestId('fs-sync')).toBeInTheDocument();
        });

        it('closes popover on outside click', async () => {
            render(<SyncStatusIcon />);
            fireEvent.click(screen.getByLabelText(/Sync status/i));
            expect(screen.getByText('Sync Status')).toBeInTheDocument();

            // Simulate click outside
            fireEvent.mouseDown(document.body);

            await waitFor(() => {
                expect(screen.queryByText('Sync Status')).not.toBeInTheDocument();
            });
        });
    });

    describe('export functionality', () => {
        it('exports notes to JSON file', async () => {
            render(<SyncStatusIcon />);
            fireEvent.click(screen.getByLabelText(/Sync status/i));

            await waitFor(() => {
                expect(screen.getByText('Export Notes')).toBeInTheDocument();
            });

            // Setup mocks after render
            const originalAppendChild = document.body.appendChild.bind(document.body);
            const originalRemoveChild = document.body.removeChild.bind(document.body);
            const mockClick = vi.fn();

            vi.spyOn(document.body, 'appendChild').mockImplementation((el) => {
                if ((el as HTMLElement).tagName === 'A') {
                    (el as HTMLAnchorElement).click = mockClick;
                }
                return originalAppendChild(el);
            });
            vi.spyOn(document.body, 'removeChild').mockImplementation((el) => {
                return originalRemoveChild(el);
            });

            const exportButton = screen.getByText('Export Notes');
            fireEvent.click(exportButton);

            expect(mockStore.exportNotes).toHaveBeenCalled();
        });

        it('disables export when no notes', () => {
            mockStore = createMockStore({ notes: [] });
            render(<SyncStatusIcon />);
            fireEvent.click(screen.getByLabelText(/Sync status/i));

            const exportButton = screen.getByText('Export Notes').closest('button');
            expect(exportButton).toBeDisabled();
        });
    });

    describe('JSON import', () => {
        it('shows import from JSON option', async () => {
            render(<SyncStatusIcon />);
            fireEvent.click(screen.getByLabelText(/Sync status/i));

            await waitFor(() => {
                expect(screen.getByText('Import from JSON')).toBeInTheDocument();
            });

            const input = document.querySelector('input[accept=".json"]');
            expect(input).toBeInTheDocument();
        });

        it('does nothing when no file selected', async () => {
            render(<SyncStatusIcon />);
            fireEvent.click(screen.getByLabelText(/Sync status/i));

            await waitFor(() => {
                expect(screen.getByText('Import from JSON')).toBeInTheDocument();
            });

            const input = document.querySelector('input[accept=".json"]') as HTMLInputElement;
            fireEvent.change(input, { target: { files: [] } });

            expect(mockStore.importNotes).not.toHaveBeenCalled();
        });
    });

    describe('Jupyter Notebook import', () => {
        it('shows import Jupyter Notebook option', () => {
            render(<SyncStatusIcon />);
            fireEvent.click(screen.getByLabelText(/Sync status/i));
            expect(screen.getByText('Import Jupyter Notebook')).toBeInTheDocument();
        });

        it('handles Jupyter Notebook import', async () => {
            const mockFile = new File(['{}'], 'notebook.ipynb', { type: 'application/json' });
            const mockNotebook = { cells: [] };
            const mockNote = { id: 'new-note', title: 'notebook', content: '' };

            (parseIpynb as ReturnType<typeof vi.fn>).mockResolvedValue(mockNotebook);
            (convertIpynbToNote as ReturnType<typeof vi.fn>).mockReturnValue(mockNote);

            const { container } = render(<SyncStatusIcon />);

            fireEvent.click(screen.getByLabelText(/Sync status/i));

            const input = container.querySelector('input[accept=".ipynb"]');
            expect(input).toBeInTheDocument();

            if (input) {
                fireEvent.change(input, { target: { files: [mockFile] } });
            }

            await waitFor(() => {
                expect(parseIpynb).toHaveBeenCalledWith(mockFile);
                expect(convertIpynbToNote).toHaveBeenCalledWith(mockNotebook, 'notebook.ipynb');
                expect(mockStore.addNote).toHaveBeenCalledWith(mockNote);
                expect(showToast.success).toHaveBeenCalled();
            });
        });

        it('handles Jupyter Notebook import error', async () => {
            (parseIpynb as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Invalid notebook'));

            render(<SyncStatusIcon />);
            fireEvent.click(screen.getByLabelText(/Sync status/i));

            const input = document.querySelector('input[accept=".ipynb"]') as HTMLInputElement;
            const file = new File(['invalid'], 'bad.ipynb', { type: 'application/json' });

            fireEvent.change(input, { target: { files: [file] } });

            await waitFor(() => {
                expect(showToast.error).toHaveBeenCalled();
            });
        });

        it('does nothing when no notebook file selected', () => {
            render(<SyncStatusIcon />);
            fireEvent.click(screen.getByLabelText(/Sync status/i));

            const input = document.querySelector('input[accept=".ipynb"]') as HTMLInputElement;
            fireEvent.change(input, { target: { files: [] } });

            expect(parseIpynb).not.toHaveBeenCalled();
        });
    });

    describe('Markdown export/import', () => {
        it('shows export markdown option', () => {
            render(<SyncStatusIcon />);
            fireEvent.click(screen.getByLabelText(/Sync status/i));
            expect(screen.getByText('Export Current (Markdown)')).toBeInTheDocument();
        });

        it('shows import markdown option', () => {
            render(<SyncStatusIcon />);
            fireEvent.click(screen.getByLabelText(/Sync status/i));
            expect(screen.getByText('Import Markdown')).toBeInTheDocument();
        });

        it('imports markdown file', async () => {
            render(<SyncStatusIcon />);
            fireEvent.click(screen.getByLabelText(/Sync status/i));

            const input = document.querySelector('input[accept=".md,.markdown,.txt"]') as HTMLInputElement;
            expect(input).toBeInTheDocument();

            const file = new File(['# Test'], 'test.md', { type: 'text/markdown' });
            fireEvent.change(input, { target: { files: [file] } });

            expect(mockStore.importMarkdownNote).toHaveBeenCalledWith(file);
        });

        it('does nothing when no markdown file selected', () => {
            render(<SyncStatusIcon />);
            fireEvent.click(screen.getByLabelText(/Sync status/i));

            const input = document.querySelector('input[accept=".md,.markdown,.txt"]') as HTMLInputElement;
            fireEvent.change(input, { target: { files: [] } });

            expect(mockStore.importMarkdownNote).not.toHaveBeenCalled();
        });

        it('exports current note as markdown', async () => {
            const mockClick = vi.fn();
            const originalAppendChild = document.body.appendChild.bind(document.body);
            const originalRemoveChild = document.body.removeChild.bind(document.body);

            vi.spyOn(document.body, 'appendChild').mockImplementation((el) => {
                if ((el as HTMLElement).tagName === 'A') {
                    (el as HTMLAnchorElement).click = mockClick;
                }
                return originalAppendChild(el);
            });
            vi.spyOn(document.body, 'removeChild').mockImplementation((el) => {
                return originalRemoveChild(el);
            });

            render(<SyncStatusIcon />);
            fireEvent.click(screen.getByLabelText(/Sync status/i));

            const exportButton = screen.getByText('Export Current (Markdown)');
            fireEvent.click(exportButton);

            expect(mockClick).toHaveBeenCalled();
        });

        it('shows error when no active note for markdown export', async () => {
            mockStore = createMockStore({ activeNoteId: null });

            render(<SyncStatusIcon />);
            fireEvent.click(screen.getByLabelText(/Sync status/i));

            const exportButton = screen.getByText('Export Current (Markdown)').closest('button');
            expect(exportButton).toBeDisabled();
        });
    });

    describe('JSON import with file', () => {
        it('imports JSON file successfully', async () => {
            render(<SyncStatusIcon />);
            fireEvent.click(screen.getByLabelText(/Sync status/i));

            const input = document.querySelector('input[accept=".json"]') as HTMLInputElement;
            const file = new File(['{"notes":[]}'], 'notes.json', { type: 'application/json' });

            const originalFileReader = global.FileReader;
            // Create a simple mock that fires onload synchronously
            vi.stubGlobal('FileReader', class MockFileReader {
                result: string | null = null;
                onload: ((ev: ProgressEvent<FileReader>) => void) | null = null;
                readAsText(_blob: Blob) {
                    this.result = '{"notes":[]}';
                    if (this.onload) {
                        this.onload({ target: { result: this.result } } as unknown as ProgressEvent<FileReader>);
                    }
                }
            });

            fireEvent.change(input, { target: { files: [file] } });

            await waitFor(() => {
                expect(mockStore.importNotes).toHaveBeenCalledWith('{"notes":[]}');
            });

            vi.stubGlobal('FileReader', originalFileReader);
        });

        it('handles JSON import error', async () => {
            const originalFileReader = global.FileReader;

            vi.stubGlobal('FileReader', class MockFileReader {
                result: string | null = null;
                onload: ((ev: ProgressEvent<FileReader>) => void) | null = null;
                readAsText() {
                    this.result = 'invalid json';
                    if (this.onload) {
                        this.onload({ target: { result: this.result } } as unknown as ProgressEvent<FileReader>);
                    }
                }
            });

            mockStore.importNotes.mockImplementation(() => {
                throw new Error('Invalid JSON');
            });

            render(<SyncStatusIcon />);
            fireEvent.click(screen.getByLabelText(/Sync status/i));

            const input = document.querySelector('input[accept=".json"]') as HTMLInputElement;
            const file = new File(['invalid'], 'notes.json', { type: 'application/json' });

            fireEvent.change(input, { target: { files: [file] } });

            await waitFor(() => {
                expect(showToast.error).toHaveBeenCalled();
            });

            vi.stubGlobal('FileReader', originalFileReader);
        });
    });
});
