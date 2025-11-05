'use client';

import React from 'react';
import Showdown from 'showdown';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const converter = new Showdown.Converter({
  tables: true,
  strikethrough: true,
  tasklists: true,
  ghCodeBlocks: true,
  simplifiedAutoLink: true,
  simpleLineBreaks: true,
});

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  // Convert tabs to spaces for proper nested list rendering
  const processedContent = content.replace(/\t/g, '    ');
  const html = converter.makeHtml(processedContent);
  
  return (
    <div 
      className={`prose prose-invert max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
      style={{
        // Style links
        // @ts-ignore
        '--tw-prose-links': '#3b82f6',
        '--tw-prose-invert-links': '#60a5fa',
      }}
    />
  );
}
