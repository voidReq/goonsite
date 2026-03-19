import type { Metadata } from 'next';
import { buildNoteTree } from '@/lib/notes';
import NotesSidebar from '@/app/components/NotesSidebar';

export const metadata: Metadata = {
  title: "Security Notes",
  description: "Personal security research notes covering web vulnerabilities, penetration testing techniques, cryptography, and more.",
};

export default function NotesLayout({ children }: { children: React.ReactNode }) {
  const tree = buildNoteTree();

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]" style={{ color: '#c0caf5' }}>
      <NotesSidebar tree={tree} />
      <main className="flex-1 pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}
