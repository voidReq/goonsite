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
    <div className="relative flex" style={{ color: 'var(--goon-text)', minHeight: 'calc(100dvh - 3.5rem)' }}>
      <div className="absolute inset-0 mesh-gradient-purple pointer-events-none" />
      <div className="absolute inset-0 grid-bg pointer-events-none" />
      <ProjectsSidebar tree={tree} />
      <main className="relative z-10 flex-1">
        {children}
      </main>
    </div>
  );
}
