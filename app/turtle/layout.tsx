import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Turtle",
  description: "Interactive canvas animation on goonsite.org.",
};

export default function TurtleLayout({ children }: { children: React.ReactNode }) {
  return children;
}
