import { LocalStorageProvider } from './LocalStorageProvider';
import type { StorageProvider } from './StorageProvider';
import type { Note } from '../types';

/**
 * Storage Provider Manager
 * Manages the active storage provider instance
 */
class StorageProviderManager {
    private provider: StorageProvider;

    constructor() {
        // Default to localStorage
        this.provider = new LocalStorageProvider();
    }

    getProvider(): StorageProvider {
        return this.provider;
    }

    setProvider(provider: StorageProvider): void {
        this.provider = provider;
    }

    // Convenience methods that delegate to active provider
    async getNotes() {
        return this.provider.getNotes();
    }

    async saveNote(note: Note) {
        return this.provider.saveNote(note);
    }

    async deleteNote(noteId: string) {
        return this.provider.deleteNote(noteId);
    }

    async saveAllNotes(notes: Note[]) {
        return this.provider.saveAllNotes(notes);
    }

    exportNotes(notes: Note[]) {
        return this.provider.exportNotes(notes);
    }

    importNotes(data: string) {
        return this.provider.importNotes(data);
    }

    async clear() {
        return this.provider.clear();
    }

    getMetadata() {
        return this.provider.metadata;
    }
}

// Singleton instance
export const storageManager = new StorageProviderManager();

// Export for backward compatibility
export const storageService = storageManager;
