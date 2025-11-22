import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from './Header';
import { vi } from 'vitest';

// Mocks
vi.mock('../../store/notesStore', () => {
    const mockStore = {
        notes: [{ id: 'test-note', title: 'Test Note' }],
        addNote: vi.fn(),
        importNotes: vi.fn(),
        exportNotes: vi.fn(() => JSON.stringify([{ id: 'test-note' }])),
        activeNoteId: 'test-note',
        cloudExecutionEnabled: false,
        toggleCloudExecution: vi.fn(),
        darkModeEnabled: false,
        toggleDarkMode: vi.fn(),
        isSidebarOpen: true,
        toggleSidebar: vi.fn(),
        isCreatingSandbox: false,
        isTerminalOpen: false,
        toggleTerminal: vi.fn(),
    };
    return {
        useNotesStore: vi.fn((selector) => selector ? selector(mockStore) : mockStore),
        createNewNote: vi.fn(() => ({ id: 'new-note', title: 'New Note' })),
    };
});

vi.mock('../../utils/toast', () => ({
    showToast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

vi.mock('./Logo', () => ({
    Logo: () => <div data-testid="logo">Logo</div>,
}));

describe('Header Component', () => {
    const mockToggleMobileSidebar = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly', () => {
        render(<Header onToggleMobileSidebar={mockToggleMobileSidebar} />);
        expect(screen.getByText('Sandbooks')).toBeInTheDocument();
        expect(screen.getByTestId('logo')).toBeInTheDocument();
    });

    it('handles dark mode toggle', async () => {
        render(<Header onToggleMobileSidebar={mockToggleMobileSidebar} />);

        const darkModeButton = screen.getByTitle('Switch to dark mode');
        fireEvent.click(darkModeButton);

        const { useNotesStore } = await import('../../store/notesStore');
        expect(useNotesStore().toggleDarkMode).toHaveBeenCalled();
    });

    it('handles cloud execution toggle', async () => {
        render(<Header onToggleMobileSidebar={mockToggleMobileSidebar} />);

        const cloudButton = screen.getByTitle('Cloud execution disabled');
        fireEvent.click(cloudButton);

        const { useNotesStore } = await import('../../store/notesStore');
        expect(useNotesStore().toggleCloudExecution).toHaveBeenCalled();
    });

    it('handles new note creation', async () => {
        render(<Header onToggleMobileSidebar={mockToggleMobileSidebar} />);

        const newNoteButton = screen.getByTitle('New note (⌘N)');
        fireEvent.click(newNoteButton);

        const { useNotesStore } = await import('../../store/notesStore');
        expect(useNotesStore().addNote).toHaveBeenCalled();
    });

    it('handles sidebar toggle', async () => {
        render(<Header onToggleMobileSidebar={mockToggleMobileSidebar} />);

        const sidebarButton = screen.getByTitle('Hide sidebar (⌘B)');
        fireEvent.click(sidebarButton);

        const { useNotesStore } = await import('../../store/notesStore');
        expect(useNotesStore().toggleSidebar).toHaveBeenCalled();
    });

    it('handles mobile sidebar toggle', () => {
        render(<Header onToggleMobileSidebar={mockToggleMobileSidebar} />);

        const mobileSidebarButton = screen.getByLabelText('Toggle sidebar');
        fireEvent.click(mobileSidebarButton);

        expect(mockToggleMobileSidebar).toHaveBeenCalled();
    });

    it('handles export notes', async () => {
        global.URL.createObjectURL = vi.fn();
        global.URL.revokeObjectURL = vi.fn();

        render(<Header onToggleMobileSidebar={mockToggleMobileSidebar} />);

        const exportButton = screen.getByTitle('Export notes');
        fireEvent.click(exportButton);

        const { useNotesStore } = await import('../../store/notesStore');
        expect(useNotesStore().exportNotes).toHaveBeenCalled();
        expect(global.URL.createObjectURL).toHaveBeenCalled();
    });

    it('handles import notes', async () => {
        const { showToast } = await import('../../utils/toast');
        render(<Header onToggleMobileSidebar={mockToggleMobileSidebar} />);

        const importButton = screen.getByTitle('Import notes');
        fireEvent.click(importButton);

        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        const file = new File(['[]'], 'notes.json', { type: 'application/json' });

        Object.defineProperty(fileInput, 'files', {
            value: [file],
        });

        fireEvent.change(fileInput);

        // Wait for FileReader
        await new Promise(resolve => setTimeout(resolve, 100));

        const { useNotesStore } = await import('../../store/notesStore');
        expect(useNotesStore().importNotes).toHaveBeenCalled();
        expect(showToast.success).toHaveBeenCalledWith('Notes imported successfully!');
    });

    it('handles terminal toggle', async () => {
        render(<Header onToggleMobileSidebar={mockToggleMobileSidebar} />);

        const terminalButton = screen.getByTitle('Open terminal (Ctrl+`)');
        fireEvent.click(terminalButton);

        const { useNotesStore } = await import('../../store/notesStore');
        expect(useNotesStore().toggleTerminal).toHaveBeenCalled();
    });
});
