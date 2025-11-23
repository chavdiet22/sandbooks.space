import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LocalStorageProvider } from '../LocalStorageProvider';
import type { Note } from '../../types';

describe('LocalStorageProvider', () => {
    let provider: LocalStorageProvider;
    const STORAGE_KEY = 'sandbooks_notes';

    // Test data
    const mockNote1: Note = {
        id: 'note-1',
        title: 'Test Note 1',
        content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Content 1' }] }] },
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
        tags: []
    };

    const mockNote2: Note = {
        id: 'note-2',
        title: 'Test Note 2',
        content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Content 2' }] }] },
        createdAt: '2025-01-02T00:00:00.000Z',
        updatedAt: '2025-01-02T00:00:00.000Z',
        tags: [{
            id: 'tag-1',
            name: 'test',
            color: 'blue',
            createdAt: Date.now(),
            updatedAt: Date.now()
        }]
    };

    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
        provider = new LocalStorageProvider();
    });

    afterEach(() => {
        localStorage.clear();
    });

    describe('metadata', () => {
        it('should have correct metadata', () => {
            expect(provider.metadata).toEqual({
                type: 'localStorage',
                name: 'Local Storage',
                icon: 'computer',
                isOnline: false
            });
        });
    });

    describe('isConnected', () => {
        it('should always return true', () => {
            expect(provider.isConnected()).toBe(true);
        });
    });

    describe('getNotes', () => {
        it('should return empty array when no notes exist', async () => {
            const notes = await provider.getNotes();
            expect(notes).toEqual([]);
        });

        it('should return stored notes', async () => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify([mockNote1, mockNote2]));

            const notes = await provider.getNotes();
            expect(notes).toHaveLength(2);
            expect(notes[0]).toEqual(mockNote1);
            expect(notes[1]).toEqual(mockNote2);
        });

        it('should handle corrupted data gracefully', async () => {
            localStorage.setItem(STORAGE_KEY, 'invalid json');

            const notes = await provider.getNotes();
            expect(notes).toEqual([]);
        });

        it('should handle null data', async () => {
            localStorage.setItem(STORAGE_KEY, 'null');

            const notes = await provider.getNotes();
            expect(notes).toEqual([]);
        });
    });

    describe('saveNote', () => {
        it('should add new note when it does not exist', async () => {
            await provider.saveNote(mockNote1);

            const notes = await provider.getNotes();
            expect(notes).toHaveLength(1);
            expect(notes[0]).toEqual(mockNote1);
        });

        it('should update existing note when id matches', async () => {
            await provider.saveNote(mockNote1);

            const updatedNote = { ...mockNote1, title: 'Updated Title' };
            await provider.saveNote(updatedNote);

            const notes = await provider.getNotes();
            expect(notes).toHaveLength(1);
            expect(notes[0].title).toBe('Updated Title');
        });

        it('should add multiple notes', async () => {
            await provider.saveNote(mockNote1);
            await provider.saveNote(mockNote2);

            const notes = await provider.getNotes();
            expect(notes).toHaveLength(2);
        });
    });

    describe('updateNote', () => {
        it('should update an existing note', async () => {
            await provider.saveNote(mockNote1);

            const updatedNote = { ...mockNote1, title: 'Updated via update method' };
            await provider.updateNote(updatedNote);

            const notes = await provider.getNotes();
            expect(notes[0].title).toBe('Updated via update method');
        });

        it('should add note if it does not exist (upsert behavior)', async () => {
            await provider.updateNote(mockNote1);

            const notes = await provider.getNotes();
            expect(notes).toHaveLength(1);
            expect(notes[0]).toEqual(mockNote1);
        });
    });

    describe('deleteNote', () => {
        it('should delete existing note by ID', async () => {
            await provider.saveNote(mockNote1);
            await provider.saveNote(mockNote2);

            await provider.deleteNote('note-1');

            const notes = await provider.getNotes();
            expect(notes).toHaveLength(1);
            expect(notes[0].id).toBe('note-2');
        });

        it('should do nothing if note ID does not exist', async () => {
            await provider.saveNote(mockNote1);

            await provider.deleteNote('non-existent-id');

            const notes = await provider.getNotes();
            expect(notes).toHaveLength(1);
        });

        it('should handle deleting from empty storage', async () => {
            await expect(provider.deleteNote('note-1')).resolves.not.toThrow();

            const notes = await provider.getNotes();
            expect(notes).toEqual([]);
        });
    });

    describe('saveAllNotes', () => {
        it('should save multiple notes at once', async () => {
            await provider.saveAllNotes([mockNote1, mockNote2]);

            const notes = await provider.getNotes();
            expect(notes).toHaveLength(2);
        });

        it('should replace existing notes', async () => {
            await provider.saveNote(mockNote1);

            await provider.saveAllNotes([mockNote2]);

            const notes = await provider.getNotes();
            expect(notes).toHaveLength(1);
            expect(notes[0].id).toBe('note-2');
        });

        it('should handle empty array', async () => {
            await provider.saveAllNotes([]);

            const notes = await provider.getNotes();
            expect(notes).toEqual([]);
        });
    });

    describe('exportNotes', () => {
        it('should export notes as formatted JSON string', () => {
            const exported = provider.exportNotes([mockNote1, mockNote2]);

            expect(typeof exported).toBe('string');
            expect(JSON.parse(exported)).toEqual([mockNote1, mockNote2]);
            // Check that it's pretty-printed (has newlines)
            expect(exported).toContain('\n');
        });

        it('should handle empty array', () => {
            const exported = provider.exportNotes([]);

            expect(JSON.parse(exported)).toEqual([]);
        });
    });

    describe('importNotes', () => {
        it('should import valid JSON notes', () => {
            const jsonString = JSON.stringify([mockNote1, mockNote2]);

            const imported = provider.importNotes(jsonString);

            expect(imported).toHaveLength(2);
            expect(imported[0]).toEqual(mockNote1);
            expect(imported[1]).toEqual(mockNote2);
        });

        it('should filter out invalid notes (missing required fields)', () => {
            const invalidNotes = [
                mockNote1,
                { id: 'invalid', title: 'No content field' }, // Missing content
                mockNote2
            ];
            const jsonString = JSON.stringify(invalidNotes);

            const imported = provider.importNotes(jsonString);

            expect(imported).toHaveLength(2);
            expect(imported.map(n => n.id)).toEqual(['note-1', 'note-2']);
        });

        it('should throw error for invalid JSON format', () => {
            expect(() => provider.importNotes('invalid json')).toThrow('Invalid notes file format');
        });

        it('should throw error for non-array JSON', () => {
            expect(() => provider.importNotes('{"not": "an array"}')).toThrow('Invalid format: expected an array of notes');
        });

        it('should handle notes without optional fields', () => {
            const minimalNote = {
                id: 'minimal',
                title: 'Minimal',
                content: { type: 'doc', content: [] },
                createdAt: '2025-01-01T00:00:00.000Z',
                updatedAt: '2025-01-01T00:00:00.000Z'
            };
            const jsonString = JSON.stringify([minimalNote]);

            const imported = provider.importNotes(jsonString);

            expect(imported).toHaveLength(1);
            expect(imported[0].id).toBe('minimal');
        });
    });

    describe('clear', () => {
        it('should remove all notes from localStorage', async () => {
            await provider.saveAllNotes([mockNote1, mockNote2]);

            await provider.clear();

            const notes = await provider.getNotes();
            expect(notes).toEqual([]);
            expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
        });

        it('should not throw when clearing empty storage', async () => {
            await expect(provider.clear()).resolves.not.toThrow();
        });
    });

    describe('storage quota exceeded', () => {
        it('should handle quota exceeded error gracefully', async () => {
            // Mock localStorage.setItem to throw quota exceeded error
            const originalSetItem = localStorage.setItem;
            vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
                const error = new DOMException('QuotaExceededError', 'QuotaExceededError');
                throw error;
            });

            await expect(provider.saveNote(mockNote1)).rejects.toThrow();

            // Restore original
            localStorage.setItem = originalSetItem;
        });
    });

    describe('concurrent operations', () => {
        it('should handle concurrent saves correctly', async () => {
            const note1 = { ...mockNote1, id: 'concurrent-1' };
            const note2 = { ...mockNote2, id: 'concurrent-2' };

            // Save concurrently
            await Promise.all([
                provider.saveNote(note1),
                provider.saveNote(note2)
            ]);

            const notes = await provider.getNotes();
            expect(notes).toHaveLength(2);
            expect(notes.map(n => n.id).sort()).toEqual(['concurrent-1', 'concurrent-2']);
        });
    });
});
