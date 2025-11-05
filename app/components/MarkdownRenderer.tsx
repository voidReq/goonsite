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
});

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const html = converter.makeHtml(content);
  
  return (
    <div 
      className={`prose prose-invert max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
