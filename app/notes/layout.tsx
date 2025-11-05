import { buildNoteTree } from '@/lib/notes';
import NotesSidebar from '@/app/components/NotesSidebar';

export default function NotesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tree = buildNoteTree();
  
  return (
    <div className="flex min-h-screen bg-black text-white">
      <NotesSidebar tree={tree} />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
