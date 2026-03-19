"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { IconChevronRight } from '@tabler/icons-react';
import { ReactNode } from 'react';

function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 text-xs font-mono px-1 py-3 overflow-x-auto">
      <Link href="/" className="text-[#565f89] hover:text-[#7dcfff] transition-colors shrink-0">~</Link>
      {segments.map((segment, i) => {
        const href = '/' + segments.slice(0, i + 1).join('/');
        const isLast = i === segments.length - 1;
        const label = segment.replace(/-/g, ' ');
        return (
          <span key={href} className="flex items-center gap-1.5 shrink-0">
            <IconChevronRight size={10} className="text-[#565f89]" />
            {isLast ? (
              <span className="text-[#c0caf5]">{label}</span>
            ) : (
              <Link href={href} className="text-[#565f89] hover:text-[#7dcfff] transition-colors">{label}</Link>
            )}
          </span>
        );
      })}
    </div>
  );
}

interface PageShellProps {
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  noPadding?: boolean;
  noBreadcrumbs?: boolean;
}

export default function PageShell({ children, maxWidth = 'lg', noPadding = false, noBreadcrumbs = false }: PageShellProps) {
  const pathname = usePathname();

  const maxWidthClass = {
    sm: 'max-w-2xl',
    md: 'max-w-3xl',
    lg: 'max-w-5xl',
    xl: 'max-w-6xl',
    full: 'max-w-full',
  }[maxWidth];

  return (
    <>
      {!noBreadcrumbs && pathname !== '/' && (
        <div className={`${maxWidthClass} mx-auto px-4 md:px-6`}>
          <Breadcrumbs />
        </div>
      )}
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={noPadding ? 'min-h-[calc(100dvh-3.5rem)]' : `${maxWidthClass} mx-auto px-4 md:px-6 pb-16 min-h-[calc(100dvh-3.5rem)]`}
      >
        {children}
      </motion.div>
    </>
  );
}
