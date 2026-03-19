
"use client";
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import Link from 'next/link';

interface TreeEntry {
  href: string;
  name: string;
  color?: string;
  children?: TreeEntry[];
}

const siteTree: TreeEntry[] = [
  { href: '/', name: 'home', color: '#9ece6a' },
  {
    href: '/goon-hub', name: 'goon-hub/', color: '#bb9af7',
    children: [
      { href: '/goon-sploit', name: 'goon-sploit', color: '#f7768e' },
    ],
  },
  { href: '/macbook', name: 'macbook', color: '#7dcfff' },
  { href: '/message-board', name: 'message-board', color: '#e0af68' },
  { href: '/notes', name: 'notes/', color: '#bb9af7' },
  { href: '/projects', name: 'projects/', color: '#7dcfff' },
  { href: '/revolutions', name: 'revolutions', color: '#ff9e64' },
];

function TreeLines({ entries, depth = 0 }: { entries: TreeEntry[]; depth?: number }) {
  return (
    <>
      {entries.map((entry, i) => {
        const isLast = i === entries.length - 1;
        const prefix = isLast ? '└── ' : '├── ';
        const childPrefix = isLast ? '    ' : '│   ';

        return (
          <div key={entry.href}>
            <div className="leading-relaxed">
              <span className="text-[#565f89] select-none">
                {'    '.repeat(depth)}{prefix}
              </span>
              <Link
                href={entry.href}
                className="hover:underline transition-colors"
                style={{ color: entry.color || '#c0caf5' }}
              >
                {entry.name}
              </Link>
            </div>
            {entry.children && (
              <TreeLines entries={entry.children} depth={depth + 1} />
            )}
          </div>
        );
      })}
    </>
  );
}

export default function GoonHub() {
  return (
    <MantineProvider forceColorScheme="dark">
      <div className="min-h-screen flex items-start md:items-center justify-center p-4 py-8 md:p-8">
        <div className="w-full max-w-2xl">

          {/* Terminal window */}
          <div className="rounded-xl overflow-hidden border border-white/10" style={{ backgroundColor: '#1a1b26' }}>

            {/* Title bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5" style={{ backgroundColor: '#16161e' }}>
              <span className="w-3 h-3 rounded-full bg-[#f7768e]" />
              <span className="w-3 h-3 rounded-full bg-[#e0af68]" />
              <span className="w-3 h-3 rounded-full bg-[#9ece6a]" />
              <span className="ml-3 text-xs font-mono text-white/30">goon@goonsite: ~/sitemap</span>
            </div>

            {/* Terminal body */}
            <div className="p-4 md:p-6 font-mono text-sm md:text-base">

              {/* Prompt + command */}
              <div className="mb-1">
                <span style={{ color: '#bb9af7' }}>goon@goonsite</span>
                <span style={{ color: '#7dcfff' }}>:</span>
                <span style={{ color: '#c0caf5' }}>~</span>
                <span style={{ color: '#7dcfff' }}>$ </span>
                <span style={{ color: '#c0caf5' }}>tree --sitemap</span>
              </div>

              {/* Output header */}
              <div className="mt-3 mb-1 text-[#565f89]">.</div>

              {/* Tree */}
              <TreeLines entries={siteTree} />

              {/* Summary line */}
              <div className="mt-3 text-[#565f89] text-xs md:text-sm">
                {siteTree.length} directories, {siteTree.reduce((acc, e) => acc + (e.children?.length || 0), 0)} subdirectories
              </div>

              {/* Next prompt (idle cursor) */}
              <div className="mt-4">
                <span style={{ color: '#bb9af7' }}>goon@goonsite</span>
                <span style={{ color: '#7dcfff' }}>:</span>
                <span style={{ color: '#c0caf5' }}>~</span>
                <span style={{ color: '#7dcfff' }}>$ </span>
                <span className="inline-block w-2 h-4 bg-[#c0caf5] animate-pulse align-middle" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </MantineProvider>
  );
}
