/**
 * Terminal service barrel file exports test.
 */
import { describe, it, expect } from 'vitest';
import { terminalService, cloudTerminalProvider } from '../index';
import type { TerminalProviderInterface } from '../index';

describe('terminal service index exports', () => {
  it('exports terminalService', () => {
    expect(terminalService).toBeDefined();
    expect(typeof terminalService).toBe('object');
  });

  it('exports cloudTerminalProvider', () => {
    expect(cloudTerminalProvider).toBeDefined();
    expect(typeof cloudTerminalProvider).toBe('object');
  });

  it('cloudTerminalProvider implements TerminalProviderInterface', () => {
    const provider: TerminalProviderInterface = cloudTerminalProvider;
    expect(provider.isAvailable).toBeDefined();
    expect(provider.createSession).toBeDefined();
    expect(provider.destroySession).toBeDefined();
    expect(provider.sendInput).toBeDefined();
    expect(provider.resize).toBeDefined();
    expect(provider.connectStream).toBeDefined();
    expect(provider.disconnectStream).toBeDefined();
  });
});
