import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const NOTES_DIR = path.join(process.cwd(), 'data', 'notes');

export interface Note {
  slug: string[];
  title: string;
  content: string;
  path: string;
}

export interface NoteTreeItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: NoteTreeItem[];
}

/**
 * Get all markdown files recursively from the notes directory
 */
export function getAllNotes(): Note[] {
  const notes: Note[] = [];
  
  function traverseDirectory(dir: string, baseDir: string = NOTES_DIR) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // Skip .git and .obsidian directories
        if (file === '.git' || file === '.obsidian') continue;
        traverseDirectory(filePath, baseDir);
      } else if (file.endsWith('.md')) {
        const relativePath = path.relative(baseDir, filePath);
        const slug = relativePath
          .replace(/\.md$/, '')
          .split(path.sep);
        
        const title = slug[slug.length - 1];
        
        notes.push({
          slug,
          title,
          content: '', // We'll load content on demand
          path: relativePath,
        });
      }
    }
  }
  
  traverseDirectory(NOTES_DIR);
  return notes;
}

/**
 * Get a single note by its slug
 */
export function getNoteBySlug(slug: string[]): Note | null {
  const filePath = path.join(NOTES_DIR, ...slug) + '.md';
  
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { content, data } = matter(fileContents);
  
  return {
    slug,
    title: data.title || slug[slug.length - 1],
    content,
    path: slug.join('/'),
  };
}

/**
 * Convert wiki-style links [[Link]] to Next.js links
 */
export function convertWikiLinks(content: string, allNotes: Note[]): string {
  // Create a map of note titles to their slugs for quick lookup
  const titleToSlug = new Map<string, string>();
  
  allNotes.forEach(note => {
    const title = note.slug[note.slug.length - 1];
    // Encode each segment for proper URL handling
    const encodedPath = note.slug.map(s => encodeURIComponent(s)).join('/');
    titleToSlug.set(title, `/notes/${encodedPath}`);
  });
  
  // Replace [[Link]] with [Link](/notes/path)
  return content.replace(/\[\[([^\]]+)\]\]/g, (match, linkText) => {
    const targetPath = titleToSlug.get(linkText);
    if (targetPath) {
      return `[${linkText}](${targetPath})`;
    }
    // If no match found, keep as plain text
    return linkText;
  });
}

/**
 * Build a tree structure of all notes for the index page
 */
export function buildNoteTree(): NoteTreeItem[] {
  function buildTree(dir: string, relativePath: string = ''): NoteTreeItem[] {
    const items: NoteTreeItem[] = [];
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      const itemRelativePath = relativePath ? `${relativePath}/${file}` : file;
      
      if (stat.isDirectory()) {
        // Skip .git and .obsidian directories
        if (file === '.git' || file === '.obsidian') continue;
        
        items.push({
          name: file,
          path: itemRelativePath,
          type: 'directory',
          children: buildTree(filePath, itemRelativePath),
        });
      } else if (file.endsWith('.md')) {
        const nameWithoutExt = file.replace(/\.md$/, '');
        items.push({
          name: nameWithoutExt,
          path: itemRelativePath.replace(/\.md$/, ''),
          type: 'file',
        });
      }
    }
    
    // Sort: directories first, then files, both alphabetically
    return items.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === 'directory' ? -1 : 1;
    });
  }
  
  return buildTree(NOTES_DIR);
}
