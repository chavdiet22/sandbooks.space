import { Editor } from '@tiptap/react';
import { Button } from '../ui/Button';
import { Tooltip } from '../ui/Tooltip';
import { FontControls } from './FontControls';
import { ColorPicker } from './ColorPicker';
import { useState, useEffect, useCallback, useRef, useReducer } from 'react';
import clsx from 'clsx';
import {
    LuBold, LuItalic, LuStrikethrough, LuUnderline, LuHighlighter,
    LuType, LuSuperscript, LuSubscript,
    LuAlignLeft, LuAlignCenter, LuAlignRight, LuAlignJustify,
    LuList, LuListOrdered, LuSquareCheck,
    LuLink, LuTable, LuImage, LuCode,
    LuChevronDown
} from 'react-icons/lu';

const TOOLBAR_EXPANDED_KEY = 'sandbooks-toolbar-expanded';

interface EditorToolbarProps {
    editor: Editor;
    onAddImage: () => void;
    onLinkClick: () => void;
}

// Reusable toolbar button with compact styling
const ToolbarButton = ({
    isActive,
    onClick,
    icon: Icon,
    tooltip,
    shortcut,
    ariaLabel
}: {
    isActive?: boolean;
    onClick: () => void;
    icon: React.ElementType;
    tooltip: string;
    shortcut?: string;
    ariaLabel: string;
}) => (
    <Tooltip content={tooltip} shortcut={shortcut}>
        <Button
            variant={isActive ? 'default' : 'ghost'}
            size="icon-sm"
            onClick={onClick}
            aria-label={ariaLabel}
            className="flex-shrink-0"
        >
            <Icon className="w-3.5 h-3.5" />
        </Button>
    </Tooltip>
);

// Separator component
const Separator = () => (
    <div className="w-px h-4 bg-stone-200 dark:bg-stone-700 mx-0.5 flex-shrink-0" />
);

// Helper to check if selection is inside an executableCodeBlock
// editor.isActive() doesn't work reliably for atom nodes
const isInCodeBlock = (editor: Editor): boolean => {
    const { selection } = editor.state;
    const { $from } = selection;

    // Check if any ancestor is an executableCodeBlock
    for (let depth = $from.depth; depth >= 0; depth--) {
        if ($from.node(depth).type.name === 'executableCodeBlock') {
            return true;
        }
    }

    // For NodeSelection (when the whole code block is selected)
    // Cast to check for node property (exists on NodeSelection)
    const nodeSelection = selection as { node?: { type: { name: string } } };
    if (nodeSelection.node?.type.name === 'executableCodeBlock') {
        return true;
    }

    return false;
};

