import type { Metadata } from 'next';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: "Turtle",
  description: `Interactive canvas animation on ${SITE.name}.`,
};

export default function TurtleLayout({ children }: { children: React.ReactNode }) {
  return children;
}
