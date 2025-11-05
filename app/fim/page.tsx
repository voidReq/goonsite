import fs from 'fs';
import path from 'path';
import showdown from 'showdown';
import { Container } from '@mantine/core';
import './markdown.css';

export default function FimPage() {
  // Read the markdown file at build time
  const filePath = path.join(process.cwd(), 'app', 'fim', 'content.md');
  let markdownContent = fs.readFileSync(filePath, 'utf-8');
  
  // Convert tabs to spaces (4 spaces per tab) for proper nested list rendering
  markdownContent = markdownContent.replace(/\t/g, '    ');
  
  // Convert markdown to HTML
  const converter = new showdown.Converter({
    tables: true,
    tasklists: true,
    simpleLineBreaks: false,
    openLinksInNewWindow: false,
    backslashEscapesHTMLTags: true,
  });
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
