import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { convertIpynbToNote, convertNoteToIpynb, downloadFile } from '../converter';
import type { Notebook } from '../parser';
import type { Note } from '../../../types';

describe('ipynb converter', () => {
  describe('convertIpynbToNote', () => {
    it('converts simple notebook to note', () => {
      const notebook: Notebook = {
        nbformat: 4,
        nbformat_minor: 5,
        metadata: {},
        cells: [
          {
            cell_type: 'markdown',
            source: '# Test Notebook'
          },
          {
            cell_type: 'code',
            source: 'print("hello")',
            outputs: [],
            execution_count: 1
          }
        ]
      };

      const note = convertIpynbToNote(notebook, 'test.ipynb');

      expect(note.title).toBe('Test Notebook');
      expect(note.content.type).toBe('doc');
      expect(note.content.content).toHaveLength(2);
    });

    it('extracts title from first heading', () => {
      const notebook: Notebook = {
        nbformat: 4,
        nbformat_minor: 5,
        metadata: {},
        cells: [
          {
            cell_type: 'markdown',
            source: '# My Analysis Notebook'
          }
        ]
      };

      const note = convertIpynbToNote(notebook);

      expect(note.title).toBe('My Analysis Notebook');
    });

    it('uses filename when no heading present', () => {
      const notebook: Notebook = {
        nbformat: 4,
        nbformat_minor: 5,
        metadata: {},
        cells: [
          {
            cell_type: 'code',
            source: 'x = 1'
          }
        ]
      };

      const note = convertIpynbToNote(notebook, 'mynotebook.ipynb');

      expect(note.title).toBe('mynotebook');
    });

    it('converts code cells to executableCodeBlock nodes', () => {
      const notebook: Notebook = {
        nbformat: 4,
        nbformat_minor: 5,
        metadata: {},
        cells: [
          {
            cell_type: 'code',
            source: ['import pandas as pd\n', 'df = pd.DataFrame()'],
            execution_count: 5,
            outputs: [
              {
                output_type: 'stream',
                name: 'stdout',
                text: 'output'
              }
            ]
          }
        ]
      };

      const note = convertIpynbToNote(notebook);

      const codeBlock = note.content.content?.[0];
      expect(codeBlock?.type).toBe('executableCodeBlock');
      expect(codeBlock?.attrs?.code).toBe('import pandas as pd\ndf = pd.DataFrame()');
      expect(codeBlock?.attrs?.language).toBe('python');
      expect(codeBlock?.attrs?.executionCount).toBe(5);
      expect(codeBlock?.attrs?.jupyterOutputs).toHaveLength(1);
    });

    it('converts markdown cells to paragraphs/headings', () => {
      const notebook: Notebook = {
        nbformat: 4,
        nbformat_minor: 5,
        metadata: {},
        cells: [
          {
            cell_type: 'markdown',
            source: '## Section Header'
          },
          {
            cell_type: 'markdown',
            source: 'Regular paragraph text'
          }
        ]
      };

      const note = convertIpynbToNote(notebook);

      expect(note.content.content).toHaveLength(2);
      expect(note.content.content?.[0]?.type).toBe('heading');
      expect(note.content.content?.[0]?.attrs?.level).toBe(2);
      expect(note.content.content?.[1]?.type).toBe('paragraph');
    });
  });

  describe('convertNoteToIpynb', () => {
    it('converts note with code blocks to ipynb', () => {
      const note: Note = {
        id: 'test',
        title: 'Test Note',
        content: {
          type: 'doc',
          content: [
            {
              type: 'heading',
              attrs: { level: 1 },
              content: [{ type: 'text', text: 'My Notebook' }]
            },
            {
              type: 'executableCodeBlock',
              attrs: {
                code: 'print("hello")',
                language: 'python',
                executionCount: 1,
                jupyterOutputs: [
                  {
                    output_type: 'stream',
                    name: 'stdout',
                    text: 'hello\n'
                  }
                ]
              }
            }
          ]
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const ipynb = convertNoteToIpynb(note);
      const parsed = JSON.parse(ipynb);

      expect(parsed.nbformat).toBe(4);
      expect(parsed.nbformat_minor).toBe(5);
      expect(parsed.cells).toHaveLength(2);
      expect(parsed.cells[0].cell_type).toBe('markdown');
      expect(parsed.cells[1].cell_type).toBe('code');
      expect(parsed.cells[1].execution_count).toBe(1);
      expect(parsed.cells[1].outputs).toHaveLength(1);
    });

    it('preserves code block source correctly', () => {
      const code = 'import pandas as pd\ndf = pd.DataFrame()\nprint(df)';
      const note: Note = {
        id: 'test',
        title: 'Test',
        content: {
          type: 'doc',
          content: [
            {
              type: 'executableCodeBlock',
              attrs: {
                code,
                language: 'python'
              }
            }
          ]
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const ipynb = convertNoteToIpynb(note);
      const parsed = JSON.parse(ipynb);

      expect(parsed.cells[0].source.join('')).toBe(code);
    });

    it('throws error for note with no content', () => {
      const note: Note = {
        id: 'test',
        title: 'Test',
        content: {
          type: 'doc'
          // no content array
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      expect(() => convertNoteToIpynb(note)).toThrow('Note has no content');
    });
  });

  describe('convertNoteToIpynb edge cases', () => {
    it('handles paragraphs with multiline text', () => {
      const note: Note = {
        id: 'test',
        title: 'Test',
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Line 1\nLine 2\nLine 3' }]
            }
          ]
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const ipynb = convertNoteToIpynb(note);
      const parsed = JSON.parse(ipynb);

      expect(parsed.cells).toHaveLength(1);
      expect(parsed.cells[0].cell_type).toBe('markdown');
    });

    it('skips empty paragraphs', () => {
      const note: Note = {
        id: 'test',
        title: 'Test',
        content: {
          type: 'doc',
          content: [
            {
              type: 'heading',
              attrs: { level: 1 },
              content: [{ type: 'text', text: 'Title' }]
            },
            {
              type: 'paragraph',
              content: [{ type: 'text', text: '   ' }] // whitespace only
            },
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Real content' }]
            }
          ]
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const ipynb = convertNoteToIpynb(note);
      const parsed = JSON.parse(ipynb);

      expect(parsed.cells).toHaveLength(2); // heading + real content, not empty paragraph
    });

    it('handles headings without level attribute', () => {
      const note: Note = {
        id: 'test',
        title: 'Test',
        content: {
          type: 'doc',
          content: [
            {
              type: 'heading',
              content: [{ type: 'text', text: 'Default Level' }]
            }
          ]
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const ipynb = convertNoteToIpynb(note);
      const parsed = JSON.parse(ipynb);

      expect(parsed.cells[0].source.join('')).toBe('# Default Level');
    });

    it('handles code blocks without code attribute', () => {
      const note: Note = {
        id: 'test',
        title: 'Test',
        content: {
          type: 'doc',
          content: [
            {
              type: 'executableCodeBlock',
              attrs: {}
            }
          ]
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const ipynb = convertNoteToIpynb(note);
      const parsed = JSON.parse(ipynb);

      expect(parsed.cells[0].cell_type).toBe('code');
      expect(parsed.cells[0].source.join('')).toBe('');
    });

    it('handles nodes without content', () => {
      const note: Note = {
        id: 'test',
        title: 'Test',
        content: {
          type: 'doc',
          content: [
            {
              type: 'heading',
              attrs: { level: 2 }
              // no content
            }
          ]
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const ipynb = convertNoteToIpynb(note);
      const parsed = JSON.parse(ipynb);

      expect(parsed.cells[0].source.join('')).toBe('## ');
    });

    it('handles nested content in paragraphs', () => {
      const note: Note = {
        id: 'test',
        title: 'Test',
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'outer '
                },
                {
                  type: 'span',
                  content: [
                    { type: 'text', text: 'nested' }
                  ]
                }
              ]
            }
          ]
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const ipynb = convertNoteToIpynb(note);
      const parsed = JSON.parse(ipynb);

      expect(parsed.cells[0].source.join('')).toContain('outer');
      expect(parsed.cells[0].source.join('')).toContain('nested');
    });

    it('skips unknown node types', () => {
      const note: Note = {
        id: 'test',
        title: 'Test',
        content: {
          type: 'doc',
          content: [
            {
              type: 'unknownType',
              attrs: { data: 'test' }
            },
            {
              type: 'heading',
              attrs: { level: 1 },
              content: [{ type: 'text', text: 'Title' }]
            }
          ]
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const ipynb = convertNoteToIpynb(note);
      const parsed = JSON.parse(ipynb);

      expect(parsed.cells).toHaveLength(1);
      expect(parsed.cells[0].cell_type).toBe('markdown');
    });
  });

  describe('convertIpynbToNote edge cases', () => {
    it('uses default title when no filename and no heading', () => {
      const notebook: Notebook = {
        nbformat: 4,
        nbformat_minor: 5,
        metadata: {},
        cells: [
          {
            cell_type: 'code',
            source: 'x = 1'
          }
        ]
      };

      const note = convertIpynbToNote(notebook);

      expect(note.title).toBe('Imported Notebook');
    });

    it('handles heading with only hash marks (uses default title)', () => {
      const notebook: Notebook = {
        nbformat: 4,
        nbformat_minor: 5,
        metadata: {},
        cells: [
          {
            cell_type: 'markdown',
            source: '#   '
          }
        ]
      };

      const note = convertIpynbToNote(notebook);

      // Empty heading text means it falls back to default
      expect(note.title).toBe('Imported Notebook');
    });

    it('extracts title from heading with text', () => {
      const notebook: Notebook = {
        nbformat: 4,
        nbformat_minor: 5,
        metadata: {},
        cells: [
          {
            cell_type: 'markdown',
            source: '## Real Title'
          }
        ]
      };

      const note = convertIpynbToNote(notebook);

      expect(note.title).toBe('Real Title');
    });

    it('skips raw cells', () => {
      const notebook: Notebook = {
        nbformat: 4,
        nbformat_minor: 5,
        metadata: {},
        cells: [
          {
            cell_type: 'raw',
            source: 'raw content'
          },
          {
            cell_type: 'code',
            source: 'x = 1'
          }
        ]
      };

      const note = convertIpynbToNote(notebook);

      expect(note.content.content).toHaveLength(1);
      expect(note.content.content?.[0]?.type).toBe('executableCodeBlock');
    });

    it('handles markdown cells with empty lines', () => {
      const notebook: Notebook = {
        nbformat: 4,
        nbformat_minor: 5,
        metadata: {},
        cells: [
          {
            cell_type: 'markdown',
            source: 'Line 1\n\nLine 2\n  \nLine 3'
          }
        ]
      };

      const note = convertIpynbToNote(notebook);

      // Should skip empty lines
      expect(note.content.content?.every(n => n.type === 'paragraph')).toBe(true);
    });

    it('handles code cells without execution_count', () => {
      const notebook: Notebook = {
        nbformat: 4,
        nbformat_minor: 5,
        metadata: {},
        cells: [
          {
            cell_type: 'code',
            source: 'x = 1'
          }
        ]
      };

      const note = convertIpynbToNote(notebook);

      const codeBlock = note.content.content?.[0];
      expect(codeBlock?.attrs?.executionCount).toBeUndefined();
    });

    it('handles code cells without outputs', () => {
      const notebook: Notebook = {
        nbformat: 4,
        nbformat_minor: 5,
        metadata: {},
        cells: [
          {
            cell_type: 'code',
            source: 'x = 1'
          }
        ]
      };

      const note = convertIpynbToNote(notebook);

      const codeBlock = note.content.content?.[0];
      expect(codeBlock?.attrs?.jupyterOutputs).toBeUndefined();
    });
  });

  describe('round-trip conversion', () => {
    it('maintains data fidelity for simple notebook', () => {
      const original: Notebook = {
        nbformat: 4,
        nbformat_minor: 5,
        metadata: {},
        cells: [
          {
            cell_type: 'markdown',
            source: '# Test'
          },
          {
            cell_type: 'code',
            source: 'x = 42',
            execution_count: 1,
            outputs: []
          }
        ]
      };

      // Import
      const note = convertIpynbToNote(original);

      // Export
      const exported = convertNoteToIpynb(note);
      const parsed = JSON.parse(exported);

      // Verify structure preserved
      expect(parsed.nbformat).toBe(4);
      expect(parsed.cells).toHaveLength(2);
      expect(parsed.cells[1].source.join('')).toBe('x = 42');
      expect(parsed.cells[1].execution_count).toBe(1);
    });
  });

  describe('downloadFile', () => {
    let mockCreateObjectURL: ReturnType<typeof vi.fn>;
    let mockRevokeObjectURL: ReturnType<typeof vi.fn>;
    let mockAppendChild: ReturnType<typeof vi.fn>;
    let mockRemoveChild: ReturnType<typeof vi.fn>;
    let mockClick: ReturnType<typeof vi.fn>;
    let createdLink: HTMLAnchorElement | null = null;

    beforeEach(() => {
      mockCreateObjectURL = vi.fn().mockReturnValue('blob:mock-url');
      mockRevokeObjectURL = vi.fn();
      mockAppendChild = vi.fn();
      mockRemoveChild = vi.fn();
      mockClick = vi.fn();

      // Mock URL methods
      global.URL.createObjectURL = mockCreateObjectURL;
      global.URL.revokeObjectURL = mockRevokeObjectURL;

      // Mock document.body
      mockAppendChild = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
        createdLink = node as HTMLAnchorElement;
        return node;
      });
      mockRemoveChild = vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);

      // Mock createElement to capture the link
      const originalCreateElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        const element = originalCreateElement(tagName);
        if (tagName === 'a') {
          element.click = mockClick;
        }
        return element;
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
      createdLink = null;
    });

    it('creates a blob with correct content and mime type', () => {
      downloadFile('test content', 'test.txt', 'text/plain');

      expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
      const blobArg = mockCreateObjectURL.mock.calls[0][0];
      expect(blobArg).toBeInstanceOf(Blob);
      expect(blobArg.type).toBe('text/plain');
    });

    it('uses default mime type when not provided', () => {
      downloadFile('{"key": "value"}', 'test.json');

      expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
      const blobArg = mockCreateObjectURL.mock.calls[0][0];
      expect(blobArg.type).toBe('application/json');
    });

    it('creates link with correct href and download attributes', () => {
      downloadFile('content', 'myfile.txt', 'text/plain');

      expect(createdLink).not.toBeNull();
      expect(createdLink?.href).toBe('blob:mock-url');
      expect(createdLink?.download).toBe('myfile.txt');
    });

    it('appends link to body, clicks, and removes it', () => {
      downloadFile('content', 'test.txt');

      expect(mockAppendChild).toHaveBeenCalledTimes(1);
      expect(mockClick).toHaveBeenCalledTimes(1);
      expect(mockRemoveChild).toHaveBeenCalledTimes(1);
    });

    it('revokes object URL after download', () => {
      downloadFile('content', 'test.txt');

      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('handles JSON content correctly', () => {
      const jsonContent = JSON.stringify({ test: 'data', nested: { value: 42 } });
      downloadFile(jsonContent, 'data.json', 'application/json');

      expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
      expect(createdLink?.download).toBe('data.json');
    });
  });
});
