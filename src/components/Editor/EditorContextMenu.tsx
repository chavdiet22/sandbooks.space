import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, m } from 'framer-motion';
import clsx from 'clsx';
import type { Editor } from '@tiptap/core';
import { LuCopy, LuClipboard, LuScissors, LuTrash2 } from 'react-icons/lu';
import { contextMenuVariants, staggerContainerVariants, staggerItemVariants } from '../../utils/animationVariants';

interface EditorContextMenuProps {
  editor: Editor;
}

interface MenuPosition {
  x: number;
  y: number;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  disabled?: boolean;
  onClick: () => void;
}

// Long-press duration for mobile touch (ms)
const LONG_PRESS_DURATION = 500;

/**
 * Context menu for the editor with cut/copy/paste functionality
 * Works on both desktop (right-click) and mobile (long-press)
 */
export const EditorContextMenu: React.FC<EditorContextMenuProps> = ({ editor }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<MenuPosition>({ x: 0, y: 0 });
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Touch handling refs
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
    setFocusedIndex(-1);
  }, []);

  const openMenuAt = useCallback((x: number, y: number) => {
    setPosition({ x, y });
    setIsOpen(true);
  }, []);

  // Check if there's selected text
  const hasSelection = useCallback(() => {
    const { from, to } = editor.state.selection;
    return from !== to;
  }, [editor]);

  // Copy selected text
  const handleCopy = useCallback(async () => {
    closeMenu();
    if (!hasSelection()) return;

    try {
      // Get selection as HTML for rich paste and text for plain paste
      const { from, to } = editor.state.selection;
      const slice = editor.state.doc.slice(from, to);
      const text = slice.content.textBetween(0, slice.content.size, '\n');

      // Try to copy to clipboard
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [editor, closeMenu, hasSelection]);

  // Cut selected text
  const handleCut = useCallback(async () => {
    await handleCopy();
    if (hasSelection()) {
      editor.commands.deleteSelection();
    }
  }, [editor, handleCopy, hasSelection]);

  // Paste from clipboard
  const handlePaste = useCallback(async () => {
    closeMenu();
    try {
      let text = '';

      if (navigator.clipboard?.readText) {
        text = await navigator.clipboard.readText();
      } else {
        // Fallback - create a temporary input to trigger paste
        const textArea = document.createElement('textarea');
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        document.execCommand('paste');
        text = textArea.value;
        document.body.removeChild(textArea);
      }

      if (text) {
        editor.commands.insertContent(text);
      }
    } catch (err) {
      console.error('Failed to paste:', err);
      // If clipboard API fails due to permissions, show a message
      // The user can still use keyboard shortcuts
    }
  }, [editor, closeMenu]);

  // Delete selected text
  const handleDelete = useCallback(() => {
    closeMenu();
    if (hasSelection()) {
      editor.commands.deleteSelection();
    }
  }, [editor, closeMenu, hasSelection]);

  // Build menu items based on current state - memoized to avoid unnecessary re-renders
  const menuItems: MenuItem[] = useMemo(() => [
    {
      id: 'cut',
      label: 'Cut',
      icon: <LuScissors className="w-4 h-4" />,
      shortcut: '\u2318X',
      disabled: !hasSelection(),
      onClick: handleCut,
    },
    {
      id: 'copy',
      label: 'Copy',
      icon: <LuCopy className="w-4 h-4" />,
      shortcut: '\u2318C',
      disabled: !hasSelection(),
      onClick: handleCopy,
    },
    {
      id: 'paste',
      label: 'Paste',
      icon: <LuClipboard className="w-4 h-4" />,
      shortcut: '\u2318V',
      onClick: handlePaste,
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: <LuTrash2 className="w-4 h-4" />,
      disabled: !hasSelection(),
      onClick: handleDelete,
    },
  ], [hasSelection, handleCut, handleCopy, handlePaste, handleDelete]);

  // Handle right-click
  const handleContextMenu = useCallback((e: MouseEvent) => {
    // Only handle if click is inside editor
    const editorElement = editor.view.dom;
    if (!editorElement.contains(e.target as Node)) return;

    e.preventDefault();
    e.stopPropagation();
    openMenuAt(e.clientX, e.clientY);
  }, [editor, openMenuAt]);

  // Touch handlers for mobile long-press
  const handleTouchStart = useCallback((e: TouchEvent) => {
    const editorElement = editor.view.dom;
    if (!editorElement.contains(e.target as Node)) return;
    if (e.touches.length !== 1) return;

    const touch = e.touches[0];
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };

    longPressTimerRef.current = setTimeout(() => {
      if (touchStartPosRef.current) {
        e.preventDefault();
        openMenuAt(touchStartPosRef.current.x, touchStartPosRef.current.y);
        touchStartPosRef.current = null;
      }
    }, LONG_PRESS_DURATION);
  }, [editor, openMenuAt]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!touchStartPosRef.current || e.touches.length !== 1) return;

    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartPosRef.current.x);
    const dy = Math.abs(touch.clientY - touchStartPosRef.current.y);

    if (dx > 10 || dy > 10) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      touchStartPosRef.current = null;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    touchStartPosRef.current = null;
  }, []);

  // Register event listeners
  useEffect(() => {
    const editorElement = editor.view.dom;

    editorElement.addEventListener('contextmenu', handleContextMenu);
    editorElement.addEventListener('touchstart', handleTouchStart, { passive: false });
    editorElement.addEventListener('touchmove', handleTouchMove);
    editorElement.addEventListener('touchend', handleTouchEnd);
    editorElement.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      editorElement.removeEventListener('contextmenu', handleContextMenu);
      editorElement.removeEventListener('touchstart', handleTouchStart);
      editorElement.removeEventListener('touchmove', handleTouchMove);
      editorElement.removeEventListener('touchend', handleTouchEnd);
      editorElement.removeEventListener('touchcancel', handleTouchEnd);

      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, [editor, handleContextMenu, handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Adjust position to keep menu in viewport
  useEffect(() => {
    if (isOpen && menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
      };

      let adjustedX = position.x;
      let adjustedY = position.y;

      if (position.x + rect.width > viewport.width - 8) {
        adjustedX = viewport.width - rect.width - 8;
      }
      if (position.y + rect.height > viewport.height - 8) {
        adjustedY = viewport.height - rect.height - 8;
      }

      if (adjustedX !== position.x || adjustedY !== position.y) {
        setPosition({ x: adjustedX, y: adjustedY });
      }
    }
  }, [isOpen, position.x, position.y]);

  // Close on click outside and keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const enabledIndices = menuItems
        .map((item, idx) => (!item.disabled ? idx : -1))
        .filter(idx => idx !== -1);

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          closeMenu();
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (enabledIndices.length === 0) return;
          setFocusedIndex(prev => {
            const currentIdx = enabledIndices.indexOf(prev);
            const nextIdx = currentIdx < enabledIndices.length - 1 ? currentIdx + 1 : 0;
            return enabledIndices[nextIdx];
          });
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (enabledIndices.length === 0) return;
          setFocusedIndex(prev => {
            const currentIdx = enabledIndices.indexOf(prev);
            const prevIdx = currentIdx > 0 ? currentIdx - 1 : enabledIndices.length - 1;
            return enabledIndices[prevIdx];
          });
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (focusedIndex >= 0 && !menuItems[focusedIndex].disabled) {
            menuItems[focusedIndex].onClick();
          }
          break;
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeMenu, menuItems, focusedIndex]);

  // Focus item when focusedIndex changes
  useEffect(() => {
    if (focusedIndex >= 0 && itemRefs.current[focusedIndex]) {
      itemRefs.current[focusedIndex]?.focus();
    }
  }, [focusedIndex]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <m.div
          ref={menuRef}
          role="menu"
          aria-label="Editor context menu"
          className={clsx(
            'fixed z-[100] min-w-[160px] py-1.5',
            'glass-elevated rounded-xl overflow-hidden'
          )}
          style={{
            left: position.x,
            top: position.y,
            transformOrigin: 'top left',
          }}
          variants={contextMenuVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div
            className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/40 via-transparent to-transparent dark:from-white/10 pointer-events-none"
            aria-hidden="true"
          />
          <m.div
            variants={staggerContainerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {menuItems.map((item, index) => (
              <m.button
                key={item.id}
                ref={el => { itemRefs.current[index] = el; }}
                role="menuitem"
                tabIndex={focusedIndex === index ? 0 : -1}
                disabled={item.disabled}
                onClick={item.onClick}
                onMouseEnter={() => setFocusedIndex(index)}
                className={clsx(
                  'relative w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-left',
                  'transition-colors duration-instant',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500/50',
                  focusedIndex === index && !item.disabled && 'bg-stone-100/80 dark:bg-stone-700/80',
                  item.disabled
                    ? 'opacity-40 cursor-not-allowed'
                    : 'text-stone-700 dark:text-stone-200 hover:bg-stone-100/80 dark:hover:bg-stone-700/80'
                )}
                variants={staggerItemVariants}
                whileTap={!item.disabled ? { scale: 0.98 } : undefined}
              >
                <span className="w-4 h-4 flex items-center justify-center opacity-70">
                  {item.icon}
                </span>
                <span className="flex-1">{item.label}</span>
                {item.shortcut && (
                  <span className="text-xs text-stone-400 dark:text-stone-500 ml-4">
                    {item.shortcut}
                  </span>
                )}
              </m.button>
            ))}
          </m.div>
        </m.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default EditorContextMenu;
