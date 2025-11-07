import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getNoteBySlug, getAllNotes, convertWikiLinks } from '@/lib/notes';
import MarkdownRenderer from '@/app/components/MarkdownRenderer';

export async function generateStaticParams() {
  const notes = getAllNotes();
  return notes.map((note) => ({
    slug: note.slug,
  }));
}

/**
 * Extract a description from markdown content
 * Removes markdown syntax and returns first ~160 characters
 */
function extractDescription(content: string): string {
  // Remove code blocks
  let text = content.replace(/```[\s\S]*?```/g, '');
  // Remove inline code
  text = text.replace(/`[^`]+`/g, '');
  // Remove links but keep text
  text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
  // Remove headers
  text = text.replace(/^#+\s+/gm, '');
  // Remove bold/italic
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
  text = text.replace(/\*([^*]+)\*/g, '$1');
  // Remove images
  text = text.replace(/!\[([^\]]*)\]\([^\)]+\)/g, '');
  // Remove list markers
  text = text.replace(/^[\s]*[-*+]\s+/gm, '');
  // Remove extra whitespace
  text = text.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
  
  // Get first ~160 characters
  if (text.length > 160) {
    // Try to cut at a sentence boundary
    const truncated = text.substring(0, 160);
    const lastPeriod = truncated.lastIndexOf('.');
    const lastSpace = truncated.lastIndexOf(' ');
    const cutPoint = lastPeriod > 120 ? lastPeriod + 1 : lastSpace;
    return truncated.substring(0, cutPoint > 0 ? cutPoint : 160) + '...';
  }
  
  return text || 'Personal notes and documentation';
}

export async function generateMetadata(
  { params }: { params: { slug: string[] } }
): Promise<Metadata> {
  // Decode URL-encoded slug parts
  const decodedSlug = params.slug.map(part => decodeURIComponent(part));
  const note = getNoteBySlug(decodedSlug);
  
  if (!note) {
    return {
      title: 'Note Not Found',
    };
  }
  
  const description = extractDescription(note.content);
  // Use the decoded slug and encode it properly for the URL
  const encodedSlug = decodedSlug.map(s => encodeURIComponent(s)).join('/');
  const url = `https://goonsite.org/notes/${encodedSlug}`;
  
  return {
    title: `${note.title} | The Gooonsite Notes`,
    description,
    openGraph: {
      title: note.title,
      description,
      type: 'article',
      url,
      siteName: 'The Gooonsite',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: note.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: note.title,
      description,
      images: ['/og-image.png'],
    },
  };
}

export default function NotePage({ params }: { params: { slug: string[] } }) {
  // Decode URL-encoded slug parts
  const decodedSlug = params.slug.map(part => decodeURIComponent(part));
  
  const note = getNoteBySlug(decodedSlug);
  
  if (!note) {
    notFound();
  }
  
  // Get all notes to convert wiki links
  const allNotes = getAllNotes();
  const contentWithLinks = convertWikiLinks(note.content, allNotes);
  
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">{note.title}</h1>
        
        <MarkdownRenderer content={contentWithLinks} />
      </div>
    </div>
  );
}
