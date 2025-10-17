import fs from 'fs';
import path from 'path';
import showdown from 'showdown';
import { Container } from '@mantine/core';
import './markdown.css';

export default function FimPage() {
  // Read the markdown file at build time
  const filePath = path.join(process.cwd(), 'app', 'fim', 'content.md');
  const markdownContent = fs.readFileSync(filePath, 'utf-8');
  
  // Convert markdown to HTML
  const converter = new showdown.Converter();
  const html = converter.makeHtml(markdownContent);

  return (
    <Container size="md" py="xl">
      <div 
        className="markdown-content"
        dangerouslySetInnerHTML={{ __html: html }} 
      />
    </Container>
  );
}
