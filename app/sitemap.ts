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
    '/message-board',
    '/goon-sploit',
    '/fim',
    '/james',
    '/jerry'
  ].map((route) => {
    let priority = 0.5;
    if (route === '') priority = 1.0;
    else if (route === '/projects') priority = 0.9;
    else if (route === '/notes') priority = 0.8;
    else if (route === '/goon-hub') priority = 0.7;
    else if (route === '/message-board') priority = 0.6;
    else if (['/james', '/jerry', '/goon-sploit', '/fim', '/turtle', '/revolutions', '/macbook'].includes(route)) priority = 0.3;

    return {
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority,
    };
  });

  // Dynamic Notes routes
  const notes = getAllNotes().map((note) => ({
    url: `${baseUrl}/notes/${note.slug.join('/')}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  // Dynamic Projects/Writeups routes
  const projects = getAllProjects().map((project) => ({
    url: `${baseUrl}/projects/${project.slug.join('/')}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.9,
  }));

  return [...routes, ...notes, ...projects];
}
