import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Revolutions",
  description: "Interactive 3D surface of revolution grapher. Visualize mathematical functions rotated around axes.",
};

export default function RevolutionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
