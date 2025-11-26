import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TerminalEmulator } from './TerminalEmulator';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { executionModeManager } from '../../services/execution/executionModeManager';
import { useNotesStore } from '../../store/notesStore';

// Mock EventSource globally (not available in Node.js)
class MockEventSource {
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
  close = vi.fn();
  onopen: (() => void) | null = null;
  onerror: ((error: Event) => void) | null = null;
  readyState = 1;
  url = '';
  withCredentials = false;
  CONNECTING = 0;
  OPEN = 1;
  CLOSED = 2;
}
global.EventSource = MockEventSource as unknown as typeof EventSource;

// Mock WebSocket globally (not available in Node.js)
class MockWebSocket {
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
  close = vi.fn();
  send = vi.fn();
  onopen: (() => void) | null = null;
  onerror: ((error: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onclose: (() => void) | null = null;
  readyState = 1;
  url = '';
  protocol = '';
  extensions = '';
  bufferedAmount = 0;
  binaryType: BinaryType = 'blob';
  CONNECTING = 0;
  OPEN = 1;
  CLOSING = 2;
  CLOSED = 3;
}
global.WebSocket = MockWebSocket as unknown as typeof WebSocket;

// Mock the store
vi.mock('../../store/notesStore', () => ({
  useNotesStore: vi.fn(),
}));

// Mock terminal provider - create fresh instance for each test
function createMockProvider() {
  return {
    provider: 'cloud' as const,
    name: 'Cloud Terminal (Hopx)',
    mode: 'terminal' as const,
    connectStream: vi.fn(),
    disconnectStream: vi.fn(),
    sendInput: vi.fn().mockResolvedValue(undefined),
    resize: vi.fn().mockResolvedValue(undefined),
    isAvailable: vi.fn().mockResolvedValue(true),
    createSession: vi.fn().mockResolvedValue({ sessionId: 'test-session' }),
    destroySession: vi.fn().mockResolvedValue(undefined),
  };
}

// Mock executionModeManager
vi.mock('../../services/execution/executionModeManager', () => ({
  executionModeManager: {
    getTerminalProvider: vi.fn(),
    setTerminalProvider: vi.fn(),
    setMode: vi.fn(async () => {}),
    getMode: vi.fn(() => 'cloud'),
    isLocalModeAvailable: vi.fn(async () => false),
  },
}));

// Track xterm instances - reset per test
let terminalInstance: ReturnType<typeof createMockTerminal> | null = null;

function createMockTerminal() {
  return {
    write: vi.fn(),
    open: vi.fn(),
    dispose: vi.fn(),
    focus: vi.fn(),
    refresh: vi.fn(),
    clear: vi.fn(),
    scrollToBottom: vi.fn(),
    onData: vi.fn(),
    rows: 24,
    cols: 80,
    options: {},
    loadAddon: vi.fn(),
    element: document.createElement('div'),
    textarea: document.createElement('textarea'),
    buffer: {
      active: {
        cursorX: 0,
        cursorY: 0,
      },
    },
    unicode: {
      activeVersion: '11',
    },
    parser: {
      registerOscHandler: vi.fn(() => true),
    },
  };
}

vi.mock('@xterm/xterm', () => ({
  Terminal: vi.fn(function () {
    terminalInstance = createMockTerminal();
    return terminalInstance;
  }),
}));

vi.mock('@xterm/addon-fit', () => ({
  FitAddon: vi.fn(function () {
    return {
      fit: vi.fn(),
    };
  }),
}));

vi.mock('@xterm/addon-web-links', () => ({
  WebLinksAddon: vi.fn(function () {
    return {};
  }),
}));

vi.mock('@xterm/addon-search', () => ({
  SearchAddon: vi.fn(function () {
    return {};
  }),
}));

vi.mock('@xterm/addon-serialize', () => ({
  SerializeAddon: vi.fn(function () {
    return { serialize: vi.fn(() => '') };
  }),
}));

vi.mock('@xterm/addon-unicode11', () => ({
  Unicode11Addon: vi.fn(function () {
    return {};
  }),
}));

vi.mock('@xterm/addon-image', () => ({
  ImageAddon: vi.fn(function () {
    return {};
  }),
}));

vi.mock('@xterm/addon-canvas', () => ({
  CanvasAddon: vi.fn(function () {
    return {};
  }),
}));

describe('TerminalEmulator', () => {
  const mockOnStatusChange = vi.fn();
  const mockOnLatencyUpdate = vi.fn();
  const mockOnError = vi.fn();
  const mockOnSessionInfo = vi.fn();
  let mockProvider: ReturnType<typeof createMockProvider>;
  let mockEventSource: {
    addEventListener: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
    onopen: (() => void) | null;
    onerror: ((error: Event) => void) | null;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    terminalInstance = null;

    // Mock ResizeObserver
    global.ResizeObserver = vi.fn(function () {
      return {
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
      };
    });

    // Mock store to return terminal open
    vi.mocked(useNotesStore).mockImplementation((selector) => {
      const state = { isTerminalOpen: true };
      return selector(state as Parameters<typeof selector>[0]);
    });

    // Create fresh mocks for each test - must be instanceof EventSource
    mockEventSource = new MockEventSource() as typeof mockEventSource;

    mockProvider = createMockProvider();
    mockProvider.connectStream.mockReturnValue(mockEventSource);
    vi.mocked(executionModeManager.getTerminalProvider).mockReturnValue(mockProvider);

    // Mock document.querySelector for dark mode detection
    document.documentElement.classList.remove('dark');
  });

  afterEach(async () => {
    // Clean up React first
    cleanup();

    // Reset terminal instance
    terminalInstance = null;

    // Restore mocks
    vi.restoreAllMocks();

    // Flush all pending promises and microtasks
    await new Promise(resolve => setTimeout(resolve, 50));

    // Clear any remaining timers
    vi.clearAllTimers();
  });

  describe('Initialization', () => {
    it('creates xterm instance on mount', async () => {
      render(
        <TerminalEmulator
          sessionId="test-session"
          noteId="test-note"
          onStatusChange={mockOnStatusChange}
          onLatencyUpdate={mockOnLatencyUpdate}
          onError={mockOnError}
        />
      );

      await waitFor(() => {
        expect(Terminal).toHaveBeenCalledWith(
          expect.objectContaining({
            fontFamily: "'JetBrainsMono Nerd Font', 'FiraCode Nerd Font', monospace",
            fontSize: 14,
            cursorBlink: true,
          })
        );
      });
    });

    it('loads FitAddon and WebLinksAddon', async () => {
      render(
        <TerminalEmulator
          sessionId="test-session"
          noteId="test-note"
          onStatusChange={mockOnStatusChange}
          onLatencyUpdate={mockOnLatencyUpdate}
          onError={mockOnError}
        />
      );

      await waitFor(() => {
        expect(FitAddon).toHaveBeenCalled();
        expect(WebLinksAddon).toHaveBeenCalled();
      });
    });

    it('applies dark theme based on dark mode', async () => {
      document.documentElement.classList.add('dark');

      render(
        <TerminalEmulator
          sessionId="test-session"
          noteId="test-note"
          onStatusChange={mockOnStatusChange}
          onLatencyUpdate={mockOnLatencyUpdate}
          onError={mockOnError}
        />
      );

      await waitFor(() => {
        expect(Terminal).toHaveBeenCalledWith(
          expect.objectContaining({
            theme: expect.objectContaining({
              background: '#1c1917', // stone-900
              foreground: '#f5f5f4', // stone-100
            }),
          })
        );
      });
    });

    it('creates ResizeObserver for terminal container', async () => {
      render(
        <TerminalEmulator
          sessionId="test-session"
          noteId="test-note"
          onStatusChange={mockOnStatusChange}
          onLatencyUpdate={mockOnLatencyUpdate}
          onError={mockOnError}
        />
      );

      await waitFor(() => {
        expect(ResizeObserver).toHaveBeenCalled();
      });
    });
  });

  describe('Cloud Connection', () => {
    it('connects to SSE stream via provider', async () => {
      render(
        <TerminalEmulator
          sessionId="test-session"
          noteId="test-note"
          onStatusChange={mockOnStatusChange}
          onLatencyUpdate={mockOnLatencyUpdate}
          onError={mockOnError}
        />
      );

      await waitFor(() => {
        expect(mockProvider.connectStream).toHaveBeenCalledWith('test-session');
      });
    });

    it('calls onStatusChange with connecting on mount', async () => {
      render(
        <TerminalEmulator
          sessionId="test-session"
          noteId="test-note"
          onStatusChange={mockOnStatusChange}
          onLatencyUpdate={mockOnLatencyUpdate}
          onError={mockOnError}
        />
      );

      await waitFor(() => {
        expect(mockOnStatusChange).toHaveBeenCalledWith('connecting');
      });
    });

    it('calls onStatusChange with connected when connected event received', async () => {
      render(
        <TerminalEmulator
          sessionId="test-session"
          noteId="test-note"
          onStatusChange={mockOnStatusChange}
          onLatencyUpdate={mockOnLatencyUpdate}
          onError={mockOnError}
        />
      );

      await waitFor(() => {
        expect(mockEventSource.addEventListener).toHaveBeenCalled();
      });

      const addEventListenerCalls = mockEventSource.addEventListener.mock.calls;
      const connectedListener = addEventListenerCalls.find(call => call[0] === 'connected');
      expect(connectedListener).toBeDefined();

      const mockEvent = new MessageEvent('connected', {
        data: JSON.stringify({ sandboxId: 'sandbox-123' }),
      });

      connectedListener![1](mockEvent);

      await waitFor(() => {
        expect(mockOnStatusChange).toHaveBeenCalledWith('connected');
      });
    });

    it('displays Connected to sandbox message', async () => {
      render(
        <TerminalEmulator
          sessionId="test-session"
          noteId="test-note"
          onStatusChange={mockOnStatusChange}
          onLatencyUpdate={mockOnLatencyUpdate}
          onError={mockOnError}
        />
      );

      await waitFor(() => {
        expect(mockEventSource.addEventListener).toHaveBeenCalled();
      });

      const addEventListenerCalls = mockEventSource.addEventListener.mock.calls;
      const connectedListener = addEventListenerCalls.find(call => call[0] === 'connected');

      const mockEvent = new MessageEvent('connected', {
        data: JSON.stringify({ sandboxId: 'sandbox-123' }),
      });

      connectedListener![1](mockEvent);

      await waitFor(() => {
        expect(terminalInstance!.write).toHaveBeenCalledWith(
          expect.stringContaining('Connected to sandbox sandbox-123')
        );
      });
    });

    it('handles SSE error with status change', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <TerminalEmulator
          sessionId="test-session"
          noteId="test-note"
          onStatusChange={mockOnStatusChange}
          onLatencyUpdate={mockOnLatencyUpdate}
          onError={mockOnError}
        />
      );

      await waitFor(() => {
        expect(mockEventSource.onerror).toBeDefined();
      });

      mockEventSource.onerror!(new Event('error'));

      await waitFor(() => {
        expect(mockOnStatusChange).toHaveBeenCalledWith('error');
      });

      consoleErrorSpy.mockRestore();
    });

    it('calls onSessionInfo with provider info when connected', async () => {
      render(
        <TerminalEmulator
          sessionId="test-session"
          noteId="test-note"
          onStatusChange={mockOnStatusChange}
          onLatencyUpdate={mockOnLatencyUpdate}
          onError={mockOnError}
          onSessionInfo={mockOnSessionInfo}
        />
      );

      await waitFor(() => {
        expect(mockEventSource.addEventListener).toHaveBeenCalled();
      });

      const addEventListenerCalls = mockEventSource.addEventListener.mock.calls;
      const connectedListener = addEventListenerCalls.find(call => call[0] === 'connected');

      const mockEvent = new MessageEvent('connected', {
        data: JSON.stringify({ sandboxId: 'sandbox-123' }),
      });

      connectedListener![1](mockEvent);

      await waitFor(() => {
        expect(mockOnSessionInfo).toHaveBeenCalledWith({ provider: 'cloud' });
      });
    });
  });

