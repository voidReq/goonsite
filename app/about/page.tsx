import type { Metadata } from 'next';
import { buildNoteTree } from '@/lib/notes';
import { getAllProjects, type Project } from '@/lib/projects';
import { SITE, NUAUTO_URL } from '@/lib/site';
import AboutClient, { type AboutItem } from './AboutClient';

// 6A68.dev only; next.config.js 404s /about on goonsite.

export const metadata: Metadata = {
  title: 'About',
  description: `Who's behind ${SITE.name}: interactive resume, projects, vulnerability writeups, notes and links.`,
};

// Read the projects folder per request, like /projects, so admin edits show up
export const dynamic = 'force-dynamic';

function toItem(project: Project): AboutItem {
  return { name: project.title, href: `/projects/${project.slug.join('/')}` };
}

export default function AboutPage() {
  const projects = getAllProjects();
  const builds = projects.filter((p) => p.path.startsWith('Projects')).map(toItem);
  const writeups = projects.filter((p) => p.path.startsWith('Writeups')).map(toItem);
  const topics = buildNoteTree()
    .filter((item) => item.type === 'directory')
    .map((item) => item.name.replace(/_/g, ' '));

  return (
    <AboutClient
      builds={[
        {
          name: 'NUauto',
          href: NUAUTO_URL,
          desc: 'Finds NUworks co-op postings that fit your resume and submits the ones you approve.',
          external: true,
        },
        ...builds,
      ]}
      writeups={writeups}
      topics={topics}
    />
  );
}
