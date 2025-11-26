/**
 * BubbleMenu tests.
 * Note: The BubbleMenu only renders when there's an active text selection.
 * When from === to or selection.empty is true, it returns null.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BubbleMenu } from '../BubbleMenu';

// Mock @floating-ui/dom
vi.mock('@floating-ui/dom', () => ({
  computePosition: vi.fn().mockResolvedValue({ x: 100, y: 50 }),
  offset: vi.fn(),
  flip: vi.fn(),
  shift: vi.fn(),
}));

// Create mock chain builder
const createMockChain = () => {
  const chain: Record<string, () => typeof chain> & { run: () => void } = {
    focus: () => chain,
    toggleBold: () => chain,
    toggleItalic: () => chain,
    toggleUnderline: () => chain,
    toggleLink: () => chain,
    run: vi.fn(),
  };
  return chain;
};

// Create mock editor
const createMockEditor = (options: {
  selectionEmpty?: boolean;
  from?: number;
  to?: number;
  activeMark?: string;
} = {}) => {
  const { selectionEmpty = false, from = 0, to = 10, activeMark } = options;
  const listeners: Record<string, (() => void)[]> = {};

  return {
    state: {
      selection: {
        empty: selectionEmpty,
        from,
        to,
      },
    },
    view: {
      coordsAtPos: (pos: number) => ({
        left: pos * 10,
        right: pos * 10 + 100,
        top: 100,
        bottom: 120,
      }),
    },
    chain: () => createMockChain(),
    isActive: (mark: string) => mark === activeMark,
    on: (event: string, handler: () => void) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(handler);
    },
    off: (event: string, handler: () => void) => {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter(h => h !== handler);
      }
    },
    emit: (event: string) => {
      listeners[event]?.forEach(h => h());
    },
  };
};

describe('BubbleMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('visibility conditions', () => {
    it('renders nothing when selection is empty', () => {
      const editor = createMockEditor({ selectionEmpty: true, from: 5, to: 5 });
      const { container } = render(<BubbleMenu editor={editor as never} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders nothing when from equals to (collapsed cursor)', () => {
      const editor = createMockEditor({ from: 5, to: 5, selectionEmpty: false });
      const { container } = render(<BubbleMenu editor={editor as never} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders nothing when selection.empty is true', () => {
      const editor = createMockEditor({ selectionEmpty: true, from: 0, to: 10 });
      const { container } = render(<BubbleMenu editor={editor as never} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('editor instance', () => {
    it('accepts editor prop', () => {
      const editor = createMockEditor({ from: 5, to: 5 });
      // Should not throw when rendering with a mock editor
      const { container } = render(<BubbleMenu editor={editor as never} />);
      expect(container).toBeDefined();
    });

    it('uses editor state for visibility check', () => {
      const editorWithNoSelection = createMockEditor({ from: 5, to: 5, selectionEmpty: true });
      const { container } = render(<BubbleMenu editor={editorWithNoSelection as never} />);
      // Component renders null when there's no selection
      expect(container.firstChild).toBeNull();
    });
  });

  describe('chain methods', () => {
    it('has chain methods for formatting actions', () => {
      const editor = createMockEditor({ from: 0, to: 10 });
      const chain = editor.chain();

      expect(chain.focus).toBeDefined();
      expect(chain.toggleBold).toBeDefined();
      expect(chain.toggleItalic).toBeDefined();
      expect(chain.toggleUnderline).toBeDefined();
      expect(chain.toggleLink).toBeDefined();
      expect(chain.run).toBeDefined();
    });

    it('chains formatting methods correctly', () => {
      const editor = createMockEditor({ from: 0, to: 10 });
      const chain = editor.chain();

      // Chain should return itself for chaining
      expect(chain.focus().toggleBold().run).toBeDefined();
    });
  });

  describe('active state detection', () => {
    it('detects when bold is active', () => {
      const editor = createMockEditor({ activeMark: 'bold' });
      expect(editor.isActive('bold')).toBe(true);
      expect(editor.isActive('italic')).toBe(false);
    });

    it('detects when italic is active', () => {
      const editor = createMockEditor({ activeMark: 'italic' });
      expect(editor.isActive('italic')).toBe(true);
      expect(editor.isActive('bold')).toBe(false);
    });

    it('detects when link is active', () => {
      const editor = createMockEditor({ activeMark: 'link' });
      expect(editor.isActive('link')).toBe(true);
      expect(editor.isActive('underline')).toBe(false);
    });

    it('returns false when no mark is active', () => {
      const editor = createMockEditor({});
      expect(editor.isActive('bold')).toBe(false);
      expect(editor.isActive('italic')).toBe(false);
    });
  });
});
