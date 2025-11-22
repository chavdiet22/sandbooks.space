import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExecutableCodeBlockComponent } from './ExecutableCodeBlock';
import type { NodeViewProps } from '@tiptap/react';
import { vi } from 'vitest';
import { hopxService } from '../../services/hopx';

// Mocks
vi.mock('@tiptap/react', () => ({
    NodeViewWrapper: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../../services/hopx', () => ({
    hopxService: {
        executeCode: vi.fn(),
    },
}));

vi.mock('../../store/notesStore', () => {
    const mockStore = {
        cloudExecutionEnabled: true,
        sandboxStatus: 'healthy',
        recreateSandbox: vi.fn(),
        setSandboxStatus: vi.fn(),
        autoHealSandbox: vi.fn(),
        activeNoteId: 'test-note',
        darkModeEnabled: false,
    };
    return {
        useNotesStore: vi.fn((selector) => selector ? selector(mockStore) : mockStore),
    };
});

vi.mock('../../utils/toast', () => ({
    showToast: {
        success: vi.fn(),
        error: vi.fn(),
        loading: vi.fn(),
    },
}));

vi.mock('./CodeMirrorEditor', () => ({
    CodeMirrorEditor: () => <div data-testid="codemirror-editor">Editor</div>,
}));

describe('ExecutableCodeBlockComponent', () => {
    const mockUpdateAttributes = vi.fn();
    const mockNode = {
        attrs: {
            language: 'python',
            code: 'print("hello")',
            executionResult: undefined,
        },
        textContent: 'print("hello")',
    } as unknown as NodeViewProps['node'];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly', () => {
        render(
            <ExecutableCodeBlockComponent
                node={mockNode}
                updateAttributes={mockUpdateAttributes}
                selected={false}
                extension={{} as NodeViewProps['extension']}
                getPos={() => 0}
                editor={{} as NodeViewProps['editor']}
                deleteNode={vi.fn()}
                decorations={[] as unknown as NodeViewProps['decorations']}
                view={{} as unknown as NodeViewProps['view']}
                innerDecorations={[] as unknown as NodeViewProps['innerDecorations']}
                HTMLAttributes={{}}
            />
        );

        expect(screen.getByText('python')).toBeInTheDocument();
        expect(screen.getByLabelText('Run code')).toBeInTheDocument();
        expect(screen.getByTestId('codemirror-editor')).toBeInTheDocument();
    });

    it('handles run button click', async () => {
        render(
            <ExecutableCodeBlockComponent
                node={mockNode}
                updateAttributes={mockUpdateAttributes}
                selected={false}
                extension={{} as NodeViewProps['extension']}
                getPos={() => 0}
                editor={{} as NodeViewProps['editor']}
                deleteNode={vi.fn()}
                decorations={[] as unknown as NodeViewProps['decorations']}
                view={{} as unknown as NodeViewProps['view']}
                innerDecorations={[] as unknown as NodeViewProps['innerDecorations']}
                HTMLAttributes={{}}
            />
        );

        const runButton = screen.getByLabelText('Run code');
        fireEvent.click(runButton);

        await waitFor(() => {
            expect(mockUpdateAttributes).toHaveBeenCalledWith(expect.objectContaining({ isExecuting: true }));
        });
    });

    it('shows execution result', () => {
        const resultNode = {
            ...mockNode,
            attrs: {
                ...mockNode.attrs,
                executionResult: {
                    stdout: 'Hello World',
                    executionTime: 100,
                },
            },
        };

        render(
            <ExecutableCodeBlockComponent
                node={resultNode}
                updateAttributes={mockUpdateAttributes}
                selected={false}
                extension={{} as NodeViewProps['extension']}
                getPos={() => 0}
                editor={{} as NodeViewProps['editor']}
                deleteNode={vi.fn()}
                decorations={[] as unknown as NodeViewProps['decorations']}
                view={{} as unknown as NodeViewProps['view']}
                innerDecorations={[] as unknown as NodeViewProps['innerDecorations']}
                HTMLAttributes={{}}
            />
        );

        expect(screen.getByText('Hello World')).toBeInTheDocument();
        expect(screen.getByText('Executed in 100ms')).toBeInTheDocument();
    });

    it('handles language change', () => {
        render(
            <ExecutableCodeBlockComponent
                node={mockNode}
                updateAttributes={mockUpdateAttributes}
                selected={false}
                extension={{} as NodeViewProps['extension']}
                getPos={() => 0}
                editor={{} as NodeViewProps['editor']}
                deleteNode={vi.fn()}
                decorations={[] as unknown as NodeViewProps['decorations']}
                view={{} as unknown as NodeViewProps['view']}
                innerDecorations={[] as unknown as NodeViewProps['innerDecorations']}
                HTMLAttributes={{}}
            />
        );

        const select = screen.getByLabelText('Select programming language');
        fireEvent.change(select, { target: { value: 'javascript' } });

        expect(mockUpdateAttributes).toHaveBeenCalledWith({ language: 'javascript' });
    });

    it('handles clear output', () => {
        const resultNode = {
            ...mockNode,
            attrs: {
                ...mockNode.attrs,
                executionResult: { stdout: 'Output' },
            },
        };

        render(
            <ExecutableCodeBlockComponent
                node={resultNode}
                updateAttributes={mockUpdateAttributes}
                selected={false}
                extension={{} as NodeViewProps['extension']}
                getPos={() => 0}
                editor={{} as NodeViewProps['editor']}
                deleteNode={vi.fn()}
                decorations={[] as unknown as NodeViewProps['decorations']}
                view={{} as unknown as NodeViewProps['view']}
                innerDecorations={[] as unknown as NodeViewProps['innerDecorations']}
                HTMLAttributes={{}}
            />
        );

        const clearButton = screen.getByLabelText('Clear output');
        fireEvent.click(clearButton);

        expect(mockUpdateAttributes).toHaveBeenCalledWith({ executionResult: undefined });
    });

    it('handles execution error', async () => {
        (hopxService.executeCode as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Execution failed'));

        render(
            <ExecutableCodeBlockComponent
                node={mockNode}
                updateAttributes={mockUpdateAttributes}
                selected={false}
                extension={{} as NodeViewProps['extension']}
                getPos={() => 0}
                editor={{} as NodeViewProps['editor']}
                deleteNode={vi.fn()}
                decorations={[]}
                view={{} as unknown as NodeViewProps['view']}
                innerDecorations={[]}
                HTMLAttributes={{}}
            />
        );

        const runButton = screen.getByLabelText('Run code');
        fireEvent.click(runButton);

        await waitFor(() => {
            expect(mockUpdateAttributes).toHaveBeenCalledWith(expect.objectContaining({
                executionResult: expect.objectContaining({
                    error: 'Execution failed',
                    sandboxStatus: 'unhealthy',
                }),
            }));
        });
    });
});