export const EditorToolbar = ({ editor, onAddImage, onLinkClick }: EditorToolbarProps) => {
    // Force re-render when editor state changes (selection, formatting, etc.)
    // This is needed because editor.isActive() returns stale values otherwise
    const [, forceUpdate] = useReducer(x => x + 1, 0);

    const [showFontControls, setShowFontControls] = useState(false);
    const [fontAnchorElement, setFontAnchorElement] = useState<HTMLElement | null>(null);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [colorAnchor, setColorAnchor] = useState<HTMLElement | null>(null);
    const [colorMode, setColorMode] = useState<'text' | 'highlight'>('text');
    // Suppress TS6133 for color picker state (used in ColorPicker component)
    void setColorAnchor;
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [showLeftFade, setShowLeftFade] = useState(false);
    const [showRightFade, setShowRightFade] = useState(false);

    // Subscribe to editor state changes to keep toolbar buttons in sync
    useEffect(() => {
        if (!editor) return;

        const handleUpdate = () => forceUpdate();

        editor.on('selectionUpdate', handleUpdate);
        editor.on('transaction', handleUpdate);

        return () => {
            editor.off('selectionUpdate', handleUpdate);
            editor.off('transaction', handleUpdate);
        };
    }, [editor]);

    // Collapsible toolbar state - only affects mobile view
    const [isExpanded, setIsExpanded] = useState(() => {
        if (typeof window === 'undefined') return true;
        return localStorage.getItem(TOOLBAR_EXPANDED_KEY) !== 'false';
    });

    // Persist preference
    useEffect(() => {
        localStorage.setItem(TOOLBAR_EXPANDED_KEY, String(isExpanded));
    }, [isExpanded]);

    const toggleExpanded = useCallback(() => {
        setIsExpanded(prev => !prev);
    }, []);

    // Check scroll position to show/hide fade indicators
    const updateFadeIndicators = useCallback(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const { scrollLeft, scrollWidth, clientWidth } = container;
        setShowLeftFade(scrollLeft > 4);
        setShowRightFade(scrollLeft < scrollWidth - clientWidth - 4);
    }, []);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        updateFadeIndicators();
        container.addEventListener('scroll', updateFadeIndicators);
        window.addEventListener('resize', updateFadeIndicators);

        return () => {
            container.removeEventListener('scroll', updateFadeIndicators);
            window.removeEventListener('resize', updateFadeIndicators);
        };
    }, [updateFadeIndicators]);

    return (
        <div
            role="toolbar"
            aria-label="Text formatting options"
            aria-orientation="horizontal"
            className="flex-shrink-0 border-b border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 z-10"
        >
            {/* Mobile: Compact collapsible toolbar */}
            <div className="md:hidden">
                {/* Primary row - always visible */}
                <div className="flex items-center justify-between px-2 py-1.5 gap-1">
                    <div className="flex items-center gap-0.5">
                        <ToolbarButton
                            isActive={editor.isActive('bold')}
                            onClick={() => editor.chain().focus().toggleBold().run()}
                            icon={LuBold}
                            tooltip="Bold"
                            shortcut="⌘B"
                            ariaLabel="Bold"
                        />
                        <ToolbarButton
                            isActive={editor.isActive('italic')}
                            onClick={() => editor.chain().focus().toggleItalic().run()}
                            icon={LuItalic}
                            tooltip="Italic"
                            shortcut="⌘I"
                            ariaLabel="Italic"
                        />
                        <ToolbarButton
                            isActive={isInCodeBlock(editor)}
                            onClick={() => editor.chain().focus().setExecutableCodeBlock().run()}
                            icon={LuCode}
                            tooltip="Code Block"
                            shortcut="⌘⌥C"
                            ariaLabel="Insert Code Block"
                        />
                        <ToolbarButton
                            isActive={editor.isActive('link')}
                            onClick={onLinkClick}
                            icon={LuLink}
                            tooltip="Link"
                            shortcut="⌘K"
                            ariaLabel="Insert Link"
                        />
                        <ToolbarButton
                            isActive={editor.isActive('bulletList')}
                            onClick={() => editor.chain().focus().toggleBulletList().run()}
                            icon={LuList}
                            tooltip="List"
                            ariaLabel="Bullet List"
                        />
                    </div>

                    <Tooltip content={isExpanded ? 'Less' : 'More'}>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={toggleExpanded}
                            aria-label={isExpanded ? 'Collapse toolbar' : 'Expand toolbar'}
                            aria-expanded={isExpanded}
                            className={clsx(
                                'transition-all duration-200',
                                isExpanded && 'bg-stone-200 dark:bg-stone-700 rotate-180'
                            )}
                        >
                            <LuChevronDown className="w-3.5 h-3.5" />
                        </Button>
                    </Tooltip>
                </div>

                {/* Expandable section */}
                <div
                    className={clsx(
                        'overflow-hidden transition-all duration-200 ease-out',
                        isExpanded ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'
                    )}
                >
                    <div className="px-2 pb-1.5">
                        <div className="flex items-center gap-0.5 overflow-x-auto no-scrollbar py-0.5">
                            <ToolbarButton
                                isActive={editor.isActive('strike')}
                                onClick={() => editor.chain().focus().toggleStrike().run()}
                                icon={LuStrikethrough}
                                tooltip="Strikethrough"
                                ariaLabel="Strikethrough"
                            />
                            <ToolbarButton
                                isActive={editor.isActive('underline')}
                                onClick={() => editor.chain().focus().toggleUnderline().run()}
                                icon={LuUnderline}
                                tooltip="Underline"
                                shortcut="⌘U"
                                ariaLabel="Underline"
                            />
                            <ToolbarButton
                                isActive={editor.isActive('highlight')}
                                onClick={() => editor.chain().focus().toggleHighlight().run()}
                                icon={LuHighlighter}
                                tooltip="Highlight"
                                ariaLabel="Highlight"
                            />
                            <Separator />
                            <Tooltip content="Font">
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    ref={(el) => setFontAnchorElement(el)}
                                    onClick={() => setShowFontControls(!showFontControls)}
                                    aria-label="Font"
                                    className="flex-shrink-0"
                                >
                                    <LuType className="w-3.5 h-3.5" />
                                </Button>
                            </Tooltip>
                            <ToolbarButton
                                isActive={editor.isActive('superscript')}
                                onClick={() => editor.chain().focus().toggleSuperscript().run()}
                                icon={LuSuperscript}
                                tooltip="Superscript"
                                ariaLabel="Superscript"
                            />
                            <ToolbarButton
                                isActive={editor.isActive('subscript')}
                                onClick={() => editor.chain().focus().toggleSubscript().run()}
                                icon={LuSubscript}
                                tooltip="Subscript"
                                ariaLabel="Subscript"
                            />
                            <Separator />
                            <ToolbarButton
                                isActive={editor.isActive({ textAlign: 'left' })}
                                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                                icon={LuAlignLeft}
                                tooltip="Align Left"
                                ariaLabel="Align Left"
                            />
                            <ToolbarButton
                                isActive={editor.isActive({ textAlign: 'center' })}
                                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                                icon={LuAlignCenter}
                                tooltip="Align Center"
                                ariaLabel="Align Center"
                            />
                            <ToolbarButton
                                isActive={editor.isActive({ textAlign: 'right' })}
                                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                                icon={LuAlignRight}
                                tooltip="Align Right"
                                ariaLabel="Align Right"
                            />
                            <ToolbarButton
                                isActive={editor.isActive({ textAlign: 'justify' })}
                                onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                                icon={LuAlignJustify}
                                tooltip="Justify"
                                ariaLabel="Justify"
                            />
                            <Separator />
                            <ToolbarButton
                                isActive={editor.isActive('orderedList')}
                                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                                icon={LuListOrdered}
                                tooltip="Numbered List"
                                ariaLabel="Numbered List"
                            />
                            <ToolbarButton
                                isActive={editor.isActive('taskList')}
                                onClick={() => editor.chain().focus().toggleTaskList().run()}
                                icon={LuSquareCheck}
                                tooltip="Task List"
                                ariaLabel="Task List"
                            />
                            <Separator />
                            <ToolbarButton
                                onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                                icon={LuTable}
                                tooltip="Table"
                                ariaLabel="Insert Table"
                            />
                            <ToolbarButton
                                onClick={onAddImage}
                                icon={LuImage}
                                tooltip="Image"
                                ariaLabel="Insert Image"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Desktop: Single horizontal scrollable row */}
            <div className="hidden md:block relative">
                {/* Left fade indicator */}
                <div
                    className={clsx(
                        'absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-stone-50 dark:from-stone-900 to-transparent pointer-events-none z-10 transition-opacity duration-150',
                        showLeftFade ? 'opacity-100' : 'opacity-0'
                    )}
                    aria-hidden="true"
                />

                {/* Right fade indicator */}
                <div
                    className={clsx(
                        'absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-stone-50 dark:from-stone-900 to-transparent pointer-events-none z-10 transition-opacity duration-150',
                        showRightFade ? 'opacity-100' : 'opacity-0'
                    )}
                    aria-hidden="true"
                />

                <div
                    ref={scrollContainerRef}
                    className="flex items-center gap-0.5 px-3 py-1.5 overflow-x-auto no-scrollbar"
                >
                    {/* Text Formatting */}
                    <ToolbarButton
                        isActive={editor.isActive('bold')}
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        icon={LuBold}
                        tooltip="Bold"
                        shortcut="⌘B"
                        ariaLabel="Bold"
                    />
                    <ToolbarButton
                        isActive={editor.isActive('italic')}
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        icon={LuItalic}
                        tooltip="Italic"
                        shortcut="⌘I"
                        ariaLabel="Italic"
                    />
                    <ToolbarButton
                        isActive={editor.isActive('strike')}
                        onClick={() => editor.chain().focus().toggleStrike().run()}
                        icon={LuStrikethrough}
                        tooltip="Strikethrough"
                        ariaLabel="Strikethrough"
                    />
                    <ToolbarButton
                        isActive={editor.isActive('underline')}
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                        icon={LuUnderline}
                        tooltip="Underline"
                        shortcut="⌘U"
                        ariaLabel="Underline"
                    />
                    <ToolbarButton
                        isActive={editor.isActive('highlight')}
                        onClick={() => editor.chain().focus().toggleHighlight().run()}
                        icon={LuHighlighter}
                        tooltip="Highlight"
                        ariaLabel="Highlight"
                    />

                    <Separator />

                    {/* Font */}
                    <Tooltip content="Font">
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            ref={(el) => setFontAnchorElement(el)}
                            onClick={() => setShowFontControls(!showFontControls)}
                            aria-label="Font"
                            className="flex-shrink-0"
                        >
                            <LuType className="w-3.5 h-3.5" />
                        </Button>
                    </Tooltip>
                    <ToolbarButton
                        isActive={editor.isActive('superscript')}
                        onClick={() => editor.chain().focus().toggleSuperscript().run()}
                        icon={LuSuperscript}
                        tooltip="Superscript"
                        shortcut="⌘⇧="
                        ariaLabel="Superscript"
                    />
                    <ToolbarButton
                        isActive={editor.isActive('subscript')}
                        onClick={() => editor.chain().focus().toggleSubscript().run()}
                        icon={LuSubscript}
                        tooltip="Subscript"
                        shortcut="⌘⇧-"
                        ariaLabel="Subscript"
                    />

                    <Separator />

                    {/* Alignment */}
                    <ToolbarButton
                        isActive={editor.isActive({ textAlign: 'left' })}
                        onClick={() => editor.chain().focus().setTextAlign('left').run()}
                        icon={LuAlignLeft}
                        tooltip="Align Left"
                        ariaLabel="Align Left"
                    />
                    <ToolbarButton
                        isActive={editor.isActive({ textAlign: 'center' })}
                        onClick={() => editor.chain().focus().setTextAlign('center').run()}
                        icon={LuAlignCenter}
                        tooltip="Align Center"
                        ariaLabel="Align Center"
                    />
                    <ToolbarButton
                        isActive={editor.isActive({ textAlign: 'right' })}
                        onClick={() => editor.chain().focus().setTextAlign('right').run()}
                        icon={LuAlignRight}
                        tooltip="Align Right"
                        ariaLabel="Align Right"
                    />
                    <ToolbarButton
                        isActive={editor.isActive({ textAlign: 'justify' })}
                        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                        icon={LuAlignJustify}
                        tooltip="Justify"
                        ariaLabel="Justify"
                    />

                    <Separator />

                    {/* Lists */}
                    <ToolbarButton
                        isActive={editor.isActive('bulletList')}
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        icon={LuList}
                        tooltip="Bullet List"
                        ariaLabel="Bullet List"
                    />
                    <ToolbarButton
                        isActive={editor.isActive('orderedList')}
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        icon={LuListOrdered}
                        tooltip="Numbered List"
                        ariaLabel="Numbered List"
                    />
                    <ToolbarButton
                        isActive={editor.isActive('taskList')}
                        onClick={() => editor.chain().focus().toggleTaskList().run()}
                        icon={LuSquareCheck}
                        tooltip="Task List"
                        ariaLabel="Task List"
                    />

                    <Separator />

                    {/* Insert */}
                    <ToolbarButton
                        isActive={editor.isActive('link')}
                        onClick={onLinkClick}
                        icon={LuLink}
                        tooltip="Insert Link"
                        shortcut="⌘K"
                        ariaLabel="Insert Link"
                    />
                    <ToolbarButton
                        isActive={isInCodeBlock(editor)}
                        onClick={() => editor.chain().focus().setExecutableCodeBlock().run()}
                        icon={LuCode}
                        tooltip="Insert Code Block"
                        shortcut="⌘⌥C"
                        ariaLabel="Insert Code Block"
                    />
                    <ToolbarButton
                        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                        icon={LuTable}
                        tooltip="Insert Table"
                        ariaLabel="Insert Table"
                    />
                    <ToolbarButton
                        onClick={onAddImage}
                        icon={LuImage}
                        tooltip="Insert Image"
                        ariaLabel="Insert Image"
                    />
                </div>
            </div>

            {/* Popovers */}
            {showFontControls && fontAnchorElement && (
                <FontControls
                    editor={editor}
                    onClose={() => setShowFontControls(false)}
                    anchorElement={fontAnchorElement}
                />
            )}

            {showColorPicker && colorAnchor && (
                <ColorPicker
                    editor={editor}
                    onClose={() => setShowColorPicker(false)}
                    anchorElement={colorAnchor}
                    mode={colorMode}
                    onModeChange={setColorMode}
                />
            )}
        </div>
    );
};
