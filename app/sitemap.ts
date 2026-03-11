import { MetadataRoute } from 'next';
import { getAllProjects } from '@/lib/projects';
import { getAllNotes } from '@/lib/notes';

export default function sitemap(): MetadataRoute.Sitemap {
  // Replace this with your actual domain
  const baseUrl = 'https://goonsite.org';

  // Static routes
  const routes = [
    '',
    '/goon-hub',
    '/notes',
    '/projects',
    '/macbook',
    '/revolutions',
    '/turtle',
    '/goon-sploit',
    '/fim',
    '/james',
    '/jerry'
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // Dynamic Notes routes
  const notes = getAllNotes().map((note) => ({
    url: `${baseUrl}/notes/${note.slug.map(s => encodeURIComponent(s)).join('/')}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  // Dynamic Projects/Writeups routes
  const projects = getAllProjects().map((project) => ({
    url: `${baseUrl}/projects/${project.slug.map(s => encodeURIComponent(s)).join('/')}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [...routes, ...notes, ...projects];
}
