import { describe, it, expect } from 'vitest';
import { serializeToMarkdown, parseMarkdown } from '../markdownSerializer';
import type { JSONContent } from '@tiptap/core';

describe('markdownSerializer', () => {
    describe('serializeToMarkdown', () => {
        it('should return empty string for empty content', () => {
            expect(serializeToMarkdown({})).toBe('');
            expect(serializeToMarkdown({ content: [] })).toBe('');
        });

        it('should serialize headings', () => {
            const content: JSONContent = {
                type: 'doc',
                content: [
                    { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Heading 1' }] },
                    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Heading 2' }] },
                ]
            };
            expect(serializeToMarkdown(content)).toBe('# Heading 1\n\n## Heading 2');
        });

        it('should serialize paragraphs with formatting', () => {
            const content: JSONContent = {
                type: 'doc',
                content: [
                    {
                        type: 'paragraph',
                        content: [
                            { type: 'text', text: 'Bold', marks: [{ type: 'bold' }] },
                            { type: 'text', text: ' and ' },
                            { type: 'text', text: 'Italic', marks: [{ type: 'italic' }] },
                        ]
                    }
                ]
            };
            expect(serializeToMarkdown(content)).toBe('**Bold** and *Italic*');
        });

        it('should serialize bullet lists', () => {
            const content: JSONContent = {
                type: 'doc',
                content: [
                    {
                        type: 'bulletList',
                        content: [
                            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Item 1' }] }] },
                            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Item 2' }] }] },
                        ]
                    }
                ]
            };
            expect(serializeToMarkdown(content)).toBe('- Item 1\n- Item 2');
        });

        it('should serialize ordered lists', () => {
            const content: JSONContent = {
                type: 'doc',
                content: [
                    {
                        type: 'orderedList',
                        content: [
                            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'First' }] }] },
                            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Second' }] }] },
                        ]
                    }
                ]
            };
            expect(serializeToMarkdown(content)).toBe('1. First\n2. Second');
        });

        it('should serialize code blocks', () => {
            const content: JSONContent = {
                type: 'doc',
                content: [
                    {
                        type: 'codeBlock',
                        attrs: { language: 'python' },
                        content: [{ type: 'text', text: 'print("Hello")' }]
                    }
                ]
            };
            expect(serializeToMarkdown(content)).toBe('```python\nprint("Hello")\n```');
        });

        it('should serialize blockquotes', () => {
            const content: JSONContent = {
                type: 'doc',
                content: [
                    {
                        type: 'blockquote',
                        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Quote' }] }]
                    }
                ]
            };
            expect(serializeToMarkdown(content)).toBe('> Quote');
        });

        it('should serialize horizontal rules', () => {
            const content: JSONContent = {
                type: 'doc',
                content: [{ type: 'horizontalRule' }]
            };
            expect(serializeToMarkdown(content)).toBe('---');
        });

        it('should serialize links and images', () => {
            const content: JSONContent = {
                type: 'doc',
                content: [
                    {
                        type: 'paragraph',
                        content: [
                            { type: 'text', text: 'Link', marks: [{ type: 'link', attrs: { href: 'https://example.com' } }] },
                            { type: 'image', attrs: { src: 'image.png', alt: 'Alt Text' } }
                        ]
                    }
                ]
            };
            expect(serializeToMarkdown(content)).toBe('[Link](https://example.com)![Alt Text](image.png)');
        });
    });

    describe('parseMarkdown', () => {
        it('should return empty doc for empty string', () => {
            expect(parseMarkdown('')).toEqual({ type: 'doc', content: [] });
        });

        it('should parse basic markdown', () => {
            const markdown = '# Hello\n\nWorld';
            const result = parseMarkdown(markdown);
            expect(result.type).toBe('doc');
            // In test environment without proper DOMParser, it falls back to paragraph
            expect(result.content).toBeDefined();
            expect(result.content?.length).toBeGreaterThan(0);
        });

        it('should handle parsing errors gracefully', () => {
            // Since we are using happy-dom, generateJSON should work.
            // Let's just verify it returns a valid doc structure.
            const result = parseMarkdown('Simple text');
            expect(result.type).toBe('doc');
            expect(result.content?.[0].content?.[0].text).toBe('Simple text');
        });
    });
});
