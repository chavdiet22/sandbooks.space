import type { Note } from '../types';
import { nanoid } from 'nanoid';
import { serializeToMarkdown, parseMarkdown } from '../utils/markdownSerializer';
import type { JSONContent } from '@tiptap/core';

export interface FileSystemHandle {
    kind: 'file' | 'directory';
    name: string;
}

export interface FileSystemFileHandle extends FileSystemHandle {
    kind: 'file';
    getFile(): Promise<File>;
    createWritable(): Promise<FileSystemWritableFileStream>;
}

export interface FileSystemDirectoryHandle extends FileSystemHandle {
    kind: 'directory';
    getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<FileSystemDirectoryHandle>;
    getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>;
    removeEntry(name: string, options?: { recursive?: boolean }): Promise<void>;
    resolve(possibleDescendant: FileSystemHandle): Promise<string[] | null>;
    values(): AsyncIterableIterator<FileSystemHandle>;
}

interface FileSystemWritableFileStream extends WritableStream {
    write(data: string | BufferSource | Blob): Promise<void>;
    seek(position: number): Promise<void>;
    truncate(size: number): Promise<void>;
    close(): Promise<void>;
}

export class FileSystemStorageService {
    private rootHandle: FileSystemDirectoryHandle | null = null;

    constructor(handle?: FileSystemDirectoryHandle) {
        this.rootHandle = handle || null;
    }

    setRootHandle(handle: FileSystemDirectoryHandle) {
        this.rootHandle = handle;
    }

    getRootHandle(): FileSystemDirectoryHandle | null {
        return this.rootHandle;
    }

    async getNotes(): Promise<Note[]> {
        if (!this.rootHandle) {
            throw new Error('No root handle set');
        }

        const notes: Note[] = [];

        // Recursive function to walk directories
        const walk = async (dirHandle: FileSystemDirectoryHandle, path: string = '') => {
            for await (const entry of dirHandle.values()) {
                if (entry.kind === 'file' && entry.name.endsWith('.md')) {
                    try {
                        const fileHandle = entry as FileSystemFileHandle;
                        const file = await fileHandle.getFile();
                        const text = await file.text();
                        const note = this.parseNoteFile(text, entry.name, path);
                        notes.push(note);
                    } catch (e) {
                        console.error(`Failed to parse note ${entry.name}:`, e);
                    }
                } else if (entry.kind === 'directory' && !entry.name.startsWith('.')) {
                    // Skip hidden directories
                    const subDir = entry as FileSystemDirectoryHandle;
                    await walk(subDir, path ? `${path}/${entry.name}` : entry.name);
                }
            }
        };

        await walk(this.rootHandle);
        return notes;
    }

    async saveNote(note: Note): Promise<void> {
        if (!this.rootHandle) {
            throw new Error('No root handle set');
        }

        // For now, we save everything in the root or flat, 
        // but we should respect the note's path if we add that property later.
        // We'll use the note ID as filename if no title, or sanitize the title.
        const filename = this.getFilenameForNote(note);

        try {
            const fileHandle = await this.rootHandle.getFileHandle(filename, { create: true });
            const writable = await fileHandle.createWritable();
            const content = this.serializeNote(note);
            await writable.write(content);
            await writable.close();
        } catch (error) {
            console.error('Failed to save note to file system:', error);
            throw error;
        }
    }

    async deleteNote(note: Note): Promise<void> {
        if (!this.rootHandle) {
            throw new Error('No root handle set');
        }
        const filename = this.getFilenameForNote(note);
        try {
            await this.rootHandle.removeEntry(filename);
        } catch (error) {
            // If file doesn't exist, that's fine
            console.warn('Failed to delete file (might not exist):', filename, error);
        }
    }

    private getFilenameForNote(note: Note): string {
        // Use ID in filename to ensure uniqueness if we want, 
        // OR use title. For a "user friendly" system, Title.md is better,
        // but requires handling duplicates.
        // For this MVP, let's use "Title.md" and if it conflicts... well, 
        // we might overwrite. 
        // Better: "Title (ID).md" or just "Title.md" and we assume the user manages names.
        // Let's stick to a safe approach: Title.md. 
        // If the title changes, we might leave an orphan file? 
        // This is the hard part of file-based sync.
        // Strategy: We will use the Note ID as the filename for stability in this version,
        // UNLESS we implement a full renaming logic. 
        // Wait, users want "Data Portability". "uuid.md" is ugly.
        // Let's try to use "Title.md".

        const sanitizedTitle = note.title.replace(/[^a-z0-9\s-_]/gi, '').trim() || 'Untitled';
        return `${sanitizedTitle}.md`;
    }

    private parseNoteFile(content: string, filename: string, _path: string): Note {
        // Simple frontmatter parser
        const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
        const match = content.match(frontmatterRegex);

        const metadata: Record<string, string> = {};
        let body = content;

        if (match) {
            const yaml = match[1];
            body = match[2];

            yaml.split('\n').forEach(line => {
                const [key, ...values] = line.split(':');
                if (key && values.length) {
                    metadata[key.trim()] = values.join(':').trim();
                }
            });
        }

        // If no ID in metadata, generate one (this is tricky for sync, 
        // but for local-first, the file IS the source of truth).
        // If we generate a new ID every time, we lose react state continuity.
        // We should try to store the ID in frontmatter.

        return {
            id: metadata.id || nanoid(),
            title: metadata.title || filename.replace('.md', ''),
            content: this.markdownToProseMirror(body), // We need a converter here!
            createdAt: metadata.createdAt || new Date().toISOString(),
            updatedAt: metadata.updatedAt || new Date().toISOString(),
            tags: metadata.tags ? metadata.tags.split(',').map((t: string) => ({
                id: nanoid(),
                name: t.trim(),
                color: 'gray' as const,
                createdAt: Date.now(),
                updatedAt: Date.now()
            })) : [],
        };
    }

    private serializeNote(note: Note): string {
        const frontmatter = [
            '---',
            `id: ${note.id}`,
            `title: ${note.title}`,
            `createdAt: ${note.createdAt}`,
            `updatedAt: ${note.updatedAt}`,
            `tags: ${note.tags?.map(t => t.name).join(', ') || ''}`,
            '---',
            ''
        ].join('\n');

        const body = this.proseMirrorToMarkdown(note.content);
        return frontmatter + body;
    }

    private markdownToProseMirror(markdown: string): JSONContent {
        return parseMarkdown(markdown);
    }

    private proseMirrorToMarkdown(content: JSONContent): string {
        return serializeToMarkdown(content);
    }
}
