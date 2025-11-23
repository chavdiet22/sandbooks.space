import { describe, it, expect } from 'vitest';
import { createDefaultDocumentation } from '../defaultDocumentation';

describe('createDefaultDocumentation', () => {
    it('should generate valid notes', () => {
        const notes = createDefaultDocumentation();
        expect(notes).toBeInstanceOf(Array);
        expect(notes.length).toBeGreaterThan(0);

        notes.forEach((note) => {
            // Check required fields
            expect(note).toHaveProperty('id');
            expect(typeof note.id).toBe('string');

            expect(note).toHaveProperty('title');
            expect(typeof note.title).toBe('string');

            expect(note).toHaveProperty('content');
            expect(typeof note.content).toBe('object');

            expect(note).toHaveProperty('createdAt');
            // Note: createdAt in Note interface is string (ISO), but createDefaultDocumentation might return something else?
            // Let's check the implementation. It returns ISO string for note.createdAt.
            expect(typeof note.createdAt).toBe('string');

            expect(note).toHaveProperty('updatedAt');
            expect(typeof note.updatedAt).toBe('string');

            // Check tags if present
            if (note.tags) {
                expect(Array.isArray(note.tags)).toBe(true);
                note.tags.forEach(tag => {
                    expect(tag).toHaveProperty('id');
                    expect(tag).toHaveProperty('name');
                    expect(tag).toHaveProperty('color');
                    expect(tag).toHaveProperty('createdAt');
                    expect(typeof tag.createdAt).toBe('number');
                });
            }

            // Check codeBlocks if present
            if (note.codeBlocks) {
                expect(Array.isArray(note.codeBlocks)).toBe(true);
                note.codeBlocks.forEach(block => {
                    expect(block).toHaveProperty('id');
                    expect(block).toHaveProperty('code');
                    expect(block).toHaveProperty('language');
                    expect(block).toHaveProperty('createdAt');
                    expect(typeof block.createdAt).toBe('number');
                });
            }
        });
    });

    it('should generate valid Tiptap JSON content', () => {
        const notes = createDefaultDocumentation();
        notes.forEach(note => {
            expect(note.content).toHaveProperty('type', 'doc');
            expect(note.content).toHaveProperty('content');
            expect(Array.isArray(note.content.content)).toBe(true);
        });
    });
});
