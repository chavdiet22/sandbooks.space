import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storageManager, storageService } from '../storageManager';
import { LocalStorageProvider } from '../LocalStorageProvider';
import { FileSystemProvider } from '../FileSystemProvider';
import type { Note } from '../../types';

describe('StorageManager', () => {
    const mockNote: Note = {
        id: 'test-note-1',
        title: 'Test Note',
        content: { type: 'doc', content: [] },
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
        tags: ['test']
    };

    beforeEach(() => {
        vi.clearAllMocks();
        // Reset to default provider
        storageManager.setProvider(new LocalStorageProvider());
    });

    describe('getProvider', () => {
        it('should return the current storage provider', () => {
            const provider = storageManager.getProvider();
            expect(provider).toBeInstanceOf(LocalStorageProvider);
        });
    });

    describe('setProvider', () => {
        it('should switch to a different provider', () => {
            const fileSystemProvider = new FileSystemProvider();
            storageManager.setProvider(fileSystemProvider);

            const provider = storageManager.getProvider();
            expect(provider).toBeInstanceOf(FileSystemProvider);
        });

        it('should switch back to localStorage provider', () => {
            const fileSystemProvider = new FileSystemProvider();
            storageManager.setProvider(fileSystemProvider);

            const localProvider = new LocalStorageProvider();
            storageManager.setProvider(localProvider);

            const provider = storageManager.getProvider();
            expect(provider).toBeInstanceOf(LocalStorageProvider);
        });
    });

    describe('delegation methods', () => {
        it('should delegate getNotes to active provider', async () => {
            const provider = storageManager.getProvider();
            const spy = vi.spyOn(provider, 'getNotes').mockResolvedValue([mockNote]);

            const notes = await storageManager.getNotes();

            expect(spy).toHaveBeenCalled();
            expect(notes).toEqual([mockNote]);
        });

        it('should delegate saveNote to active provider', async () => {
            const provider = storageManager.getProvider();
            const spy = vi.spyOn(provider, 'saveNote').mockResolvedValue(undefined);

            await storageManager.saveNote(mockNote);

            expect(spy).toHaveBeenCalledWith(mockNote);
        });

        it('should delegate deleteNote to active provider', async () => {
            const provider = storageManager.getProvider();
            const spy = vi.spyOn(provider, 'deleteNote').mockResolvedValue(undefined);

            await storageManager.deleteNote('test-id');

            expect(spy).toHaveBeenCalledWith('test-id');
        });

        it('should delegate saveAllNotes to active provider', async () => {
            const provider = storageManager.getProvider();
            const spy = vi.spyOn(provider, 'saveAllNotes').mockResolvedValue(undefined);

            await storageManager.saveAllNotes([mockNote]);

            expect(spy).toHaveBeenCalledWith([mockNote]);
        });

        it('should delegate exportNotes to active provider', () => {
            const provider = storageManager.getProvider();
            const spy = vi.spyOn(provider, 'exportNotes').mockReturnValue('exported-data');

            const result = storageManager.exportNotes([mockNote]);

            expect(spy).toHaveBeenCalledWith([mockNote]);
            expect(result).toBe('exported-data');
        });

        it('should delegate importNotes to active provider', () => {
            const provider = storageManager.getProvider();
            const spy = vi.spyOn(provider, 'importNotes').mockReturnValue([mockNote]);

            const result = storageManager.importNotes('import-data');

            expect(spy).toHaveBeenCalledWith('import-data');
            expect(result).toEqual([mockNote]);
        });

        it('should delegate clear to active provider', async () => {
            const provider = storageManager.getProvider();
            const spy = vi.spyOn(provider, 'clear').mockResolvedValue(undefined);

            await storageManager.clear();

            expect(spy).toHaveBeenCalled();
        });

        it('should delegate getMetadata to active provider', () => {
            const provider = storageManager.getProvider();
            const metadata = storageManager.getMetadata();

            expect(metadata).toBe(provider.metadata);
            expect(metadata.type).toBe('localStorage');
        });

        it('should return fileSystem metadata after switching provider', () => {
            const fileSystemProvider = new FileSystemProvider();
            storageManager.setProvider(fileSystemProvider);

            const metadata = storageManager.getMetadata();
            expect(metadata.type).toBe('fileSystem');
        });
    });

    describe('storageService (backward compatibility)', () => {
        it('should export storageService as an alias', () => {
            expect(storageService).toBe(storageManager);
        });
    });
});
