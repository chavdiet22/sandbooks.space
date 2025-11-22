import { describe, it, expect, vi, beforeEach } from 'vitest';
import { storageService } from './storage';
import { showToast } from '../utils/toast';

// Mock toast
vi.mock('../utils/toast', () => ({
    showToast: {
        error: vi.fn(),
    },
}));

describe('storageService', () => {
    const mockNotes = [
        {
            id: '1',
            title: 'Test Note',
            content: { type: 'doc', content: [] },
            createdAt: '2023-01-01T00:00:00.000Z',
            updatedAt: '2023-01-01T00:00:00.000Z',
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    describe('getNotes', () => {
        it('returns empty array if no data', () => {
            expect(storageService.getNotes()).toEqual([]);
        });

        it('returns parsed notes if data exists', () => {
            localStorage.setItem('sandbooks_notes', JSON.stringify(mockNotes));
            expect(storageService.getNotes()).toEqual(mockNotes);
        });

        it('returns empty array on parse error', () => {
            localStorage.setItem('sandbooks_notes', 'invalid json');
            expect(storageService.getNotes()).toEqual([]);
        });
    });

    describe('saveNotes', () => {
        it('saves notes to localStorage', () => {
            storageService.saveNotes(mockNotes);
            expect(localStorage.getItem('sandbooks_notes')).toEqual(JSON.stringify(mockNotes));
        });

        it('handles QuotaExceededError', () => {
            const quotaError = new DOMException('Quota exceeded', 'QuotaExceededError');
            const originalSetItem = localStorage.setItem;
            localStorage.setItem = vi.fn(() => { throw quotaError; });

            storageService.saveNotes(mockNotes);
            expect(showToast.error).toHaveBeenCalledWith(expect.stringContaining('Storage quota exceeded'));

            localStorage.setItem = originalSetItem;
        });

        it('handles other errors', () => {
            const originalSetItem = localStorage.setItem;
            localStorage.setItem = vi.fn(() => { throw new Error('Unknown error'); });

            storageService.saveNotes(mockNotes);
            expect(showToast.error).toHaveBeenCalledWith('Failed to save notes to local storage');

            localStorage.setItem = originalSetItem;
        });
    });

    describe('exportNotes', () => {
        it('returns formatted JSON string', () => {
            const result = storageService.exportNotes(mockNotes);
            expect(JSON.parse(result)).toEqual(mockNotes);
        });
    });

    describe('importNotes', () => {
        it('imports valid notes', () => {
            const json = JSON.stringify(mockNotes);
            expect(storageService.importNotes(json)).toEqual(mockNotes);
        });

        it('throws error for non-array', () => {
            const json = JSON.stringify({ not: 'an array' });
            expect(() => storageService.importNotes(json)).toThrow('Invalid notes file format');
        });

        it('filters invalid notes', () => {
            const invalidNotes = [
                ...mockNotes,
                { id: '2', title: 'Invalid' }, // Missing content, dates
            ];
            const json = JSON.stringify(invalidNotes);
            expect(storageService.importNotes(json)).toEqual(mockNotes);
        });

        it('throws error for invalid JSON', () => {
            expect(() => storageService.importNotes('invalid')).toThrow('Invalid notes file format');
        });
    });

    describe('clear', () => {
        it('removes notes from localStorage', () => {
            localStorage.setItem('sandbooks_notes', 'data');
            storageService.clear();
            expect(localStorage.getItem('sandbooks_notes')).toBeNull();
        });
    });
});
