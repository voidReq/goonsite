import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getProjectBySlug, getAllProjects } from '@/lib/projects';
import MarkdownRenderer from '@/app/components/MarkdownRenderer';

export async function generateStaticParams() {
  const projects = getAllProjects();
  return projects.map((project) => ({
    slug: project.slug,
  }));
}

/**
 * Extract a description from markdown content
 */
function extractDescription(content: string): string {
  let text = content.replace(/```[\s\S]*?```/g, '');
  text = text.replace(/`[^`]+`/g, '');
  text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
  text = text.replace(/^#+\s+/gm, '');
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
  text = text.replace(/\*([^*]+)\*/g, '$1');
  text = text.replace(/!\[([^\]]*)\]\([^\)]+\)/g, '');
  text = text.replace(/^[\s]*[-*+]\s+/gm, '');
  text = text.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
  
  if (text.length > 160) {
    const truncated = text.substring(0, 160);
    const lastPeriod = truncated.lastIndexOf('.');
    const lastSpace = truncated.lastIndexOf(' ');
    const cutPoint = lastPeriod > 120 ? lastPeriod + 1 : lastSpace;
    return truncated.substring(0, cutPoint > 0 ? cutPoint : 160) + '...';
  }
  
  return text || 'Personal project';
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string[] }> }
): Promise<Metadata> {
  const { slug } = await params;
  const decodedSlug = slug.map(part => decodeURIComponent(part));
  const project = getProjectBySlug(decodedSlug);
  
  if (!project) {
    return {
      title: 'Project Not Found',
    };
  }
  
  const description = project.description || extractDescription(project.content);
  const url = `https://goonsite.org/projects/${decodedSlug.join('/')}`;
  
  return {
    title: project.title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: project.title,
      description,
      type: 'article',
      url,
      siteName: 'goonsite.org',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: project.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: project.title,
      description,
      images: ['/og-image.png'],
    },
  };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const decodedSlug = slug.map(part => decodeURIComponent(part));
  
  const project = getProjectBySlug(decodedSlug);
  
  if (!project) {
    notFound();
  }
  
  const projectUrl = `https://goonsite.org/projects/${decodedSlug.join('/')}`;
  const projectDescription = project.description || extractDescription(project.content);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: project.title,
    description: projectDescription,
    url: projectUrl,
    author: { '@type': 'Person', name: 'James', url: 'https://goonsite.org' },
    publisher: { '@type': 'Organization', name: 'goonsite.org' },
  };

  return (
    <div className="p-4 sm:p-8 w-full">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-4xl mx-auto w-full">
        <h1 className="text-4xl font-bold mb-8">{project.title}</h1>

        <MarkdownRenderer content={project.content} />
      </div>
    </div>
  );
}
