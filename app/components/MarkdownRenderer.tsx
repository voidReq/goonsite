'use client';

import React, { useMemo, useEffect } from 'react';
import Showdown from 'showdown';
import Prism from 'prismjs';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/themes/prism-tomorrow.css';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const converter = new Showdown.Converter({
  tables: true,
  strikethrough: true,
  tasklists: true,
  ghCodeBlocks: false, // Disable Showdown's code block processing - we'll handle it ourselves
  simplifiedAutoLink: true,
  simpleLineBreaks: true,
});

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  // Process content to extract and highlight code blocks
  const processedContent = useMemo(() => {
    // Convert tabs to spaces for proper nested list rendering
    let processed = content.replace(/\t/g, '    ');
    
    // Extract code blocks with language tags: ```language\ncode\n``` or ```\ncode\n```
    // This regex handles optional language tags and flexible spacing
    const codeBlockRegex = /```(\w+)?\s*\n([\s\S]*?)```/g;
    
    // Replace code blocks with their highlighted HTML directly
    // Showdown will leave HTML as-is, so we can insert it before processing
    processed = processed.replace(codeBlockRegex, (match, language, code) => {
      const normalizedLang = (language || 'text').trim().toLowerCase();
      const codeContent = code.trim();
      
      // Highlight the code using Prism
      let highlightedCode: string;
      try {
        const prismLang = Prism.languages[normalizedLang] || Prism.languages.text;
        highlightedCode = Prism.highlight(codeContent, prismLang, normalizedLang);
      } catch {
        // Fallback to plain text if language not supported - escape HTML
        highlightedCode = codeContent
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      }
      
      // Create the HTML structure for the code block
      // Use a unique marker that we'll replace after Showdown processes
      const codeBlockHtml = `<div class="prism-code-block" data-lang="${normalizedLang}">${highlightedCode}</div>`;
      
      return codeBlockHtml;
    });
    
    // Convert markdown to HTML
    let html = converter.makeHtml(processed);
    
    // Replace our code block divs with proper pre/code tags
    // Showdown might have wrapped them in paragraphs, so we need to handle that
    html = html.replace(
      /<p>\s*<div class="prism-code-block" data-lang="([^"]+)">([\s\S]*?)<\/div>\s*<\/p>/gi,
      '<pre class="language-$1"><code class="language-$1">$2</code></pre>'
    );
    
    // Also handle cases where it's not wrapped in a paragraph
    html = html.replace(
      /<div class="prism-code-block" data-lang="([^"]+)">([\s\S]*?)<\/div>/gi,
      '<pre class="language-$1"><code class="language-$1">$2</code></pre>'
    );
    
    return html;
  }, [content]);

  // Re-highlight code blocks after render (in case Prism wasn't loaded initially)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Find all code blocks and highlight them
      const codeBlocks = document.querySelectorAll('pre code[class*="language-"]');
      codeBlocks.forEach((block) => {
        Prism.highlightElement(block as HTMLElement);
      });
    }
  }, [processedContent]);

  return (
    <div 
      className={`prose prose-invert max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: processedContent }}
      style={{
        // Style links
        // @ts-expect-error - CSS custom properties not in CSSProperties type
        '--tw-prose-links': '#3b82f6',
        '--tw-prose-invert-links': '#60a5fa',
      }}
    />
  );
}
