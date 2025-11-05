import { notFound } from 'next/navigation';
import { getNoteBySlug, getAllNotes, convertWikiLinks } from '@/lib/notes';
import MarkdownRenderer from '@/app/components/MarkdownRenderer';

export async function generateStaticParams() {
  const notes = getAllNotes();
  return notes.map((note) => ({
    slug: note.slug,
  }));
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
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <a href="/notes" className="text-gray-400 hover:text-white transition-colors">
            ← Back to Notes
          </a>
        </div>
        
        <h1 className="text-4xl font-bold mb-8">{note.title}</h1>
        
        <MarkdownRenderer content={contentWithLinks} />
      </div>
    </div>
  );
}
