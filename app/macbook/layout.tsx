import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Macbook",
  description: "Interactive 3D MacBook scroll animation on goonsite.org.",
};

export default function MacbookLayout({ children }: { children: React.ReactNode }) {
  return children;
}
