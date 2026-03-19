import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Sitemap",
  description: "Interactive terminal-style sitemap for goonsite.org. Browse all pages, projects, and notes.",
};

export default function GoonHubLayout({ children }: { children: React.ReactNode }) {
  return children;
}
