import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const PROJECTS_DIR = path.join(process.cwd(), 'data', 'projects');

export interface Project {
  slug: string[];
  title: string;
  description: string;
  content: string;
  path: string;
}

export interface ProjectTreeItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: ProjectTreeItem[];
}

/**
 * Get all markdown files recursively from the projects directory
 */
export function getAllProjects(): Project[] {
  const projects: Project[] = [];
  
  function traverseDirectory(dir: string, baseDir: string = PROJECTS_DIR) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        if (file === '.git' || file === '.obsidian') continue;
        traverseDirectory(filePath, baseDir);
      } else if (file.endsWith('.md')) {
        const relativePath = path.relative(baseDir, filePath);
        const originalParts = relativePath.replace(/\.md$/, '').split(path.sep);
        const slug = originalParts.map(part =>
          part.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '')
        );
        
        const title = originalParts[originalParts.length - 1];
        
        projects.push({
          slug,
          title,
          description: '',
          content: '',
          path: relativePath,
        });
      }
    }
  }
  
  traverseDirectory(PROJECTS_DIR);
  return projects;
}

/**
 * Get a single project by its slug
 */
export function getProjectBySlug(slug: string[]): Project | null {
  const allProjects = getAllProjects();
  const slugStr = slug.join('/');
  const match = allProjects.find(n => n.slug.join('/') === slugStr);
  
  if (!match) return null;
  
  const filePath = path.join(PROJECTS_DIR, match.path);
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { content, data } = matter(fileContents);
  
  return {
    ...match,
    title: data.title || match.title,
    description: data.description || '',
    content,
  };
}

/**
 * Build a tree structure of all projects for the sidebar
 */
export function buildProjectTree(): ProjectTreeItem[] {
  function buildTree(dir: string, relativePath: string = ''): ProjectTreeItem[] {
    const items: ProjectTreeItem[] = [];
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      const itemRelativePath = relativePath ? `${relativePath}/${file}` : file;
      
      if (stat.isDirectory()) {
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
          path: itemRelativePath.replace(/\.md$/, '').split('/').map(p => p.toLowerCase().replace(/\s+/g, '-')).join('/'),
          type: 'file',
        });
      }
    }
    
    // Sort: directories first, then files, both alphabetically
    return items.sort((a, b) => {
      if (a.type === b.type) {
        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
      }
      return a.type === 'directory' ? -1 : 1;
    });
  }
  
  return buildTree(PROJECTS_DIR);
}
