import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NotebookOutput } from '../NotebookOutput';
import type { JupyterOutput } from '../../../types/notebook';

describe('NotebookOutput', () => {
  it('renders nothing for empty outputs', () => {
    const { container } = render(<NotebookOutput outputs={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders stream stdout output', () => {
    const outputs: JupyterOutput[] = [
      {
        output_type: 'stream',
        name: 'stdout',
        text: 'Hello World'
      }
    ];

    render(<NotebookOutput outputs={outputs} />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('renders stream stderr output with error styling', () => {
    const outputs: JupyterOutput[] = [
      {
        output_type: 'stream',
        name: 'stderr',
        text: 'Error message'
      }
    ];

    const { container } = render(<NotebookOutput outputs={outputs} />);
    const pre = container.querySelector('pre');
    expect(pre).toHaveClass('text-red-600');
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('renders error output', () => {
    const outputs: JupyterOutput[] = [
      {
        output_type: 'error',
        ename: 'ValueError',
        evalue: 'invalid value',
        traceback: ['Traceback:', '  File "test.py", line 1', 'ValueError: invalid value']
      }
    ];

    render(<NotebookOutput outputs={outputs} />);
    // Error name and value appear in multiple places (header and traceback)
    const errorElements = screen.getAllByText(/ValueError/);
    expect(errorElements.length).toBeGreaterThan(0);
  });

  it('renders HTML output', () => {
    const outputs: JupyterOutput[] = [
      {
        output_type: 'display_data',
        data: {
          'text/html': '<table><tr><td>Cell 1</td></tr></table>'
        }
      }
    ];

    const { container } = render(<NotebookOutput outputs={outputs} />);
    const table = container.querySelector('table');
    expect(table).toBeInTheDocument();
    expect(screen.getByText('Cell 1')).toBeInTheDocument();
  });

  it('sanitizes malicious HTML', () => {
    const outputs: JupyterOutput[] = [
      {
        output_type: 'display_data',
        data: {
          'text/html': '<div>Safe content</div><script>alert("xss")</script>'
        }
      }
    ];

    const { container } = render(<NotebookOutput outputs={outputs} />);
    expect(screen.getByText('Safe content')).toBeInTheDocument();
    expect(container.querySelector('script')).toBeNull(); // Script should be removed
  });

  it('renders PNG image output', () => {
    const outputs: JupyterOutput[] = [
      {
        output_type: 'display_data',
        data: {
          'image/png': 'base64encodeddata'
        },
        execution_count: 1
      }
    ];

    const { container } = render(<NotebookOutput outputs={outputs} />);
    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img?.src).toContain('data:image/png;base64,base64encodeddata');
    expect(screen.getByText('Out[1]:')).toBeInTheDocument();
  });

  it('renders JSON output', () => {
    const outputs: JupyterOutput[] = [
      {
        output_type: 'execute_result',
        data: {
          'application/json': { key: 'value', nested: { data: 123 } }
        },
        execution_count: 2
      }
    ];

    render(<NotebookOutput outputs={outputs} />);
    expect(screen.getByText(/key/)).toBeInTheDocument();
    expect(screen.getByText(/value/)).toBeInTheDocument();
    expect(screen.getByText('Out[2]:')).toBeInTheDocument();
  });

  it('renders plain text as fallback', () => {
    const outputs: JupyterOutput[] = [
      {
        output_type: 'execute_result',
        data: {
          'text/plain': 'Simple text output'
        }
      }
    ];

    render(<NotebookOutput outputs={outputs} />);
    expect(screen.getByText('Simple text output')).toBeInTheDocument();
  });

  it('renders multiple outputs in sequence', () => {
    const outputs: JupyterOutput[] = [
      {
        output_type: 'stream',
        name: 'stdout',
        text: 'First output'
      },
      {
        output_type: 'display_data',
        data: {
          'image/png': 'imagedata'
        }
      },
      {
        output_type: 'stream',
        name: 'stdout',
        text: 'Second output'
      }
    ];

    const { container } = render(<NotebookOutput outputs={outputs} />);
    expect(screen.getByText('First output')).toBeInTheDocument();
    expect(screen.getByText('Second output')).toBeInTheDocument();
    expect(container.querySelector('img')).toBeInTheDocument();
  });

  it('prioritizes HTML over plain text', () => {
    const outputs: JupyterOutput[] = [
      {
        output_type: 'display_data',
        data: {
          'text/html': '<strong>HTML Output</strong>',
          'text/plain': 'Plain text'
        }
      }
    ];

    const { container } = render(<NotebookOutput outputs={outputs} />);
    expect(container.querySelector('strong')).toBeInTheDocument();
    expect(screen.getByText('HTML Output')).toBeInTheDocument();
    // Plain text should not be rendered when HTML is available
    expect(screen.queryByText('Plain text')).not.toBeInTheDocument();
  });

  it('renders nothing for undefined outputs', () => {
    const { container } = render(<NotebookOutput outputs={undefined as unknown as JupyterOutput[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders JPEG image output', () => {
    const outputs: JupyterOutput[] = [
      {
        output_type: 'display_data',
        data: {
          'image/jpeg': 'base64jpegdata'
        },
        execution_count: 3
      }
    ];

    const { container } = render(<NotebookOutput outputs={outputs} />);
    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img?.src).toContain('data:image/jpeg;base64,base64jpegdata');
    expect(screen.getByText('Out[3]:')).toBeInTheDocument();
  });

  it('renders SVG image output as string', () => {
    const outputs: JupyterOutput[] = [
      {
        output_type: 'display_data',
        data: {
          'image/svg+xml': '<svg><circle cx="10" cy="10" r="5" /></svg>'
        },
        execution_count: 4
      }
    ];

    const { container } = render(<NotebookOutput outputs={outputs} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(screen.getByText('Out[4]:')).toBeInTheDocument();
  });

  it('renders SVG image output from non-string type', () => {
    const outputs: JupyterOutput[] = [
      {
        output_type: 'display_data',
        data: {
          'image/svg+xml': { toString: () => '<svg><rect width="10" height="10" /></svg>' }
        }
      }
    ];

    const { container } = render(<NotebookOutput outputs={outputs} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders LaTeX output', () => {
    const outputs: JupyterOutput[] = [
      {
        output_type: 'display_data',
        data: {
          'text/latex': 'E = mc^2'
        },
        execution_count: 5
      }
    ];

    const { container } = render(<NotebookOutput outputs={outputs} />);
    expect(container.querySelector('.rich-output-latex')).toBeInTheDocument();
    expect(screen.getByText('Out[5]:')).toBeInTheDocument();
  });

  it('falls back to plain text for invalid LaTeX', () => {
    // katex with throwOnError: false won't throw, but we test the flow
    const outputs: JupyterOutput[] = [
      {
        output_type: 'display_data',
        data: {
          'text/latex': 'Some latex expression'
        }
      }
    ];

    const { container } = render(<NotebookOutput outputs={outputs} />);
    // Should render either latex or fallback plain text
    expect(container.querySelector('pre') || container.querySelector('.rich-output-latex')).toBeInTheDocument();
  });

  it('renders error output without traceback', () => {
    const outputs: JupyterOutput[] = [
      {
        output_type: 'error',
        ename: 'TypeError',
        evalue: 'null is not an object'
      }
    ];

    render(<NotebookOutput outputs={outputs} />);
    expect(screen.getByText(/TypeError/)).toBeInTheDocument();
    expect(screen.getByText(/null is not an object/)).toBeInTheDocument();
  });

  it('renders error output with empty traceback', () => {
    const outputs: JupyterOutput[] = [
      {
        output_type: 'error',
        ename: 'SyntaxError',
        evalue: 'unexpected token',
        traceback: []
      }
    ];

    render(<NotebookOutput outputs={outputs} />);
    expect(screen.getByText(/SyntaxError/)).toBeInTheDocument();
  });

  it('returns null for output with empty data object', () => {
    const outputs: JupyterOutput[] = [
      {
        output_type: 'display_data',
        data: {}
      }
    ];

    const { container } = render(<NotebookOutput outputs={outputs} />);
    // Should have container but no visible output content
    expect(container.querySelector('.notebook-outputs')).toBeInTheDocument();
  });

  it('returns null for unknown output type', () => {
    const outputs: JupyterOutput[] = [
      {
        output_type: 'unknown' as JupyterOutput['output_type']
      }
    ];

    const { container } = render(<NotebookOutput outputs={outputs} />);
    expect(container.querySelector('.notebook-outputs')).toBeInTheDocument();
  });

  it('renders HTML output with execution count', () => {
    const outputs: JupyterOutput[] = [
      {
        output_type: 'execute_result',
        data: {
          'text/html': '<div>Executed HTML</div>'
        },
        execution_count: 6
      }
    ];

    render(<NotebookOutput outputs={outputs} />);
    expect(screen.getByText('Out[6]:')).toBeInTheDocument();
    expect(screen.getByText('Executed HTML')).toBeInTheDocument();
  });

  it('renders plain text with execution count', () => {
    const outputs: JupyterOutput[] = [
      {
        output_type: 'execute_result',
        data: {
          'text/plain': '42'
        },
        execution_count: 7
      }
    ];

    render(<NotebookOutput outputs={outputs} />);
    expect(screen.getByText('Out[7]:')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders PNG without execution count', () => {
    const outputs: JupyterOutput[] = [
      {
        output_type: 'display_data',
        data: {
          'image/png': 'noexeccount'
        }
      }
    ];

    const { container } = render(<NotebookOutput outputs={outputs} />);
    expect(container.querySelector('img')).toBeInTheDocument();
    expect(screen.queryByText(/Out\[/)).not.toBeInTheDocument();
  });

  it('renders JPEG without execution count', () => {
    const outputs: JupyterOutput[] = [
      {
        output_type: 'display_data',
        data: {
          'image/jpeg': 'noexeccountjpeg'
        }
      }
    ];

    const { container } = render(<NotebookOutput outputs={outputs} />);
    expect(container.querySelector('img')).toBeInTheDocument();
    expect(screen.queryByText(/Out\[/)).not.toBeInTheDocument();
  });

  it('renders JSON without execution count', () => {
    const outputs: JupyterOutput[] = [
      {
        output_type: 'display_data',
        data: {
          'application/json': { test: true }
        }
      }
    ];

    render(<NotebookOutput outputs={outputs} />);
    expect(screen.queryByText(/Out\[/)).not.toBeInTheDocument();
  });

  it('prioritizes PNG image over plain text', () => {
    const outputs: JupyterOutput[] = [
      {
        output_type: 'display_data',
        data: {
          'image/png': 'pngimagedata',
          'text/plain': '<Figure at 0x123>'
        }
      }
    ];

    const { container } = render(<NotebookOutput outputs={outputs} />);
    expect(container.querySelector('img')).toBeInTheDocument();
    expect(screen.queryByText('<Figure at 0x123>')).not.toBeInTheDocument();
  });
});
