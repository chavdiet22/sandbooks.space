/**
 * GitHub barrel file exports test.
 */
import { describe, it, expect } from 'vitest';
import { GitHubConnect, RepoSelector, SyncConflictModal } from '../index';

describe('GitHub index exports', () => {
  it('exports GitHubConnect component', () => {
    expect(GitHubConnect).toBeDefined();
    expect(typeof GitHubConnect).toBe('function');
  });

  it('exports RepoSelector component', () => {
    expect(RepoSelector).toBeDefined();
    expect(typeof RepoSelector).toBe('function');
  });

  it('exports SyncConflictModal component', () => {
    expect(SyncConflictModal).toBeDefined();
    expect(typeof SyncConflictModal).toBe('function');
  });
});
