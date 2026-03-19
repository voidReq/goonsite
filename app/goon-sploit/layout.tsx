import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Goon-sploit",
  description: "Security threat scanner and exploit tool demo on goonsite.org.",
};

export default function GoonSploitLayout({ children }: { children: React.ReactNode }) {
  return children;
}
