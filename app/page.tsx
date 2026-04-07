import { getAllNotes } from '@/lib/notes';
import { getAllProjects } from '@/lib/projects';
import HomeContent from './components/HomeContent';
import type { SiteNode } from './components/ui/NodeSphere';

// Color palette for dynamic content nodes
const NOTE_COLORS = ['#bb9af7', '#9ece6a', '#7dcfff', '#f7768e', '#e0af68', '#9d7cd8', '#7aa2f7', '#ff9e64'];
const PROJECT_COLORS = ['#7dcfff', '#f7768e', '#9ece6a', '#bb9af7', '#e0af68', '#7aa2f7', '#ff9e64', '#9d7cd8'];

// Static pages — always present
const STATIC_NODES: SiteNode[] = [
  { href: '/notes', label: 'Notes', color: '#bb9af7' },
  { href: '/projects', label: 'Projects', color: '#7dcfff' },
  { href: '/goon-hub', label: 'Sitemap', color: '#9ece6a' },
  { href: '/message-board', label: 'Message Board', color: '#e0af68' },
  { href: '/tools/jwt', label: 'JWT Debugger', color: '#f7768e' },
  { href: '/tools/headers', label: 'Header Analyzer', color: '#7dcfff' },
  { href: '/tools/encode', label: 'Encode / Hash', color: '#9ece6a' },
  { href: '/macbook', label: 'Macbook', color: '#bb9af7' },
  { href: '/revolutions', label: 'Revolutions', color: '#ff9e64' },
  { href: '/goon-sploit', label: 'Goon-sploit', color: '#f7768e' },
];

export default function Home() {
  // Build dynamic nodes from content at build/render time
  const notes = getAllNotes();
  const projects = getAllProjects();

  const noteNodes: SiteNode[] = notes.map((note, i) => ({
    href: `/notes/${note.slug.join('/')}`,
    label: note.title,
    color: NOTE_COLORS[i % NOTE_COLORS.length],
  }));

  const projectNodes: SiteNode[] = projects.map((project, i) => ({
    href: `/projects/${project.slug.join('/')}`,
    label: project.title,
    color: PROJECT_COLORS[i % PROJECT_COLORS.length],
  }));

  const allNodes: SiteNode[] = [...STATIC_NODES, ...noteNodes, ...projectNodes];

  return <HomeContent siteNodes={allNodes} />;
}
