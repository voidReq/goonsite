import type { Metadata } from 'next';
import { buildProjectTree } from '@/lib/projects';
import ProjectsSidebar from '@/app/components/ProjectsSidebar';

export const metadata: Metadata = {
  title: "Projects & Vulnerability Writeups",
  description: "Security projects, vulnerability writeups, and exploit walkthroughs. Detailed technical analysis of real-world security issues.",
};

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tree = buildProjectTree();

  return (
    <div className="flex min-h-screen text-white">
      <ProjectsSidebar tree={tree} />
      <main className="flex-1 pt-16 md:pt-0 md:ml-0">
        {children}
      </main>
    </div>
  );
}
