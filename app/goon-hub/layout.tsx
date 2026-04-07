import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Sitemap",
  description: "Interactive terminal-style sitemap for goonsite.org. Browse all pages, projects, and notes.",
};

export default function GoonHubLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative h-[calc(100dvh-3.5rem)] overflow-hidden">
      <div className="absolute inset-0 mesh-gradient-purple pointer-events-none" />
      <div className="absolute inset-0 grid-bg pointer-events-none" />
      <div className="absolute inset-0 scanline-overlay pointer-events-none" />
      <div className="relative z-10 h-full overflow-hidden">
        {children}
      </div>
    </div>
  );
}
