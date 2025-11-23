import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { matchesShortcut } from '../platform';

describe('matchesShortcut', () => {
    const mockEvent = (overrides: Partial<KeyboardEvent>) => ({
        key: 'k',
        code: 'KeyK',
        ctrlKey: false,
        metaKey: false,
        altKey: false,
        shiftKey: false,
        ...overrides,
    } as KeyboardEvent);

    const setPlatform = (platform: string) => {
        Object.defineProperty(window.navigator, 'platform', {
            value: platform,
            configurable: true,
        });
    };

    beforeEach(() => {
        setPlatform('Win32');
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    // ... existing tests ...

    it('should match mod+alt+n on Mac even if key is special char (˜)', () => {
        setPlatform('MacIntel');
        // On Mac, Option+N produces '˜' (tilde)
        const event = mockEvent({
            key: '˜',
            code: 'KeyN',
            metaKey: true,
            altKey: true
        });
        expect(matchesShortcut(event, 'mod+alt+n')).toBe(true);
    });
});
