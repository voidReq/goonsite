import type { Metadata } from 'next';
import { buildProjectTree } from '@/lib/projects';
import ProjectsSidebar from '@/app/components/ProjectsSidebar';

export const metadata: Metadata = {
  title: "Projects & Vulnerability Writeups",
  description: "Security projects, vulnerability writeups, and exploit walkthroughs.",
};

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  const tree = buildProjectTree();

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]" style={{ color: '#c0caf5' }}>
      <ProjectsSidebar tree={tree} />
      <main className="flex-1 pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}
