import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { matchesShortcut, isMac, getModifierSymbol, formatShortcut, isMobile, isLocalExecutionSupported } from '../platform';

describe('Platform Utilities', () => {
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

    describe('isMac', () => {
        it('should return true for MacIntel', () => {
            setPlatform('MacIntel');
            expect(isMac()).toBe(true);
        });

        it('should return true for iPhone', () => {
            setPlatform('iPhone');
            expect(isMac()).toBe(true);
        });

        it('should return false for Windows', () => {
            setPlatform('Win32');
            expect(isMac()).toBe(false);
        });

        it('should return false for Linux', () => {
            setPlatform('Linux x86_64');
            expect(isMac()).toBe(false);
        });
    });

    describe('getModifierSymbol', () => {
        it('should return Mac symbols', () => {
            setPlatform('MacIntel');
            expect(getModifierSymbol('mod')).toBe('⌘');
            expect(getModifierSymbol('alt')).toBe('⌥');
            expect(getModifierSymbol('shift')).toBe('⇧');
            expect(getModifierSymbol('ctrl')).toBe('^');
        });

        it('should return Windows/Linux symbols', () => {
            setPlatform('Win32');
            expect(getModifierSymbol('mod')).toBe('Ctrl');
            expect(getModifierSymbol('alt')).toBe('Alt');
            expect(getModifierSymbol('shift')).toBe('Shift');
            expect(getModifierSymbol('ctrl')).toBe('Ctrl');
        });

        it('should return empty string for unknown modifier', () => {
            expect(getModifierSymbol('unknown' as Parameters<typeof getModifierSymbol>[0])).toBe('');
        });
    });

    describe('formatShortcut', () => {
        it('should format shortcuts for Mac', () => {
            setPlatform('MacIntel');
            expect(formatShortcut(['mod', 'shift', 'k'])).toBe('⌘⇧K');
            expect(formatShortcut(['ctrl', 'alt', 'delete'])).toBe('^⌥⌦');
            expect(formatShortcut(['enter', 'backspace', 'escape'])).toBe('↵⌫⎋');
        });

        it('should format shortcuts for Windows', () => {
            setPlatform('Win32');
            expect(formatShortcut(['mod', 'shift', 'k'])).toBe('Ctrl+Shift+K');
            expect(formatShortcut(['ctrl', 'alt', 'delete'])).toBe('Ctrl+Alt+Delete');
        });
    });

    describe('matchesShortcut', () => {
        const mockEvent = (overrides: Partial<KeyboardEvent>) => ({
            key: 'k',
            ctrlKey: false,
            metaKey: false,
            altKey: false,
            shiftKey: false,
            code: 'KeyK',
            ...overrides,
        } as KeyboardEvent);

        it('should match simple keys', () => {
            expect(matchesShortcut(mockEvent({ key: 'a' }), 'a')).toBe(true);
        });

        it('should match mod+k on Mac (Cmd+K)', () => {
            setPlatform('MacIntel');
            const event = mockEvent({ key: 'k', metaKey: true });
            expect(matchesShortcut(event, 'mod+k')).toBe(true);
        });

        it('should match mod+k on Windows (Ctrl+K)', () => {
            setPlatform('Win32');
            const event = mockEvent({ key: 'k', ctrlKey: true });
            expect(matchesShortcut(event, 'mod+k')).toBe(true);
        });

        it('should NOT match mod+k if wrong modifier is pressed on Mac', () => {
            setPlatform('MacIntel');
            const event = mockEvent({ key: 'k', ctrlKey: true }); // Ctrl+K on Mac
            expect(matchesShortcut(event, 'mod+k')).toBe(false);
        });

        it('should match mod+alt+n on Mac (Cmd+Alt+N)', () => {
            setPlatform('MacIntel');
            const event = mockEvent({ key: 'n', metaKey: true, altKey: true });
            expect(matchesShortcut(event, 'mod+alt+n')).toBe(true);
        });

        it('should match mod+alt+n on Windows (Ctrl+Alt+N)', () => {
            setPlatform('Win32');
            const event = mockEvent({ key: 'n', ctrlKey: true, altKey: true });
            expect(matchesShortcut(event, 'mod+alt+n')).toBe(true);
        });

        it('should match ctrl+` specifically', () => {
            const event = mockEvent({ key: '`', ctrlKey: true });
            expect(matchesShortcut(event, 'ctrl+`')).toBe(true);
        });

        it('should match using event.code fallback (Mac Option key behavior)', () => {
            setPlatform('MacIntel');
            // Simulate Option+N producing '˜' but code is 'KeyN'
            const event = mockEvent({ key: '˜', code: 'KeyN', altKey: true });
            expect(matchesShortcut(event, 'alt+n')).toBe(true);
        });
    });

    describe('isMobile', () => {
        const setUserAgent = (userAgent: string) => {
            Object.defineProperty(window.navigator, 'userAgent', {
                value: userAgent,
                configurable: true,
            });
        };

        it('returns false for desktop Chrome', () => {
            setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
            expect(isMobile()).toBe(false);
        });

        it('returns true for iPhone', () => {
            setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1');
            expect(isMobile()).toBe(true);
        });

        it('returns true for iPad', () => {
            setUserAgent('Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1');
            expect(isMobile()).toBe(true);
        });

        it('returns true for Android', () => {
            setUserAgent('Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36');
            expect(isMobile()).toBe(true);
        });

        it('returns false for desktop Firefox', () => {
            setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0');
            expect(isMobile()).toBe(false);
        });
    });

    describe('isLocalExecutionSupported', () => {
        const setUserAgent = (userAgent: string) => {
            Object.defineProperty(window.navigator, 'userAgent', {
                value: userAgent,
                configurable: true,
            });
        };

        it('returns true for desktop browser', async () => {
            setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
            const result = await isLocalExecutionSupported();
            expect(result).toBe(true);
        });

        it('returns false for mobile browser', async () => {
            setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15');
            const result = await isLocalExecutionSupported();
            expect(result).toBe(false);
        });
    });
});
