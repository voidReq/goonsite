import type { Metadata } from 'next';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: "Macbook",
  description: `Interactive 3D MacBook scroll animation on ${SITE.name}.`,
};

export default function MacbookLayout({ children }: { children: React.ReactNode }) {
  return children;
}
