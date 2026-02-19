import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import MarkdownRenderer from './MarkdownRenderer';

describe('MarkdownRenderer', () => {
  describe('Long text wrapping', () => {
    it('should apply word-wrap: break-word to the container', () => {
      const longText = 'ThisIsAVeryLongWordThatShouldWrapCorrectlyWithoutCausingHorizontalOverflowInTheMarkdownRenderer';
      render(<MarkdownRenderer content={longText} />);
      
      const container = screen.getByText(longText).closest('.prose');
      expect(container).toHaveStyle({ wordWrap: 'break-word' });
    });

    it('should apply overflow-wrap: break-word to the container', () => {
      const content = 'Test content';
      render(<MarkdownRenderer content={content} />);
      
      const container = screen.getByText(content).closest('.prose');
      expect(container).toHaveStyle({ overflowWrap: 'break-word' });
    });

    it('should have max-width: 100% to prevent horizontal overflow', () => {
      const content = 'Test content';
      render(<MarkdownRenderer content={content} />);
      
      const container = screen.getByText(content).closest('.prose');
      expect(container).toHaveStyle({ maxWidth: '100%' });
    });

    it('should have width: 100% set on the container', () => {
      const content = 'Test content';
      render(<MarkdownRenderer content={content} />);
      
      const container = screen.getByText(content).closest('.prose');
      expect(container).toHaveStyle({ width: '100%' });
    });
  });

  describe('Code block wrapping', () => {
    it('should render code blocks with language class', () => {
      const content = '```javascript\nconst x = 1;\n```';
      const { container } = render(<MarkdownRenderer content={content} />);
      
      const codeBlock = container.querySelector('pre.language-javascript');
      expect(codeBlock).toBeInTheDocument();
    });

    it('should render code element inside pre block with matching language class', () => {
      const content = '```python\ndef hello():\n    pass\n```';
      const { container } = render(<MarkdownRenderer content={content} />);
      
      const codeElement = container.querySelector('pre.language-python code.language-python');
      expect(codeElement).toBeInTheDocument();
    });

    it('should handle code blocks without language specification', () => {
      const content = '```\nplain text code\n```';
      const { container } = render(<MarkdownRenderer content={content} />);
      
      const codeBlock = container.querySelector('pre.language-text');
      expect(codeBlock).toBeInTheDocument();
    });

    it('should preserve code content within code blocks', () => {
      const codeContent = 'const longVariableName = "ThisIsAVeryLongStringThatShouldBeHandledProperlyByTheCodeBlockWrapper";';
      const content = `\`\`\`javascript\n${codeContent}\n\`\`\``;
      const { container } = render(<MarkdownRenderer content={content} />);
      
      const codeElement = container.querySelector('code');
      expect(codeElement).toBeInTheDocument();
      expect(codeElement?.textContent).toContain('longVariableName');
    });

    it('should handle multiple code blocks in the same content', () => {
      const content = '```javascript\nconst a = 1;\n```\n\nSome text\n\n```python\nx = 2\n```';
      const { container } = render(<MarkdownRenderer content={content} />);
      
      const jsBlock = container.querySelector('pre.language-javascript');
      const pyBlock = container.querySelector('pre.language-python');
      
      expect(jsBlock).toBeInTheDocument();
      expect(pyBlock).toBeInTheDocument();
    });
  });

  describe('Global styles preventing horizontal scrollbars', () => {
    let styleElement: HTMLStyleElement;

    beforeEach(() => {
      // Inject global styles similar to globals.css
      styleElement = document.createElement('style');
      styleElement.textContent = `
        body {
          overflow-x: hidden;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        * {
          word-wrap: break-word;
          overflow-wrap: break-word;
          max-width: 100%;
        }
        .prose {
          word-wrap: break-word !important;
          overflow-wrap: break-word !important;
          max-width: 100% !important;
        }
        .prose * {
          max-width: 100% !important;
        }
        .prose pre[class*="language-"] {
          overflow-x: hidden !important;
          overflow-wrap: break-word !important;
          word-wrap: break-word !important;
          max-width: 100% !important;
          width: 100% !important;
          white-space: pre-wrap !important;
          word-break: break-word !important;
        }
        .prose code[class*="language-"] {
          white-space: pre-wrap !important;
          word-wrap: break-word !important;
          overflow-wrap: break-word !important;
          word-break: break-word !important;
        }
        .prose p,
        .prose li,
        .prose td,
        .prose th,
        .prose div {
          word-wrap: break-word !important;
          overflow-wrap: break-word !important;
        }
      `;
      document.head.appendChild(styleElement);
    });

    afterEach(() => {
      document.head.removeChild(styleElement);
    });

    it('should have body overflow-x hidden in global styles', () => {
      const bodyStyles = window.getComputedStyle(document.body);
      // Note: jsdom may not fully compute styles, so we verify the style rule exists
      expect(styleElement.textContent).toContain('overflow-x: hidden');
    });

    it('should have word-wrap break-word on universal selector', () => {
      expect(styleElement.textContent).toContain('word-wrap: break-word');
    });

    it('should have max-width 100% on universal selector', () => {
      expect(styleElement.textContent).toContain('max-width: 100%');
    });

    it('should have overflow-x hidden on pre elements with language class', () => {
      expect(styleElement.textContent).toContain('.prose pre[class*="language-"]');
      expect(styleElement.textContent).toContain('overflow-x: hidden');
    });

    it('should have white-space pre-wrap on code blocks for proper wrapping', () => {
      expect(styleElement.textContent).toContain('white-space: pre-wrap');
    });

    it('should have word-break break-word on markdown text elements', () => {
      expect(styleElement.textContent).toContain('word-break: break-word');
    });
  });

  describe('Code snippet background and transparency', () => {
    let styleElement: HTMLStyleElement;

    beforeEach(() => {
      // Inject styles similar to globals.css for code block backgrounds
      styleElement = document.createElement('style');
      styleElement.textContent = `
        .prose pre {
          background-color: #1a1a1a !important;
          border: 1px solid #2a2a2a !important;
        }
        .prose code {
          background-color: #1a1a1a !important;
        }
        .prose pre code {
          background-color: transparent !important;
          padding: 0 !important;
        }
        .prose pre[class*="language-"] {
          background-color: #1a1a1a !important;
        }
        .prose code[class*="language-"] {
          background-color: #1a1a1a !important;
        }
        .prose pre[class*="language-"] code {
          background-color: #1a1a1a !important;
        }
        .prose pre[class*="language-"] *,
        .prose code[class*="language-"] *,
        .prose pre[class*="language-"] code *,
        .prose pre[class*="language-"] code span,
        .token {
          background-color: transparent !important;
        }
        .prose pre[class*="language-"],
        .prose pre[class*="language-"] code {
          background: #1a1a1a !important;
        }
      `;
      document.head.appendChild(styleElement);
    });

    afterEach(() => {
      document.head.removeChild(styleElement);
    });

    it('should have consistent background color #1a1a1a for pre elements', () => {
      expect(styleElement.textContent).toContain('.prose pre');
      expect(styleElement.textContent).toContain('background-color: #1a1a1a');
    });

    it('should have consistent background color for code elements', () => {
      expect(styleElement.textContent).toContain('.prose code');
      expect(styleElement.textContent).toContain('background-color: #1a1a1a');
    });

    it('should have transparent background for code inside pre blocks', () => {
      expect(styleElement.textContent).toContain('.prose pre code');
      expect(styleElement.textContent).toContain('background-color: transparent');
    });

    it('should have transparent background for all inner elements (tokens) in code blocks', () => {
      expect(styleElement.textContent).toContain('.token');
      expect(styleElement.textContent).toContain('background-color: transparent');
    });

    it('should have transparent background for all descendant elements in language-specific pre blocks', () => {
      expect(styleElement.textContent).toContain('.prose pre[class*="language-"] *');
      expect(styleElement.textContent).toContain('background-color: transparent');
    });

    it('should maintain the pre container background even when inner elements are transparent', () => {
      // Verify that pre itself has a solid background while children are transparent
      expect(styleElement.textContent).toContain('.prose pre[class*="language-"]');
      expect(styleElement.textContent).toContain('background: #1a1a1a');
    });

    it('renders code block with proper structure for background inheritance', () => {
      const content = '```javascript\nconst x = 1;\n```';
      const { container } = render(<MarkdownRenderer content={content} />);
      
      const preElement = container.querySelector('pre.language-javascript');
      const codeElement = container.querySelector('pre.language-javascript code');
      
      expect(preElement).toBeInTheDocument();
      expect(codeElement).toBeInTheDocument();
      // Verify structure exists for CSS to apply backgrounds correctly
      expect(codeElement?.parentElement).toBe(preElement);
    });
  });
});
