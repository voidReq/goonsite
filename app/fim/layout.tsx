import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "FIM",
  description: "File integrity monitoring tool demo on goonsite.org.",
};

export default function FimLayout({ children }: { children: React.ReactNode }) {
  return children;
}
