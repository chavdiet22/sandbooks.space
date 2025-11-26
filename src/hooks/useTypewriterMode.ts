import { useEffect, useCallback, useRef } from 'react';
import type { Editor } from '@tiptap/react';

/**
 * Custom hook for iA Writer-style typewriter mode
 * 
 * WHAT IT DOES:
 * Automatically scrolls the editor to keep your cursor centered vertically 
 * in the viewport while you type. This means:
 * - As you type and the cursor moves down, the editor scrolls automatically
 * - Your cursor stays in the middle of the screen (not at the bottom)
 * - You never need to manually scroll while writing
 * - Only activates while actively typing (not when using arrow keys)
 * 
 * USE CASE:
 * Perfect for long-form writing where you want to focus on what you're 
 * currently writing without the cursor disappearing off the bottom of the screen.
 * 
 * INSPIRED BY:
 * iA Writer's typewriter mode - a popular feature in writing apps
 *
 * @param editor - TipTap editor instance
 * @param enabled - Whether typewriter mode is active
 */
export const useTypewriterMode = (editor: Editor | null, enabled: boolean) => {
  const isTypingRef = useRef(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastScrollTimeRef = useRef(0);
  const scrollAnimationFrameRef = useRef<number | null>(null);

  const scrollToCursor = useCallback(() => {
    if (!editor || !enabled || editor.isDestroyed) return;

    // Throttle scroll updates to prevent excessive scrolling
    const now = Date.now();
    if (now - lastScrollTimeRef.current < 50) {
      return;
    }
    lastScrollTimeRef.current = now;

    // Cancel any pending scroll animation
    if (scrollAnimationFrameRef.current !== null) {
      cancelAnimationFrame(scrollAnimationFrameRef.current);
    }

    scrollAnimationFrameRef.current = requestAnimationFrame(() => {
      try {
        // Get the current selection/cursor position
        const { state } = editor;
        const { selection } = state;
        const { $anchor } = selection;

        // Find the DOM node at the cursor position using ProseMirror's view
        const domPos = editor.view.domAtPos($anchor.pos);
        let cursorElement: HTMLElement | null = null;

        if (domPos.node.nodeType === Node.TEXT_NODE) {
          cursorElement = domPos.node.parentElement;
        } else {
          cursorElement = domPos.node as HTMLElement;
        }

        if (!cursorElement) return;

        // Find the scrollable container - look for the editor's parent container
        // The editor is inside a div with class "overflow-y-auto"
        let scrollContainer: HTMLElement | null = null;
        
        // Try multiple strategies to find the scroll container
        const editorDom = editor.view.dom;
        
        // Strategy 1: Look for parent with overflow-y-auto class
        scrollContainer = editorDom.closest('.overflow-y-auto') as HTMLElement;
        
        // Strategy 2: If not found, look for the first scrollable parent
        if (!scrollContainer) {
          let parent = editorDom.parentElement;
          while (parent) {
            const style = window.getComputedStyle(parent);
            if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
              scrollContainer = parent;
              break;
            }
            parent = parent.parentElement;
          }
        }

        // Strategy 3: Fallback to window scrolling (shouldn't happen in our layout)
        if (!scrollContainer) {
          return;
        }

        // Get positions relative to the viewport
        const containerRect = scrollContainer.getBoundingClientRect();
        const cursorRect = cursorElement.getBoundingClientRect();

        // Calculate the center of the scroll container's visible area
        const viewportCenter = containerRect.height / 2;

        // Calculate the cursor's position relative to the container's top edge
        // This accounts for the container's position in the viewport
        const cursorTopRelativeToContainer = cursorRect.top - containerRect.top + scrollContainer.scrollTop;
        const cursorCenterRelativeToContainer = cursorTopRelativeToContainer + cursorRect.height / 2;

        // Calculate how much we need to scroll to center the cursor
        const scrollOffset = cursorCenterRelativeToContainer - (scrollContainer.scrollTop + viewportCenter);

        // Only scroll if we're far enough from center (prevents jitter)
        const threshold = 60; // pixels - increased for smoother behavior
        if (Math.abs(scrollOffset) > threshold) {
          const currentScroll = scrollContainer.scrollTop;
          const targetScroll = currentScroll + scrollOffset;

          // Smooth scroll to center
          scrollContainer.scrollTo({
            top: targetScroll,
            behavior: 'smooth',
          });
        }
      } catch {
        // Silently handle - typewriter is non-critical UX enhancement
      }
    });
  }, [editor, enabled]);

  // Track typing state and handle keyboard events
  useEffect(() => {
    if (!editor || !enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger on navigation keys or modifier-only keys
      const navigationKeys = [
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
        'Home',
        'End',
        'PageUp',
        'PageDown',
        'Tab', // Tab navigation
      ];

      // Check if it's a modifier key only
      const isModifierOnly = 
        event.key === 'Meta' ||
        event.key === 'Control' ||
        event.key === 'Alt' ||
        event.key === 'Shift';

      if (navigationKeys.includes(event.key) || isModifierOnly) {
        isTypingRef.current = false;
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
        }
        return;
      }

      // User is typing (any other key)
      isTypingRef.current = true;

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Reset typing state after 800ms of no typing (increased for better UX)
      typingTimeoutRef.current = setTimeout(() => {
        isTypingRef.current = false;
        typingTimeoutRef.current = null;
      }, 800);
    };

    const handleUpdate = () => {
      // Only scroll if user is actively typing
      if (isTypingRef.current) {
        scrollToCursor();
      }
    };

    const handleSelectionUpdate = () => {
      // Scroll on selection changes while typing (e.g., when typing moves cursor)
      if (isTypingRef.current) {
        scrollToCursor();
      }
    };

    // Listen for keyboard events on the editor DOM
    const editorDom = editor.view.dom;
    editorDom.addEventListener('keydown', handleKeyDown, true);

    // Listen for editor updates (content changes)
    editor.on('update', handleUpdate);

    // Listen for selection changes
    editor.on('selectionUpdate', handleSelectionUpdate);

    // Also handle paste events (user might paste content)
    const handlePaste = () => {
      isTypingRef.current = true;
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        isTypingRef.current = false;
        typingTimeoutRef.current = null;
      }, 800);
      // Scroll after paste
      setTimeout(() => scrollToCursor(), 100);
    };

    editorDom.addEventListener('paste', handlePaste, true);

    return () => {
      editorDom.removeEventListener('keydown', handleKeyDown, true);
      editorDom.removeEventListener('paste', handlePaste, true);
      editor.off('update', handleUpdate);
      editor.off('selectionUpdate', handleSelectionUpdate);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      if (scrollAnimationFrameRef.current !== null) {
        cancelAnimationFrame(scrollAnimationFrameRef.current);
        scrollAnimationFrameRef.current = null;
      }
    };
  }, [editor, enabled, scrollToCursor]);

  // Initial scroll when mode is first enabled
  useEffect(() => {
    if (enabled && editor) {
      // Small delay to ensure DOM is ready
      const timeoutId = setTimeout(() => {
        scrollToCursor();
      }, 150);

      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [enabled, editor, scrollToCursor]);
};
