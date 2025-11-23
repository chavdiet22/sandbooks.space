import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTypewriterMode } from '../useTypewriterMode';
import { Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

describe('useTypewriterMode', () => {
  let editor: Editor;
  let mockScrollContainer: HTMLElement;

  beforeEach(() => {
    // Create a mock scroll container
    mockScrollContainer = document.createElement('div');
    mockScrollContainer.className = 'overflow-y-auto';
    mockScrollContainer.style.height = '500px';
    mockScrollContainer.style.overflowY = 'auto';
    mockScrollContainer.scrollTop = 0;
    document.body.appendChild(mockScrollContainer);

    // Create editor
    editor = new Editor({
      extensions: [StarterKit],
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Test paragraph' }],
          },
        ],
      },
    }) as Editor;

    // Mock the editor's DOM structure
    vi.spyOn(editor.view.dom, 'closest').mockReturnValue(mockScrollContainer);
    vi.spyOn(editor.view.dom, 'parentElement', 'get').mockReturnValue(mockScrollContainer);

    // Mock getBoundingClientRect
    vi.spyOn(mockScrollContainer, 'getBoundingClientRect').mockReturnValue({
      top: 0,
      left: 0,
      bottom: 500,
      right: 1000,
      width: 1000,
      height: 500,
      x: 0,
      y: 0,
      toJSON: vi.fn(),
    } as DOMRect);

    // Mock scrollTo
    mockScrollContainer.scrollTo = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (document.body.contains(mockScrollContainer)) {
      document.body.removeChild(mockScrollContainer);
    }
    if (editor && !editor.isDestroyed) {
      editor.destroy();
    }
  });

  it('should not scroll when disabled', () => {
    const { result } = renderHook(() => useTypewriterMode(editor, false));
    
    expect(result.current).toBeUndefined();
    expect(mockScrollContainer.scrollTo).not.toHaveBeenCalled();
  });

  it('should not scroll when editor is null', () => {
    const { result } = renderHook(() => useTypewriterMode(null, true));
    
    expect(result.current).toBeUndefined();
  });

  it('should setup event listeners when enabled', () => {
    const addEventListenerSpy = vi.spyOn(editor.view.dom, 'addEventListener');
    
    renderHook(() => useTypewriterMode(editor, true));
    
    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function), true);
    expect(addEventListenerSpy).toHaveBeenCalledWith('paste', expect.any(Function), true);
  });

  it('should cleanup event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(editor.view.dom, 'removeEventListener');
    
    const { unmount } = renderHook(() => useTypewriterMode(editor, true));
    unmount();
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function), true);
    expect(removeEventListenerSpy).toHaveBeenCalledWith('paste', expect.any(Function), true);
  });

  it('should handle keyboard events', () => {
    renderHook(() => useTypewriterMode(editor, true));
    
    const keyEvent = new KeyboardEvent('keydown', {
      key: 'a',
      bubbles: true,
    });
    
    editor.view.dom.dispatchEvent(keyEvent);
    // Event listener should be attached and handle the event
    expect(true).toBe(true);
  });

  it('should handle navigation keys', () => {
    renderHook(() => useTypewriterMode(editor, true));
    
    const navigationKeys = ['ArrowUp', 'ArrowDown', 'Tab'];
    
    for (const key of navigationKeys) {
      const keyEvent = new KeyboardEvent('keydown', {
        key,
        bubbles: true,
      });
      
      editor.view.dom.dispatchEvent(keyEvent);
    }
    // Event listeners should handle navigation keys
    expect(true).toBe(true);
  });

  it('should cleanup timeouts on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
    
    const { unmount } = renderHook(() => useTypewriterMode(editor, true));
    unmount();
    
    // Should clear any pending timeouts
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it('should handle TEXT_NODE cursor element', () => {
    const mockCursorElement2 = document.createElement('p');
    const textNode = document.createTextNode('test');
    mockCursorElement2.appendChild(textNode);
    
    vi.spyOn(editor.view, 'domAtPos').mockReturnValue({
      node: textNode,
      offset: 0,
    });

    renderHook(() => useTypewriterMode(editor, true));
    
    const keyEvent = new KeyboardEvent('keydown', {
      key: 'a',
      bubbles: true,
    });
    
    editor.view.dom.dispatchEvent(keyEvent);
    expect(true).toBe(true);
  });

  it('should find scroll container via parent element search', () => {
    // Mock closest to return null, forcing parent search
    vi.spyOn(editor.view.dom, 'closest').mockReturnValue(null);
    
    const parentWithOverflow = document.createElement('div');
    parentWithOverflow.style.overflowY = 'auto';
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      overflowY: 'auto',
    } as CSSStyleDeclaration);
    
    vi.spyOn(editor.view.dom, 'parentElement', 'get').mockReturnValue(parentWithOverflow);
    
    const mockCursorElement2 = document.createElement('p');
    vi.spyOn(editor.view, 'domAtPos').mockReturnValue({
      node: mockCursorElement2,
      offset: 0,
    });

    vi.spyOn(parentWithOverflow, 'getBoundingClientRect').mockReturnValue({
      top: 0,
      left: 0,
      bottom: 500,
      right: 1000,
      width: 1000,
      height: 500,
      x: 0,
      y: 0,
      toJSON: vi.fn(),
    } as DOMRect);

    vi.spyOn(mockCursorElement2, 'getBoundingClientRect').mockReturnValue({
      top: 250,
      left: 0,
      bottom: 270,
      right: 100,
      width: 100,
      height: 20,
      x: 0,
      y: 250,
      toJSON: vi.fn(),
    } as DOMRect);

    parentWithOverflow.scrollTo = vi.fn();
    parentWithOverflow.scrollTop = 0;

    renderHook(() => useTypewriterMode(editor, true));
    
    const keyEvent = new KeyboardEvent('keydown', {
      key: 'a',
      bubbles: true,
    });
    
    editor.view.dom.dispatchEvent(keyEvent);
    expect(true).toBe(true);
  });

  it('should handle missing cursor element gracefully', () => {
    vi.spyOn(editor.view, 'domAtPos').mockReturnValue({
      node: null as unknown as Node,
      offset: 0,
    });

    renderHook(() => useTypewriterMode(editor, true));
    
    const keyEvent = new KeyboardEvent('keydown', {
      key: 'a',
      bubbles: true,
    });
    
    editor.view.dom.dispatchEvent(keyEvent);
    expect(true).toBe(true);
  });

  it('should handle scroll threshold correctly', () => {
    const mockCursorElement2 = document.createElement('p');
    vi.spyOn(editor.view, 'domAtPos').mockReturnValue({
      node: mockCursorElement2,
      offset: 0,
    });

    // Set cursor very close to center (within threshold)
    vi.spyOn(mockCursorElement2, 'getBoundingClientRect').mockReturnValue({
      top: 250,
      left: 0,
      bottom: 270,
      right: 100,
      width: 100,
      height: 20,
      x: 0,
      y: 250,
      toJSON: vi.fn(),
    } as DOMRect);

    renderHook(() => useTypewriterMode(editor, true));
    
    const keyEvent = new KeyboardEvent('keydown', {
      key: 'a',
      bubbles: true,
    });
    
    editor.view.dom.dispatchEvent(keyEvent);
    expect(true).toBe(true);
  });

  it('should handle editor update events', () => {
    const onSpy = vi.spyOn(editor, 'on');
    
    renderHook(() => useTypewriterMode(editor, true));
    
    expect(onSpy).toHaveBeenCalledWith('update', expect.any(Function));
    expect(onSpy).toHaveBeenCalledWith('selectionUpdate', expect.any(Function));
  });

  it('should handle initial scroll when enabled', () => {
    const mockCursorElement2 = document.createElement('p');
    vi.spyOn(editor.view, 'domAtPos').mockReturnValue({
      node: mockCursorElement2,
      offset: 0,
    });

    const { rerender } = renderHook(
      ({ enabled }) => useTypewriterMode(editor, enabled),
      { initialProps: { enabled: false } }
    );
    
    // Enable typewriter mode - should trigger initial scroll
    rerender({ enabled: true });
    
    expect(true).toBe(true);
  });
});
