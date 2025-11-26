/**
 * Payload Mappers tests.
 */
import { describe, it, expect, vi } from 'vitest';
import { faker } from '@faker-js/faker';
import type { JSONContent } from '@tiptap/react';
import type { Note } from '../../../types';
import { NodeType, InlineType, LanguageCode, ColorCode, type PayloadInline } from '../../../types/payload.types';
import {
  noteToPayload,
  payloadToNote,
  nodeToPayload,
  payloadToNode,
  inlinesToPayload,
  payloadToInlines,
  countPayloadNodes,
  validatePayloadStructure,
} from '../mappers';

// Factory functions
function createNote(overrides: Partial<Note> = {}): Note {
  return {
    id: faker.string.uuid(),
    title: 'Test Note',
    content: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Hello World' }],
        },
      ],
    },
    createdAt: new Date('2025-01-15T12:00:00Z').toISOString(),
    updatedAt: new Date('2025-01-15T13:00:00Z').toISOString(),
    ...overrides,
  };
}

describe('payload mappers', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('noteToPayload', () => {
    it('should convert note to payload format', () => {
      const note = createNote();
      const payload = noteToPayload(note);

      expect(payload.v).toBe(1);
      expect(payload.c).toBe(Math.floor(new Date(note.createdAt).getTime() / 1000));
      expect(payload.u).toBe(Math.floor(new Date(note.updatedAt).getTime() / 1000));
      expect(payload.n).toHaveLength(1);
    });

    it('should omit default title', () => {
      const note = createNote({ title: 'Untitled Note' });
      const payload = noteToPayload(note);

      expect(payload.t).toBeUndefined();
    });

    it('should include custom title', () => {
      const note = createNote({ title: 'Custom Title' });
      const payload = noteToPayload(note);

      expect(payload.t).toBe('Custom Title');
    });

    it('should include tags with color codes', () => {
      const note = createNote({
        tags: [
          { id: '1', name: 'urgent', color: 'red', createdAt: 0, updatedAt: 0 },
          { id: '2', name: 'work', color: 'blue', createdAt: 0, updatedAt: 0 },
        ],
      });
      const payload = noteToPayload(note);

      expect(payload.g).toEqual([
        ['urgent', ColorCode.Red],
        ['work', ColorCode.Blue],
      ]);
    });

    it('should include expiry when provided', () => {
      const note = createNote();
      const expiresAt = Math.floor(Date.now() / 1000) + 3600;
      const payload = noteToPayload(note, expiresAt);

      expect(payload.x).toBe(expiresAt);
    });

    it('should handle empty content', () => {
      const note = createNote({
        content: { type: 'doc', content: [] },
      });
      const payload = noteToPayload(note);

      expect(payload.n).toEqual([]);
    });

    it('should handle null content', () => {
      const note = createNote({
        content: null as unknown as JSONContent,
      });
      const payload = noteToPayload(note);

      expect(payload.n).toEqual([]);
    });
  });

  describe('payloadToNote', () => {
    it('should convert payload to note format', () => {
      const payload = {
        v: 1 as const,
        c: Math.floor(Date.now() / 1000),
        u: Math.floor(Date.now() / 1000),
        n: [[NodeType.Paragraph, ['Hello']] as const],
      };

      const note = payloadToNote(payload);

      expect(note.id).toBeDefined();
      expect(note.content.type).toBe('doc');
      expect(note.content.content).toHaveLength(1);
    });

    it('should use provided title', () => {
      const payload = {
        v: 1 as const,
        t: 'My Title',
        c: Math.floor(Date.now() / 1000),
        u: Math.floor(Date.now() / 1000),
        n: [],
      };

      const note = payloadToNote(payload);
      expect(note.title).toBe('My Title');
    });

    it('should extract title from first heading when not provided', () => {
      const payload = {
        v: 1 as const,
        c: Math.floor(Date.now() / 1000),
        u: Math.floor(Date.now() / 1000),
        n: [[NodeType.Heading, 1, ['Document Title']] as const],
      };

      const note = payloadToNote(payload);
      expect(note.title).toBe('Document Title');
    });

    it('should extract title from heading with code inline', () => {
      const payload = {
        v: 1 as const,
        c: Math.floor(Date.now() / 1000),
        u: Math.floor(Date.now() / 1000),
        n: [[NodeType.Heading, 1, ['My ', [InlineType.Code, 'code'], ' Title']] as const],
      };

      const note = payloadToNote(payload);
      expect(note.title).toBe('My code Title');
    });

    it('should extract title from heading with bold inline', () => {
      const payload = {
        v: 1 as const,
        c: Math.floor(Date.now() / 1000),
        u: Math.floor(Date.now() / 1000),
        n: [[NodeType.Heading, 1, ['Hello ', [InlineType.Bold, ['World']]]] as const],
      };

      const note = payloadToNote(payload);
      expect(note.title).toBe('Hello World');
    });

    it('should extract title from heading with link inline', () => {
      const payload = {
        v: 1 as const,
        c: Math.floor(Date.now() / 1000),
        u: Math.floor(Date.now() / 1000),
        n: [[NodeType.Heading, 1, ['Visit ', [InlineType.Link, 'https://example.com', ['here']]]] as const],
      };

      const note = payloadToNote(payload);
      expect(note.title).toBe('Visit here');
    });

    it('should use default title when not extractable', () => {
      const payload = {
        v: 1 as const,
        c: Math.floor(Date.now() / 1000),
        u: Math.floor(Date.now() / 1000),
        n: [],
      };

      const note = payloadToNote(payload);
      expect(note.title).toBe('Shared Note');
    });

    it('should convert tags with colors', () => {
      const payload = {
        v: 1 as const,
        c: Math.floor(Date.now() / 1000),
        u: Math.floor(Date.now() / 1000),
        n: [],
        g: [
          ['urgent', ColorCode.Red],
          ['work', ColorCode.Blue],
        ] as [string, number][],
      };

      const note = payloadToNote(payload);

      expect(note.tags).toHaveLength(2);
      expect(note.tags![0].name).toBe('urgent');
      expect(note.tags![0].color).toBe('red');
      expect(note.tags![1].name).toBe('work');
      expect(note.tags![1].color).toBe('blue');
    });

    it('should handle unknown color codes gracefully', () => {
      const payload = {
        v: 1 as const,
        c: Math.floor(Date.now() / 1000),
        u: Math.floor(Date.now() / 1000),
        n: [],
        g: [['tag', 999]] as [string, number][],
      };

      const note = payloadToNote(payload);
      expect(note.tags![0].color).toBe('gray');
    });
  });

  describe('nodeToPayload', () => {
    it('should return null for empty or invalid nodes', () => {
      expect(nodeToPayload(null as unknown as JSONContent)).toBe(null);
      expect(nodeToPayload(undefined as unknown as JSONContent)).toBe(null);
      expect(nodeToPayload({} as JSONContent)).toBe(null);
    });

    it('should convert paragraph nodes', () => {
      const node: JSONContent = {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Hello' }],
      };

      const payload = nodeToPayload(node);
      expect(payload).toEqual([NodeType.Paragraph, ['Hello']]);
    });

    it('should convert heading nodes with level', () => {
      const node: JSONContent = {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: 'Title' }],
      };

      const payload = nodeToPayload(node);
      expect(payload).toEqual([NodeType.Heading, 2, ['Title']]);
    });

    it('should default heading level to 1', () => {
      const node: JSONContent = {
        type: 'heading',
        content: [{ type: 'text', text: 'Title' }],
      };

      const payload = nodeToPayload(node);
      expect(payload![1]).toBe(1);
    });

    it('should convert executableCodeBlock nodes', () => {
      const node: JSONContent = {
        type: 'executableCodeBlock',
        attrs: { language: 'python', code: 'print("hello")' },
      };

      const payload = nodeToPayload(node);
      expect(payload).toEqual([NodeType.CodeBlock, LanguageCode.Python, 'print("hello")']);
    });

    it('should handle codeBlock type', () => {
      const node: JSONContent = {
        type: 'codeBlock',
        attrs: { language: 'javascript' },
        content: [{ type: 'text', text: 'console.log()' }],
      };

      const payload = nodeToPayload(node);
      expect(payload![1]).toBe(LanguageCode.JavaScript);
      expect(payload![2]).toBe('console.log()');
    });

    it('should convert bulletList nodes', () => {
      const node: JSONContent = {
        type: 'bulletList',
        content: [
          {
            type: 'listItem',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Item 1' }] }],
          },
        ],
      };

      const payload = nodeToPayload(node);
      expect(payload![0]).toBe(NodeType.BulletList);
      expect(Array.isArray(payload![1])).toBe(true);
    });

    it('should convert orderedList nodes with start', () => {
      const node: JSONContent = {
        type: 'orderedList',
        attrs: { start: 5 },
        content: [
          {
            type: 'listItem',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Item' }] }],
          },
        ],
      };

      const payload = nodeToPayload(node);
      expect(payload![0]).toBe(NodeType.OrderedList);
      expect(payload![1]).toBe(5);
    });

    it('should convert taskList nodes', () => {
      const node: JSONContent = {
        type: 'taskList',
        content: [
          {
            type: 'taskItem',
            attrs: { checked: true },
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Done' }] }],
          },
        ],
      };

      const payload = nodeToPayload(node);
      expect(payload![0]).toBe(NodeType.TaskList);
    });

    it('should convert taskItem with checked state', () => {
      const node: JSONContent = {
        type: 'taskItem',
        attrs: { checked: true },
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Task' }] }],
      };

      const payload = nodeToPayload(node);
      expect(payload![0]).toBe(NodeType.TaskItem);
      expect(payload![1]).toBe(true);
    });

    it('should convert blockquote nodes', () => {
      const node: JSONContent = {
        type: 'blockquote',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Quote' }] }],
      };

      const payload = nodeToPayload(node);
      expect(payload![0]).toBe(NodeType.Blockquote);
    });

    it('should convert horizontalRule nodes', () => {
      const node: JSONContent = { type: 'horizontalRule' };
      const payload = nodeToPayload(node);
      expect(payload).toEqual([NodeType.HorizontalRule]);
    });

    it('should convert hardBreak nodes', () => {
      const node: JSONContent = { type: 'hardBreak' };
      const payload = nodeToPayload(node);
      expect(payload).toEqual([NodeType.HardBreak]);
    });

    it('should warn and return null for unknown node types', () => {
      const node: JSONContent = { type: 'unknownType' };
      const payload = nodeToPayload(node);

      expect(payload).toBe(null);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('unknownType')
      );
    });
  });

  describe('payloadToNode', () => {
    it('should return null for non-array input', () => {
      expect(payloadToNode('invalid' as never)).toBe(null);
    });

    it('should convert paragraph payload', () => {
      const payload = [NodeType.Paragraph, ['Hello']] as const;
      const node = payloadToNode(payload);

      expect(node?.type).toBe('paragraph');
      expect(node?.content?.[0].text).toBe('Hello');
    });

    it('should convert heading payload', () => {
      const payload = [NodeType.Heading, 2, ['Title']] as const;
      const node = payloadToNode(payload);

      expect(node?.type).toBe('heading');
      expect(node?.attrs?.level).toBe(2);
    });

    it('should convert codeBlock payload', () => {
      const payload = [NodeType.CodeBlock, LanguageCode.Python, 'print("hi")'] as const;
      const node = payloadToNode(payload);

      expect(node?.type).toBe('executableCodeBlock');
      expect(node?.attrs?.language).toBe('python');
      expect(node?.attrs?.code).toBe('print("hi")');
    });

    it('should default unknown language to javascript', () => {
      const payload = [NodeType.CodeBlock, 999 as LanguageCode, 'code'] as const;
      const node = payloadToNode(payload);

      expect(node?.attrs?.language).toBe('javascript');
    });

    it('should convert bulletList payload', () => {
      const payload = [
        NodeType.BulletList,
        [[NodeType.ListItem, [[NodeType.Paragraph, ['Item']]]]],
      ] as const;
      const node = payloadToNode(payload);

      expect(node?.type).toBe('bulletList');
      expect(node?.content).toHaveLength(1);
    });

    it('should convert orderedList payload with start', () => {
      const payload = [
        NodeType.OrderedList,
        3,
        [[NodeType.ListItem, [[NodeType.Paragraph, ['Item']]]]],
      ] as const;
      const node = payloadToNode(payload);

      expect(node?.type).toBe('orderedList');
      expect(node?.attrs?.start).toBe(3);
    });

    it('should convert taskItem payload with checked', () => {
      const payload = [
        NodeType.TaskItem,
        true,
        [[NodeType.Paragraph, ['Done']]],
      ] as const;
      const node = payloadToNode(payload);

      expect(node?.type).toBe('taskItem');
      expect(node?.attrs?.checked).toBe(true);
    });

    it('should convert taskList payload', () => {
      const payload = [
        NodeType.TaskList,
        [
          [NodeType.TaskItem, true, [[NodeType.Paragraph, ['Done']]]],
          [NodeType.TaskItem, false, [[NodeType.Paragraph, ['Todo']]]],
        ],
      ] as const;
      const node = payloadToNode(payload);

      expect(node?.type).toBe('taskList');
      expect(node?.content).toHaveLength(2);
      expect(node?.content?.[0].type).toBe('taskItem');
      expect(node?.content?.[0].attrs?.checked).toBe(true);
      expect(node?.content?.[1].attrs?.checked).toBe(false);
    });

    it('should convert blockquote payload', () => {
      const payload = [
        NodeType.Blockquote,
        [[NodeType.Paragraph, ['Quote']]],
      ] as const;
      const node = payloadToNode(payload);

      expect(node?.type).toBe('blockquote');
    });

    it('should convert horizontalRule payload', () => {
      const payload = [NodeType.HorizontalRule] as const;
      const node = payloadToNode(payload);

      expect(node?.type).toBe('horizontalRule');
    });

    it('should convert hardBreak payload', () => {
      const payload = [NodeType.HardBreak] as const;
      const node = payloadToNode(payload);

      expect(node?.type).toBe('hardBreak');
    });

    it('should warn and return null for unknown node types', () => {
      const payload = [999] as const;
      const node = payloadToNode(payload as never);

      expect(node).toBe(null);
      expect(console.warn).toHaveBeenCalled();
    });
  });

  describe('inlinesToPayload', () => {
    it('should convert plain text', () => {
      const content: JSONContent[] = [{ type: 'text', text: 'Hello' }];
      const payload = inlinesToPayload(content);

      expect(payload).toEqual(['Hello']);
    });

    it('should skip empty text', () => {
      const content: JSONContent[] = [
        { type: 'text', text: '' },
        { type: 'text', text: 'Hello' },
      ];
      const payload = inlinesToPayload(content);

      expect(payload).toEqual(['Hello']);
    });

    it('should skip null/undefined nodes', () => {
      const content: JSONContent[] = [
        null as unknown as JSONContent,
        { type: 'text', text: 'Hello' },
      ];
      const payload = inlinesToPayload(content);

      expect(payload).toEqual(['Hello']);
    });

    it('should convert bold marks', () => {
      const content: JSONContent[] = [
        { type: 'text', text: 'Bold', marks: [{ type: 'bold' }] },
      ];
      const payload = inlinesToPayload(content);

      expect(payload).toEqual([[InlineType.Bold, ['Bold']]]);
    });

    it('should convert italic marks', () => {
      const content: JSONContent[] = [
        { type: 'text', text: 'Italic', marks: [{ type: 'italic' }] },
      ];
      const payload = inlinesToPayload(content);

      expect(payload).toEqual([[InlineType.Italic, ['Italic']]]);
    });

    it('should convert strike marks', () => {
      const content: JSONContent[] = [
        { type: 'text', text: 'Strike', marks: [{ type: 'strike' }] },
      ];
      const payload = inlinesToPayload(content);

      expect(payload).toEqual([[InlineType.Strike, ['Strike']]]);
    });

    it('should convert code marks', () => {
      const content: JSONContent[] = [
        { type: 'text', text: 'code()', marks: [{ type: 'code' }] },
      ];
      const payload = inlinesToPayload(content);

      expect(payload).toEqual([[InlineType.Code, 'code()']]);
    });

    it('should convert link marks', () => {
      const content: JSONContent[] = [
        {
          type: 'text',
          text: 'Link',
          marks: [{ type: 'link', attrs: { href: 'https://example.com' } }],
        },
      ];
      const payload = inlinesToPayload(content);

      expect(payload).toEqual([[InlineType.Link, 'https://example.com', ['Link']]]);
    });

    it('should convert highlight marks', () => {
      const content: JSONContent[] = [
        { type: 'text', text: 'Highlight', marks: [{ type: 'highlight' }] },
      ];
      const payload = inlinesToPayload(content);

      expect(payload).toEqual([[InlineType.Highlight, ['Highlight']]]);
    });

    it('should handle nested marks (bold + italic)', () => {
      const content: JSONContent[] = [
        {
          type: 'text',
          text: 'Bold Italic',
          marks: [{ type: 'bold' }, { type: 'italic' }],
        },
      ];
      const payload = inlinesToPayload(content);

      // Marks are applied in order: text -> bold wraps text -> italic wraps bold
      // So outermost is Italic
      expect(payload[0][0]).toBe(InlineType.Italic);
      // Inner should be Bold
      const inner = (payload[0] as [InlineType, PayloadInline[]])[1][0];
      expect((inner as [InlineType, PayloadInline[]])[0]).toBe(InlineType.Bold);
    });

    it('should convert inline hardBreak to code newline', () => {
      const content: JSONContent[] = [{ type: 'hardBreak' }];
      const payload = inlinesToPayload(content);

      expect(payload).toEqual([[InlineType.Code, '\n']]);
    });
  });

  describe('payloadToInlines', () => {
    it('should convert plain text', () => {
      const payload = ['Hello'];
      const content = payloadToInlines(payload);

      expect(content).toEqual([{ type: 'text', text: 'Hello' }]);
    });

    it('should skip empty strings', () => {
      const payload = ['', 'Hello', ''];
      const content = payloadToInlines(payload);

      expect(content).toEqual([{ type: 'text', text: 'Hello' }]);
    });

    it('should convert bold inline', () => {
      const payload = [[InlineType.Bold, ['Bold']]];
      const content = payloadToInlines(payload);

      expect(content[0].text).toBe('Bold');
      expect(content[0].marks).toContainEqual({ type: 'bold' });
    });

    it('should convert italic inline', () => {
      const payload = [[InlineType.Italic, ['Italic']]];
      const content = payloadToInlines(payload);

      expect(content[0].marks).toContainEqual({ type: 'italic' });
    });

    it('should convert strike inline', () => {
      const payload = [[InlineType.Strike, ['Strike']]];
      const content = payloadToInlines(payload);

      expect(content[0].marks).toContainEqual({ type: 'strike' });
    });

    it('should convert code inline', () => {
      const payload = [[InlineType.Code, 'code()']];
      const content = payloadToInlines(payload);

      expect(content[0].text).toBe('code()');
      expect(content[0].marks).toContainEqual({ type: 'code' });
    });

    it('should skip empty code text', () => {
      const payload = [[InlineType.Code, '']];
      const content = payloadToInlines(payload);

      expect(content).toEqual([]);
    });

    it('should convert link inline', () => {
      const payload = [[InlineType.Link, 'https://example.com', ['Link']]];
      const content = payloadToInlines(payload);

      expect(content[0].text).toBe('Link');
      expect(content[0].marks).toContainEqual({
        type: 'link',
        attrs: { href: 'https://example.com' },
      });
    });

    it('should convert highlight inline', () => {
      const payload = [[InlineType.Highlight, ['Highlight']]];
      const content = payloadToInlines(payload);

      expect(content[0].marks).toContainEqual({ type: 'highlight' });
    });
  });

  describe('countPayloadNodes', () => {
    it('should count single nodes', () => {
      const nodes = [[NodeType.Paragraph, ['Hello']]];
      expect(countPayloadNodes(nodes as never)).toBe(1);
    });

    it('should count nested nodes in bulletList', () => {
      const nodes = [
        [
          NodeType.BulletList,
          [
            [NodeType.ListItem, [[NodeType.Paragraph, ['Item 1']]]],
            [NodeType.ListItem, [[NodeType.Paragraph, ['Item 2']]]],
          ],
        ],
      ];
      expect(countPayloadNodes(nodes as never)).toBe(5); // bulletList + 2 listItems + 2 paragraphs
    });

    it('should count nested nodes in orderedList', () => {
      const nodes = [
        [
          NodeType.OrderedList,
          1,
          [[NodeType.ListItem, [[NodeType.Paragraph, ['Item']]]]],
        ],
      ];
      expect(countPayloadNodes(nodes as never)).toBe(3);
    });

    it('should count nested nodes in taskList', () => {
      const nodes = [
        [
          NodeType.TaskList,
          [[NodeType.TaskItem, true, [[NodeType.Paragraph, ['Done']]]]],
        ],
      ];
      expect(countPayloadNodes(nodes as never)).toBe(3);
    });

    it('should count nested nodes in blockquote', () => {
      const nodes = [[NodeType.Blockquote, [[NodeType.Paragraph, ['Quote']]]]];
      expect(countPayloadNodes(nodes as never)).toBe(2);
    });
  });

  describe('validatePayloadStructure', () => {
    it('should return false for null/undefined', () => {
      expect(validatePayloadStructure(null)).toBe(false);
      expect(validatePayloadStructure(undefined)).toBe(false);
    });

    it('should return false for non-object', () => {
      expect(validatePayloadStructure('string')).toBe(false);
      expect(validatePayloadStructure(123)).toBe(false);
    });

    it('should return false for wrong version', () => {
      expect(validatePayloadStructure({ v: 2, c: 0, u: 0, n: [] })).toBe(false);
      expect(validatePayloadStructure({ v: 0, c: 0, u: 0, n: [] })).toBe(false);
    });

    it('should return false for missing timestamps', () => {
      expect(validatePayloadStructure({ v: 1, u: 0, n: [] })).toBe(false);
      expect(validatePayloadStructure({ v: 1, c: 0, n: [] })).toBe(false);
    });

    it('should return false for non-number timestamps', () => {
      expect(validatePayloadStructure({ v: 1, c: '123', u: 0, n: [] })).toBe(false);
    });

    it('should return false for missing/invalid nodes', () => {
      expect(validatePayloadStructure({ v: 1, c: 0, u: 0 })).toBe(false);
      expect(validatePayloadStructure({ v: 1, c: 0, u: 0, n: 'not array' })).toBe(false);
    });

    it('should return true for valid payload', () => {
      const payload = {
        v: 1,
        c: Math.floor(Date.now() / 1000),
        u: Math.floor(Date.now() / 1000),
        n: [[NodeType.Paragraph, ['Hello']]],
      };
      expect(validatePayloadStructure(payload)).toBe(true);
    });

    it('should accept optional fields', () => {
      const payload = {
        v: 1,
        t: 'Title',
        c: Math.floor(Date.now() / 1000),
        u: Math.floor(Date.now() / 1000),
        n: [],
        g: [['tag', 0]],
        x: Math.floor(Date.now() / 1000) + 3600,
      };
      expect(validatePayloadStructure(payload)).toBe(true);
    });
  });
});
