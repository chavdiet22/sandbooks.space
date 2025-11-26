/**
 * Tooltip tests.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Tooltip } from '../Tooltip';

// Mock tippy.js
vi.mock('tippy.js', () => ({
  default: vi.fn((element, options) => {
    const instance = {
      destroy: vi.fn(),
      element,
      options,
    };
    return instance;
  }),
}));

import tippy from 'tippy.js';

describe('Tooltip', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children', () => {
    render(
      <Tooltip content="Tooltip text">
        <button>Hover me</button>
      </Tooltip>
    );

    expect(screen.getByText('Hover me')).toBeInTheDocument();
  });

  it('initializes tippy with content', () => {
    render(
      <Tooltip content="Tooltip content">
        <button>Button</button>
      </Tooltip>
    );

    expect(tippy).toHaveBeenCalled();
  });

  it('creates tooltip with shortcut', () => {
    render(
      <Tooltip content="Save" shortcut="Cmd+S">
        <button>Save</button>
      </Tooltip>
    );

    expect(tippy).toHaveBeenCalled();
    // tippy is called with element and options containing a content element
    const calls = vi.mocked(tippy).mock.calls;
    expect(calls.length).toBeGreaterThan(0);
  });

  it('passes placement option to tippy', () => {
    render(
      <Tooltip content="Tooltip" placement="bottom">
        <button>Button</button>
      </Tooltip>
    );

    const calls = vi.mocked(tippy).mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const options = calls[0][1];
    expect(options?.placement).toBe('bottom');
  });

  it('passes theme option to tippy', () => {
    render(
      <Tooltip content="Tooltip" theme="light">
        <button>Button</button>
      </Tooltip>
    );

    const calls = vi.mocked(tippy).mock.calls;
    const options = calls[0][1];
    expect(options?.theme).toBe('light');
  });

  it('passes trigger option to tippy', () => {
    render(
      <Tooltip content="Tooltip" trigger="click">
        <button>Button</button>
      </Tooltip>
    );

    const calls = vi.mocked(tippy).mock.calls;
    const options = calls[0][1];
    expect(options?.trigger).toBe('click');
  });

  it('passes interactive option to tippy', () => {
    render(
      <Tooltip content="Tooltip" interactive={true}>
        <button>Button</button>
      </Tooltip>
    );

    const calls = vi.mocked(tippy).mock.calls;
    const options = calls[0][1];
    expect(options?.interactive).toBe(true);
  });

  it('destroys tippy instance on unmount', () => {
    const mockDestroy = vi.fn();
    vi.mocked(tippy).mockReturnValue({
      destroy: mockDestroy,
    } as unknown as ReturnType<typeof tippy>);

    const { unmount } = render(
      <Tooltip content="Tooltip">
        <button>Button</button>
      </Tooltip>
    );

    unmount();

    expect(mockDestroy).toHaveBeenCalled();
  });

  it('destroys old instance when content changes', () => {
    const mockDestroy = vi.fn();
    vi.mocked(tippy).mockReturnValue({
      destroy: mockDestroy,
    } as unknown as ReturnType<typeof tippy>);

    const { rerender } = render(
      <Tooltip content="Old content">
        <button>Button</button>
      </Tooltip>
    );

    rerender(
      <Tooltip content="New content">
        <button>Button</button>
      </Tooltip>
    );

    expect(mockDestroy).toHaveBeenCalled();
  });

  it('wraps children in span with display contents', () => {
    render(
      <Tooltip content="Tooltip">
        <button data-testid="child">Button</button>
      </Tooltip>
    );

    const wrapper = screen.getByTestId('child').parentElement;
    expect(wrapper?.style.display).toBe('contents');
  });
});
