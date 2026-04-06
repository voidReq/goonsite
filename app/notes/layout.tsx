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
    <div className="relative flex" style={{ color: 'var(--goon-text)', minHeight: 'calc(100dvh - 3.5rem)' }}>
      <div className="absolute inset-0 mesh-gradient-purple pointer-events-none" />
      <div className="absolute inset-0 grid-bg pointer-events-none" />
      <NotesSidebar tree={tree} />
      <main className="relative z-10 flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}
