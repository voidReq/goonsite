import { buildProjectTree, type ProjectTreeItem } from '@/lib/projects';
import ProjectsListClient, { type ProjectsSection } from './ProjectsListClient';

export const dynamic = 'force-dynamic';

const STYLE_BY_NAME: Record<string, { color: string; iconKey: string }> = {
  security: { color: '#f7768e', iconKey: 'shield' },
  other: { color: '#7dcfff', iconKey: 'cpu' },
  writeups: { color: '#9ece6a', iconKey: 'bug' },
};

const DEFAULT_STYLE = { color: '#bb9af7', iconKey: 'folder' as const };

interface FileEntry {
  name: string;
  href: string;
}

function collectFiles(items: ProjectTreeItem[]): FileEntry[] {
  const out: FileEntry[] = [];
  for (const item of items) {
    if (item.type === 'file') {
      out.push({ name: item.name, href: `/projects/${item.path}` });
    } else if (item.children) {
      out.push(...collectFiles(item.children));
    }
  }
  return out;
}

function buildSections(tree: ProjectTreeItem[]): ProjectsSection[] {
  const sections: ProjectsSection[] = [];
  for (const top of tree) {
    if (top.type !== 'directory' || !top.children) continue;
    const hasNestedDirs = top.children.some((c) => c.type === 'directory');
    if (hasNestedDirs) {
      for (const child of top.children) {
        if (child.type === 'directory' && child.children) {
          const files = collectFiles(child.children);
          if (files.length === 0) continue;
          const style = STYLE_BY_NAME[child.name.toLowerCase()] ?? DEFAULT_STYLE;
          sections.push({ title: child.name, color: style.color, iconKey: style.iconKey, items: files });
        } else if (child.type === 'file') {
          const style = STYLE_BY_NAME[top.name.toLowerCase()] ?? DEFAULT_STYLE;
          const existing = sections.find((s) => s.title === top.name);
          const entry: FileEntry = { name: child.name, href: `/projects/${child.path}` };
          if (existing) existing.items.push(entry);
          else sections.push({ title: top.name, color: style.color, iconKey: style.iconKey, items: [entry] });
        }
      }
    } else {
      const files = collectFiles(top.children);
      if (files.length === 0) continue;
      const style = STYLE_BY_NAME[top.name.toLowerCase()] ?? DEFAULT_STYLE;
      sections.push({ title: top.name, color: style.color, iconKey: style.iconKey, items: files });
    }
  }
  return sections;
}

export default function ProjectsIndexPage() {
  const tree = buildProjectTree();
  const sections = buildSections(tree);
  return <ProjectsListClient sections={sections} />;
}
