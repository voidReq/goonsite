import { buildNoteTree } from '@/lib/notes';
import NoteTree from '@/app/components/NoteTree';

export default function NotesIndexPage() {
  const tree = buildNoteTree();
  
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Notes</h1>
        
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <NoteTree tree={tree} />
        </div>
      </div>
    </div>
  );
}
