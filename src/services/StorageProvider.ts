import type { Note } from '../types';

/**
 * Storage Provider Types
 */
export type StorageProviderType = 'localStorage' | 'fileSystem' | 'cloud';

/**
 * Metadata about the storage provider for UI display
 */
export interface StorageProviderMetadata {
    type: StorageProviderType;
    name: string;        // "Local Storage", "My Notes Folder", "Dropbox"
    icon: string;        // Icon identifier for UI
    isOnline: boolean;   // For future cloud sync capabilities
}

/**
 * Unified interface for all storage providers
 * Implements Strategy Pattern for swappable storage backends
 */
export interface StorageProvider {
    /**
     * Metadata about this provider for UI display
     */
    readonly metadata: StorageProviderMetadata;

    /**
     * Get all notes from storage
     */
    getNotes(): Promise<Note[]>;

    /**
     * Save a single note (create or update)
     */
    saveNote(note: Note): Promise<void>;

    /**
     * Update an existing note
     */
    updateNote(note: Note): Promise<void>;

    /**
     * Delete a note by ID
     */
    deleteNote(noteId: string): Promise<void>;

    /**
     * Save all notes (batch operation)
     */
    saveAllNotes(notes: Note[]): Promise<void>;

    /**
     * Export notes to JSON string
     */
    exportNotes(notes: Note[]): string;

    /**
     * Import notes from JSON string
     */
    importNotes(data: string): Note[];

    /**
     * Clear all data from storage
     */
    clear(): Promise<void>;

    /**
     * Optional: Connect to the storage (e.g., pick folder, authenticate)
     */
    connect?(): Promise<void>;

    /**
     * Optional: Disconnect from storage
     */
    disconnect?(): Promise<void>;

    /**
     * Check if provider is currently connected/available
     */
    isConnected(): boolean;
}
