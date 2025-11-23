import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FileSystemProvider } from '../FileSystemProvider';
import type { Note } from '../../types';
import type { FileSystemDirectoryHandle, FileSystemFileHandle } from '../FileSystemProvider';

describe('FileSystemProvider', () => {
    let provider: FileSystemProvider;

    // Mock File System Access API
    const mockFileContent = (content: string) => ({
        async text() { return content; }
    });

    const mockFileHandle = (name: string, content: string): FileSystemFileHandle => ({
        kind: 'file' as const,
        name,
        getFile: vi.fn().mockResolvedValue(mockFileContent(content)),
        createWritable: vi.fn().mockResolvedValue({
            write: vi.fn().mockResolvedValue(undefined),
            close: vi.fn().mockResolvedValue(undefined)
        })
    });

    const mockDirectoryHandle = (files: Map<string, string>): FileSystemDirectoryHandle => {
        const entries = Array.from(files.entries()).map(([name, content]) =>
            mockFileHandle(name, content)
        );

        return {
            kind: 'directory' as const,
            name: 'test-folder',
            async *values() {
                for (const entry of entries) {
                    yield entry;
                }
            },
            getFileHandle: vi.fn(async (name: string) => {
                const content = files.get(name) || '';
                return mockFileHandle(name, content);
            }),
            removeEntry: vi.fn().mockResolvedValue(undefined),
            getDirectoryHandle: vi.fn(),
            resolve: vi.fn()
        } as unknown as FileSystemDirectoryHandle;
    };

    // Test data
    const mockNote1: Note = {
        id: 'note-1',
        title: 'Test Note 1',
        content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Content 1' }] }] },
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
        tags: []
    };

    const mockNote1Markdown = `---
id: note-1
title: Test Note 1
createdAt: 2025-01-01T00:00:00.000Z
updatedAt: 2025-01-01T00:00:00.000Z
---
Content 1`;

    beforeEach(() => {


        provider = new FileSystemProvider();
    });

    describe('metadata', () => {
        it('should have correct default metadata when not connected', () => {
            expect(provider.metadata).toMatchObject({
                type: 'fileSystem',
                name: 'File System',
                icon: 'folder',
                isOnline: false
            });
        });

        it('should show folder name when connected', async () => {
            const handle = mockDirectoryHandle(new Map());
            // Accessing private property for testing
            provider['handle'] = handle;

            expect(provider.metadata.name).toBe('test-folder');
        });
    });

    describe('isConnected', () => {
        it('should return false when not connected', () => {
            expect(provider.isConnected()).toBe(false);
        });

        it('should return true when connected', () => {
            const handle = mockDirectoryHandle(new Map());
            // Accessing private property for testing
            provider['handle'] = handle;

            expect(provider.isConnected()).toBe(true);
        });
    });

    describe('connect', () => {
        it('should set handle when folder is selected', async () => {
            const mockHandle = mockDirectoryHandle(new Map());

            // Mock window.showDirectoryPicker
            global.window = {
                showDirectoryPicker: vi.fn().mockResolvedValue(mockHandle)
            } as unknown as Window & typeof globalThis;

            await provider.connect();

            expect(provider.isConnected()).toBe(true);
            expect(window.showDirectoryPicker).toHaveBeenCalled();
        });

        it('should throw if user cancels folder selection', async () => {
            global.window = {
                showDirectoryPicker: vi.fn().mockRejectedValue(new DOMException('User cancelled', 'AbortError'))
            } as unknown as Window & typeof globalThis;

            await expect(provider.connect()).rejects.toThrow();
        });
    });

    describe('disconnect', () => {
        it('should clear handle', async () => {
            const handle = mockDirectoryHandle(new Map());
            // Accessing private property for testing
            provider['handle'] = handle;

            await provider.disconnect();

            expect(provider.isConnected()).toBe(false);
        });
    });

    describe('getNotes', () => {
        it('should throw error when not connected', async () => {
            await expect(provider.getNotes()).rejects.toThrow('File system not connected');
        });

        it('should return empty array when folder has no markdown files', async () => {
            const handle = mockDirectoryHandle(new Map());
            // Accessing private property for testing
            provider['handle'] = handle;

            const notes = await provider.getNotes();
            expect(notes).toEqual([]);
        });

        it('should read markdown files and parse them as notes', async () => {
            const files = new Map([
                ['Test Note 1.md', mockNote1Markdown]
            ]);
            const handle = mockDirectoryHandle(files);
            // Accessing private property for testing
            provider['handle'] = handle;

            const notes = await provider.getNotes();
            expect(notes).toHaveLength(1);
            expect(notes[0].id).toBe('note-1');
            expect(notes[0].title).toBe('Test Note 1');
        });

        it('should skip non markdown files', async () => {
            const files = new Map([
                ['note.txt', 'text file'],
                ['Test Note 1.md', mockNote1Markdown],
                ['image.png', 'binary data']
            ]);
            const handle = mockDirectoryHandle(files);
            // Accessing private property for testing
            provider['handle'] = handle;

            const notes = await provider.getNotes();
            expect(notes).toHaveLength(1);
        });

        it('should handle files with invalid frontmatter gracefully', async () => {
            const invalidMarkdown = 'No frontmatter here';
            const files = new Map([
                ['invalid.md', invalidMarkdown]
            ]);
            const handle = mockDirectoryHandle(files);
            // Accessing private property for testing
            provider['handle'] = handle;

            const notes = await provider.getNotes();
            // Should still create a note with generated data
            expect(notes).toHaveLength(1);
        });

        it('should parse tags from frontmatter', async () => {
            const markdownWithTags = `---
id: note-with-tags
title: Tagged Note
createdAt: 2025-01-01T00:00:00.000Z
updatedAt: 2025-01-01T00:00:00.000Z
tags: work, important
---
Note content`;
            const files = new Map([['tagged.md', markdownWithTags]]);
            const handle = mockDirectoryHandle(files);
            // Accessing private property for testing
            provider['handle'] = handle;

            const notes = await provider.getNotes();
            expect(notes[0].tags).toHaveLength(2);
            expect(notes[0].tags?.map(t => t.name)).toEqual(['work', 'important']);
        });
    });

    describe('saveNote', () => {
        it('should throw error when not connected', async () => {
            await expect(provider.saveNote(mockNote1)).rejects.toThrow('File system not connected');
        });

        it('should create file with markdown content', async () => {
            const files = new Map();
            const handle = mockDirectoryHandle(files);
            // Accessing private property for testing
            provider['handle'] = handle;

            await provider.saveNote(mockNote1);

            expect(handle.getFileHandle).toHaveBeenCalledWith('Test Note 1.md', { create: true });
        });

        it('should sanitize filename with invalid characters', async () => {
            const noteWithBadChars = {
                ...mockNote1,
                title: 'Test/Note:With*Bad?Chars'
            };
            const files = new Map();
            const handle = mockDirectoryHandle(files);
            // Accessing private property for testing
            provider['handle'] = handle;

            await provider.saveNote(noteWithBadChars);

            expect(handle.getFileHandle).toHaveBeenCalledWith(
                expect.stringMatching(/^Test-Note-With-Bad-Chars\.md$/),
                { create: true }
            );
        });

        it('should truncate very long titles', async () => {
            const noteWithLongTitle = {
                ...mockNote1,
                title: 'A'.repeat(200)
            };
            const files = new Map();
            const handle = mockDirectoryHandle(files);
            // Accessing private property for testing
            provider['handle'] = handle;

            await provider.saveNote(noteWithLongTitle);

            const callArgs = (handle.getFileHandle as ReturnType<typeof vi.fn>).mock.calls[0] as string[];
            expect(callArgs[0].length).toBeLessThanOrEqual(103); // 100 chars + .md
        });

        it('should write frontmatter and content to file', async () => {
            const files = new Map();
            const handle = mockDirectoryHandle(files);
            const mockWritable = {
                write: vi.fn().mockResolvedValue(undefined),
                close: vi.fn().mockResolvedValue(undefined)
            };
            const fileHandle = mockFileHandle('test.md', '');
            fileHandle.createWritable = vi.fn().mockResolvedValue(mockWritable);
            handle.getFileHandle = vi.fn().mockResolvedValue(fileHandle);
            // Accessing private property for testing
            provider['handle'] = handle;

            await provider.saveNote(mockNote1);

            expect(mockWritable.write).toHaveBeenCalled();
            const writtenContent = mockWritable.write.mock.calls[0][0];
            expect(writtenContent).toContain('---');
            expect(writtenContent).toContain('id: note-1');
            expect(writtenContent).toContain('title: Test Note 1');
        });
    });

    describe('updateNote', () => {
        it('should call saveNote (same behavior)', async () => {
            const files = new Map();
            const handle = mockDirectoryHandle(files);
            // Accessing private property for testing
            provider['handle'] = handle;
            provider.saveNote = vi.fn();

            await provider.updateNote(mockNote1);

            expect(provider.saveNote).toHaveBeenCalledWith(mockNote1);
        });
    });

    describe('deleteNote', () => {
        it('should throw error when not connected', async () => {
            await expect(provider.deleteNote('note-1')).rejects.toThrow('File system not connected');
        });

        it('should remove the file for the note', async () => {
            const files = new Map([
                ['Test Note 1.md', mockNote1Markdown]
            ]);
            const handle = mockDirectoryHandle(files);
            // Accessing private property for testing
            provider['handle'] = handle;

            await provider.deleteNote('note-1');

            expect(handle.removeEntry).toHaveBeenCalledWith('Test Note 1.md');
        });

        it('should do nothing if note does not exist', async () => {
            const files = new Map();
            const handle = mockDirectoryHandle(files);
            // Accessing private property for testing
            provider['handle'] = handle;

            await expect(provider.deleteNote('non-existent')).resolves.not.toThrow();
        });
    });

    describe('saveAllNotes', () => {
        it('should save each note individually', async () => {
            const files = new Map();
            const handle = mockDirectoryHandle(files);
            // Accessing private property for testing
            provider['handle'] = handle;
            provider.saveNote = vi.fn();

            const notes = [mockNote1, { ...mockNote1, id: 'note-2', title: 'Note 2' }];
            await provider.saveAllNotes(notes);

            expect(provider.saveNote).toHaveBeenCalledTimes(2);
        });
    });

    describe('exportNotes', () => {
        it('should export as JSON', () => {
            const exported = provider.exportNotes([mockNote1]);

            expect(typeof exported).toBe('string');
            expect(JSON.parse(exported)).toEqual([mockNote1]);
        });
    });

    describe('importNotes', () => {
        it('should import valid JSON notes', () => {
            const jsonString = JSON.stringify([mockNote1]);

            const imported = provider.importNotes(jsonString);

            expect(imported).toHaveLength(1);
            expect(imported[0]).toEqual(mockNote1);
        });

        it('should filter out invalid notes', () => {
            const invalidNotes = [
                mockNote1,
                { id: 'invalid', title: 'No content' }
            ];
            const jsonString = JSON.stringify(invalidNotes);

            const imported = provider.importNotes(jsonString);

            expect(imported).toHaveLength(1);
        });
    });

    describe('clear', () => {
        it('should remove all markdown files', async () => {
            const files = new Map([
                ['note1.md', mockNote1Markdown],
                ['note2.md', mockNote1Markdown],
                ['keep.txt', 'text file']
            ]);
            const handle = mockDirectoryHandle(files);
            // Accessing private property for testing
            provider['handle'] = handle;

            await provider.clear();

            expect(handle.removeEntry).toHaveBeenCalledTimes(2);
            expect(handle.removeEntry).toHaveBeenCalledWith('note1.md');
            expect(handle.removeEntry).toHaveBeenCalledWith('note2.md');
            expect(handle.removeEntry).not.toHaveBeenCalledWith('keep.txt');
        });

        it('should do nothing when not connected', async () => {
            await expect(provider.clear()).resolves.not.toThrow();
        });
    });
});
