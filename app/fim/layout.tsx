import type { Metadata } from 'next';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: "FIM",
  description: `File integrity monitoring tool demo on ${SITE.name}.`,
};

export default function FimLayout({ children }: { children: React.ReactNode }) {
  return children;
}