  describe('Input Handling (Cloud PTY Mode)', () => {
    it('sends all input directly to provider', async () => {
      render(
        <TerminalEmulator
          sessionId="test-session"
          noteId="test-note"
          onStatusChange={mockOnStatusChange}
          onLatencyUpdate={mockOnLatencyUpdate}
          onError={mockOnError}
        />
      );

      await waitFor(() => {
        expect(terminalInstance!.onData).toHaveBeenCalled();
      });

      const onDataHandler = terminalInstance!.onData.mock.calls[0][0];
      onDataHandler('a');

      await waitFor(() => {
        expect(mockProvider.sendInput).toHaveBeenCalledWith('test-session', 'a');
      });
    });

    it('sends Enter key to provider', async () => {
      render(
        <TerminalEmulator
          sessionId="test-session"
          noteId="test-note"
          onStatusChange={mockOnStatusChange}
          onLatencyUpdate={mockOnLatencyUpdate}
          onError={mockOnError}
        />
      );

      await waitFor(() => {
        expect(terminalInstance!.onData).toHaveBeenCalled();
      });

      const onDataHandler = terminalInstance!.onData.mock.calls[0][0];
      onDataHandler('\r');

      await waitFor(() => {
        expect(mockProvider.sendInput).toHaveBeenCalledWith('test-session', '\r');
      });
    });

    it('sends Backspace to provider', async () => {
      render(
        <TerminalEmulator
          sessionId="test-session"
          noteId="test-note"
          onStatusChange={mockOnStatusChange}
          onLatencyUpdate={mockOnLatencyUpdate}
          onError={mockOnError}
        />
      );

      await waitFor(() => {
        expect(terminalInstance!.onData).toHaveBeenCalled();
      });

      const onDataHandler = terminalInstance!.onData.mock.calls[0][0];
      onDataHandler('\x7F');

      await waitFor(() => {
        expect(mockProvider.sendInput).toHaveBeenCalledWith('test-session', '\x7F');
      });
    });

    it('sends arrow keys to provider', async () => {
      render(
        <TerminalEmulator
          sessionId="test-session"
          noteId="test-note"
          onStatusChange={mockOnStatusChange}
          onLatencyUpdate={mockOnLatencyUpdate}
          onError={mockOnError}
        />
      );

      await waitFor(() => {
        expect(terminalInstance!.onData).toHaveBeenCalled();
      });

      const onDataHandler = terminalInstance!.onData.mock.calls[0][0];
      onDataHandler('\x1b[A');

      await waitFor(() => {
        expect(mockProvider.sendInput).toHaveBeenCalledWith('test-session', '\x1b[A');
      });
    });

    it('sends Ctrl+C to provider', async () => {
      render(
        <TerminalEmulator
          sessionId="test-session"
          noteId="test-note"
          onStatusChange={mockOnStatusChange}
          onLatencyUpdate={mockOnLatencyUpdate}
          onError={mockOnError}
        />
      );

      await waitFor(() => {
        expect(terminalInstance!.onData).toHaveBeenCalled();
      });

      const onDataHandler = terminalInstance!.onData.mock.calls[0][0];
      onDataHandler('\u0003');

      await waitFor(() => {
        expect(mockProvider.sendInput).toHaveBeenCalledWith('test-session', '\u0003');
      });
    });

    it('calls onError when sendInput fails', async () => {
      // Create a promise we can resolve after the error handler runs
      let rejectSendInput: (err: Error) => void;
      const sendInputPromise = new Promise<void>((_, reject) => {
        rejectSendInput = reject;
      });

      const localMockProvider = createMockProvider();
      localMockProvider.connectStream.mockReturnValue(mockEventSource);
      localMockProvider.sendInput.mockImplementation(() => sendInputPromise);
      vi.mocked(executionModeManager.getTerminalProvider).mockReturnValue(localMockProvider);

      render(
        <TerminalEmulator
          sessionId="test-session"
          noteId="test-note"
          onStatusChange={mockOnStatusChange}
          onLatencyUpdate={mockOnLatencyUpdate}
          onError={mockOnError}
        />
      );

      await waitFor(() => {
        expect(terminalInstance!.onData).toHaveBeenCalled();
      });

      const onDataHandler = terminalInstance!.onData.mock.calls[0][0];
      onDataHandler('x');

      // Reject after the input is sent
      rejectSendInput!(new Error('Network error'));

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Network error');
      });

      // Wait for microtask queue to clear
      await new Promise(resolve => setTimeout(resolve, 0));
    });
  });

  describe('Output Handling', () => {
    it('writes stdout from output event to terminal', async () => {
      render(
        <TerminalEmulator
          sessionId="test-session"
          noteId="test-note"
          onStatusChange={mockOnStatusChange}
          onLatencyUpdate={mockOnLatencyUpdate}
          onError={mockOnError}
        />
      );

      await waitFor(() => {
        expect(mockEventSource.addEventListener).toHaveBeenCalled();
      });

      const addEventListenerCalls = mockEventSource.addEventListener.mock.calls;
      const outputListener = addEventListenerCalls.find(call => call[0] === 'output');
      expect(outputListener).toBeDefined();

      const mockEvent = new MessageEvent('output', {
        data: JSON.stringify({ stdout: 'hello world\n' }),
      });

      outputListener![1](mockEvent);

      await waitFor(() => {
        expect(terminalInstance!.write).toHaveBeenCalledWith('hello world\r\n');
      });
    });

    it('writes stderr in red from output event', async () => {
      render(
        <TerminalEmulator
          sessionId="test-session"
          noteId="test-note"
          onStatusChange={mockOnStatusChange}
          onLatencyUpdate={mockOnLatencyUpdate}
          onError={mockOnError}
        />
      );

      await waitFor(() => {
        expect(mockEventSource.addEventListener).toHaveBeenCalled();
      });

      const addEventListenerCalls = mockEventSource.addEventListener.mock.calls;
      const outputListener = addEventListenerCalls.find(call => call[0] === 'output');

      const mockEvent = new MessageEvent('output', {
        data: JSON.stringify({ stderr: 'error message\n' }),
      });

      outputListener![1](mockEvent);

      await waitFor(() => {
        expect(terminalInstance!.write).toHaveBeenCalledWith(
          expect.stringContaining('\x1b[31m')
        );
        expect(terminalInstance!.write).toHaveBeenCalledWith(
          expect.stringContaining('error message')
        );
      });
    });

    it('writes terminal_message output to terminal', async () => {
      render(
        <TerminalEmulator
          sessionId="test-session"
          noteId="test-note"
          onStatusChange={mockOnStatusChange}
          onLatencyUpdate={mockOnLatencyUpdate}
          onError={mockOnError}
        />
      );

      await waitFor(() => {
        expect(mockEventSource.addEventListener).toHaveBeenCalled();
      });

      const addEventListenerCalls = mockEventSource.addEventListener.mock.calls;
      const terminalMessageListener = addEventListenerCalls.find(call => call[0] === 'terminal_message');
      expect(terminalMessageListener).toBeDefined();

      const mockEvent = new MessageEvent('terminal_message', {
        data: JSON.stringify({ type: 'output', data: 'raw terminal data' }),
      });

      terminalMessageListener![1](mockEvent);

      await waitFor(() => {
        expect(terminalInstance!.write).toHaveBeenCalledWith('raw terminal data');
      });
    });
  });

  describe('Cleanup', () => {
    it('disposes terminal on unmount', async () => {
      const { unmount } = render(
        <TerminalEmulator
          sessionId="test-session"
          noteId="test-note"
          onStatusChange={mockOnStatusChange}
          onLatencyUpdate={mockOnLatencyUpdate}
          onError={mockOnError}
        />
      );

      await waitFor(() => {
        expect(Terminal).toHaveBeenCalled();
      });

      const instanceToCheck = terminalInstance!;

      unmount();

      expect(instanceToCheck.dispose).toHaveBeenCalled();
    });

    it('disconnects stream on unmount', async () => {
      const { unmount } = render(
        <TerminalEmulator
          sessionId="test-session"
          noteId="test-note"
          onStatusChange={mockOnStatusChange}
          onLatencyUpdate={mockOnLatencyUpdate}
          onError={mockOnError}
        />
      );

      await waitFor(() => {
        expect(mockProvider.connectStream).toHaveBeenCalled();
      });

      unmount();

      expect(mockProvider.disconnectStream).toHaveBeenCalled();
    });
  });
});
