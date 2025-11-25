import { Editor } from '@tiptap/react';
import { Button } from '../ui/Button';
import { Tooltip } from '../ui/Tooltip';
import { FontControls } from './FontControls';
import { ColorPicker } from './ColorPicker';
import { useState } from 'react';

interface EditorToolbarProps {
    editor: Editor;
    onAddImage: () => void;
    onLinkClick: () => void;
}

export const EditorToolbar = ({ editor, onAddImage, onLinkClick }: EditorToolbarProps) => {
    const [showFontControls, setShowFontControls] = useState(false);
    const [fontAnchorElement, setFontAnchorElement] = useState<HTMLElement | null>(null);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [colorAnchor, setColorAnchor] = useState<HTMLElement | null>(null);
    const [colorMode, setColorMode] = useState<'text' | 'highlight'>('text');

    return (
        <div className="flex-shrink-0 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-4 py-3 z-10 overflow-x-auto no-scrollbar">
            <div className="max-w-4xl mx-auto w-full flex items-center gap-1 flex-nowrap md:flex-wrap min-w-max md:min-w-0">
                {/* Text Formatting Group */}
                <div className="flex items-center gap-0.5 bg-stone-100 dark:bg-stone-800/50 p-1 rounded-lg">
                    <Tooltip content="Bold" shortcut="⌘B">
                        <Button
                            variant={editor.isActive('bold') ? 'default' : 'ghost'}
                            size="icon"
                            onClick={() => editor.chain().focus().toggleBold().run()}
                            aria-label="Bold"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
                            </svg>
                        </Button>
                    </Tooltip>

                    <Tooltip content="Italic" shortcut="⌘I">
                        <Button
                            variant={editor.isActive('italic') ? 'default' : 'ghost'}
                            size="icon"
                            onClick={() => editor.chain().focus().toggleItalic().run()}
                            aria-label="Italic"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <line x1="19" y1="4" x2="10" y2="4" strokeWidth={2} strokeLinecap="round" />
                                <line x1="14" y1="20" x2="5" y2="20" strokeWidth={2} strokeLinecap="round" />
                                <line x1="15" y1="4" x2="9" y2="20" strokeWidth={2} strokeLinecap="round" />
                            </svg>
                        </Button>
                    </Tooltip>

                    <Tooltip content="Strikethrough">
                        <Button
                            variant={editor.isActive('strike') ? 'default' : 'ghost'}
                            size="icon"
                            onClick={() => editor.chain().focus().toggleStrike().run()}
                            aria-label="Strikethrough"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h18M9 5l6 14M15 5l-6 14" />
                            </svg>
                        </Button>
                    </Tooltip>

                    <Tooltip content="Underline" shortcut="⌘U">
                        <Button
                            variant={editor.isActive('underline') ? 'default' : 'ghost'}
                            size="icon"
                            onClick={() => editor.chain().focus().toggleUnderline().run()}
                            aria-label="Underline"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19h14M5 5h14" />
                            </svg>
                        </Button>
                    </Tooltip>

                    <Tooltip content="Highlight">
                        <Button
                            variant={editor.isActive('highlight') ? 'default' : 'ghost'}
                            size="icon"
                            onClick={() => editor.chain().focus().toggleHighlight().run()}
                            aria-label="Highlight"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10M12 3v18M3 12l9-9 9 9" />
                            </svg>
                        </Button>
                    </Tooltip>

                    <Tooltip content="Color">
                        <Button
                            variant={editor.isActive('textStyle') || editor.isActive('highlight') ? 'default' : 'ghost'}
                            size="icon"
                            onClick={(e) => {
                                setColorAnchor(e.currentTarget);
                                setShowColorPicker(true);
                            }}
                            aria-label="Color"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                            </svg>
                        </Button>
                    </Tooltip>
                </div>

                <div className="w-px h-6 bg-stone-200 dark:bg-stone-800 mx-2" />

                {/* Font Group */}
                <div className="flex items-center gap-0.5 bg-stone-100 dark:bg-stone-800/50 p-1 rounded-lg">
                    <Tooltip content="Font">
                        <Button
                            variant="ghost"
                            size="icon"
                            ref={(el) => setFontAnchorElement(el)}
                            onClick={() => setShowFontControls(!showFontControls)}
                            aria-label="Font"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </Button>
                    </Tooltip>
                </div>

                <div className="w-px h-6 bg-stone-200 dark:bg-stone-800 mx-2" />

                {/* Superscript/Subscript Group */}
                <div className="flex items-center gap-0.5 bg-stone-100 dark:bg-stone-800/50 p-1 rounded-lg">
                    <Tooltip content="Superscript" shortcut="⌘⇧=">
                        <Button
                            variant={editor.isActive('superscript') ? 'default' : 'ghost'}
                            size="icon"
                            onClick={() => editor.chain().focus().toggleSuperscript().run()}
                            aria-label="Superscript"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <text x="4" y="16" fontSize="12" fontWeight="bold" fill="currentColor">x²</text>
                            </svg>
                        </Button>
                    </Tooltip>

                    <Tooltip content="Subscript" shortcut="⌘⇧-">
                        <Button
                            variant={editor.isActive('subscript') ? 'default' : 'ghost'}
                            size="icon"
                            onClick={() => editor.chain().focus().toggleSubscript().run()}
                            aria-label="Subscript"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <text x="4" y="18" fontSize="12" fontWeight="bold" fill="currentColor">x₂</text>
                            </svg>
                        </Button>
                    </Tooltip>
                </div>

                <div className="w-px h-6 bg-stone-200 dark:bg-stone-800 mx-2" />

                {/* Alignment Group */}
                <div className="flex items-center gap-0.5 bg-stone-100 dark:bg-stone-800/50 p-1 rounded-lg">
                    <Tooltip content="Align Left">
                        <Button
                            variant={editor.isActive({ textAlign: 'left' }) ? 'default' : 'ghost'}
                            size="icon"
                            onClick={() => editor.chain().focus().setTextAlign('left').run()}
                            aria-label="Align Left"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 6h18M3 14h18M3 18h18" />
                            </svg>
                        </Button>
                    </Tooltip>

                    <Tooltip content="Align Center">
                        <Button
                            variant={editor.isActive({ textAlign: 'center' }) ? 'default' : 'ghost'}
                            size="icon"
                            onClick={() => editor.chain().focus().setTextAlign('center').run()}
                            aria-label="Align Center"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M6 6h12M6 14h12M3 18h18" />
                            </svg>
                        </Button>
                    </Tooltip>

                    <Tooltip content="Align Right">
                        <Button
                            variant={editor.isActive({ textAlign: 'right' }) ? 'default' : 'ghost'}
                            size="icon"
                            onClick={() => editor.chain().focus().setTextAlign('right').run()}
                            aria-label="Align Right"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 6h18M3 14h18M3 18h18" />
                            </svg>
                        </Button>
                    </Tooltip>

                    <Tooltip content="Justify">
                        <Button
                            variant={editor.isActive({ textAlign: 'justify' }) ? 'default' : 'ghost'}
                            size="icon"
                            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                            aria-label="Justify"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 6h18M3 14h18M3 18h18" />
                            </svg>
                        </Button>
                    </Tooltip>
                </div>

                <div className="w-px h-6 bg-stone-200 dark:bg-stone-800 mx-2" />

                {/* Lists Group */}
                <div className="flex items-center gap-0.5 bg-stone-100 dark:bg-stone-800/50 p-1 rounded-lg">
                    <Tooltip content="Bullet List">
                        <Button
                            variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
                            size="icon"
                            onClick={() => editor.chain().focus().toggleBulletList().run()}
                            aria-label="Bullet List"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <line x1="8" y1="6" x2="21" y2="6" strokeWidth={2} strokeLinecap="round" />
                                <line x1="8" y1="12" x2="21" y2="12" strokeWidth={2} strokeLinecap="round" />
                                <line x1="8" y1="18" x2="21" y2="18" strokeWidth={2} strokeLinecap="round" />
                                <circle cx="4" cy="6" r="1" fill="currentColor" />
                                <circle cx="4" cy="12" r="1" fill="currentColor" />
                                <circle cx="4" cy="18" r="1" fill="currentColor" />
                            </svg>
                        </Button>
                    </Tooltip>

                    <Tooltip content="Numbered List">
                        <Button
                            variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
                            size="icon"
                            onClick={() => editor.chain().focus().toggleOrderedList().run()}
                            aria-label="Numbered List"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <line x1="10" y1="6" x2="21" y2="6" strokeWidth={2} strokeLinecap="round" />
                                <line x1="10" y1="12" x2="21" y2="12" strokeWidth={2} strokeLinecap="round" />
                                <line x1="10" y1="18" x2="21" y2="18" strokeWidth={2} strokeLinecap="round" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h1v4M4 18h2v-4H4" />
                            </svg>
                        </Button>
                    </Tooltip>

                    <Tooltip content="Task List">
                        <Button
                            variant={editor.isActive('taskList') ? 'default' : 'ghost'}
                            size="icon"
                            onClick={() => editor.chain().focus().toggleTaskList().run()}
                            aria-label="Task List"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                        </Button>
                    </Tooltip>
                </div>

                <div className="w-px h-6 bg-stone-200 dark:bg-stone-800 mx-2" />

                {/* Insert Group */}
                <div className="flex items-center gap-0.5 bg-stone-100 dark:bg-stone-800/50 p-1 rounded-lg">
                    <Tooltip content="Insert Link" shortcut="⌘K">
                        <Button
                            variant={editor.isActive('link') ? 'default' : 'ghost'}
                            size="icon"
                            onClick={onLinkClick}
                            aria-label="Insert Link"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                        </Button>
                    </Tooltip>

                    <Tooltip content="Insert Table">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                            aria-label="Insert Table"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </Button>
                    </Tooltip>

                    <Tooltip content="Insert Image">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onAddImage}
                            aria-label="Insert Image"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </Button>
                    </Tooltip>
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
