export default function NotesIndexPage() {
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Notes</h1>
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <p className="text-gray-400">
            Welcome to my personal notes! These are continuously updated.<br />
            The large majority of my notes are handwritten, although not all.<br />
            These notes are mostly of concepts I've taught myself, but in the future I'll probably add some from classes I've taken.<br />
            I plan on adding some of the following:<br />
            - More web vulnerabilities<br />
            - Computer networking from a graduate class<br />
            - Python notes<br />
            - Efficient embedded programming<br />
            <br />
            Select a note from the sidebar to view its contents.
          </p>
        </div>
      </div>
    </div>
  );
}
