'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  IconUser,
  IconCode,
  IconBug,
  IconNotes,
  IconBrandGithub,
  IconChevronRight,
  IconExternalLink,
} from '@tabler/icons-react';
import GlowCard from '../components/ui/GlowCard';

// TODO(James): replace with your own intro before merging.
const INTRO =
  'Intro goes here: a few sentences on who you are, what you study or work on, and what you are looking for.';

const ELSEWHERE: AboutItem[] = [
  { name: 'GitHub', href: 'https://github.com/voidReq', desc: 'github.com/voidReq', external: true },
  { name: 'This site', href: 'https://github.com/voidReq/6A68', desc: 'Source for 6A68.dev', external: true },
  { name: 'Notes', href: 'https://github.com/voidReq/notes', desc: 'The notes, as markdown', external: true },
];

export interface AboutItem {
  name: string;
  href: string;
  desc?: string;
  external?: boolean;
}

const externalProps = { target: '_blank', rel: 'noopener noreferrer' };

function SectionHeading({ icon: Icon, title, color }: { icon: typeof IconUser; title: string; color: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon size={16} style={{ color }} />
      <span className="text-sm font-mono font-semibold" style={{ color }}>{title}</span>
      <div className="flex-1 h-px" style={{ backgroundColor: `${color}20` }} />
    </div>
  );
}

function ItemGrid({ items, color }: { items: AboutItem[]; color: string }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {items.map((item) => (
        <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }} {...(item.external && externalProps)}>
          <GlowCard color={color} className="h-full">
            <div className="p-4 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <span className="font-mono text-sm font-semibold" style={{ color: 'var(--site-text)' }}>
                  {item.name}
                </span>
                {item.desc && (
                  <p className="text-xs mt-1" style={{ color: 'var(--site-text-dim)' }}>{item.desc}</p>
                )}
              </div>
              {item.external ? (
                <IconExternalLink size={14} style={{ color: 'var(--site-text-dim)', marginTop: 3, flexShrink: 0 }} />
              ) : (
                <IconChevronRight size={14} style={{ color: 'var(--site-text-dim)', marginTop: 3, flexShrink: 0 }} />
              )}
            </div>
          </GlowCard>
        </Link>
      ))}
    </div>
  );
}

export default function AboutClient({ builds, writeups, topics }: { builds: AboutItem[]; writeups: AboutItem[]; topics: string[] }) {
  const sections = [
    { key: 'projects', node: <><SectionHeading icon={IconCode} title="Projects" color="#7dcfff" /><ItemGrid items={builds} color="#7dcfff" /></> },
    { key: 'writeups', node: <><SectionHeading icon={IconBug} title="Writeups" color="#9ece6a" /><ItemGrid items={writeups} color="#9ece6a" /></> },
    {
      key: 'notes',
      node: (
        <>
          <SectionHeading icon={IconNotes} title="Notes" color="#bb9af7" />
          <div className="flex flex-wrap gap-2">
            {topics.map((topic) => (
              <Link
                key={topic}
                href="/notes"
                className="px-3 py-1.5 rounded-lg text-xs font-mono transition-colors"
                style={{ color: 'var(--site-text)', backgroundColor: 'rgba(187, 154, 247, 0.08)', border: '1px solid rgba(187, 154, 247, 0.2)', textDecoration: 'none' }}
              >
                {topic}
              </Link>
            ))}
          </div>
        </>
      ),
    },
    { key: 'elsewhere', node: <><SectionHeading icon={IconBrandGithub} title="Elsewhere" color="#e0af68" /><ItemGrid items={ELSEWHERE} color="#e0af68" /></> },
  ];

  return (
    <div className="relative min-h-[calc(100dvh-3.5rem)] overflow-hidden">
      <div className="absolute inset-0 mesh-gradient-purple pointer-events-none" />
      <div className="absolute inset-0 grid-bg pointer-events-none" />
      <div className="absolute inset-0 scanline-overlay pointer-events-none" />

      <div className="orb" style={{ width: 350, height: 350, background: '#e0af68', top: '-5%', right: '-5%', animationDelay: '-3s' }} />
      <div className="orb" style={{ width: 250, height: 250, background: '#bb9af7', bottom: '10%', left: '-5%', animationDelay: '-10s' }} />

      {/* Inline maxWidth: globals.css caps every element at 100%, which beats max-w-* classes */}
      <div className="relative z-10 p-4 md:p-8 mx-auto" style={{ maxWidth: '56rem' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(224, 175, 104, 0.1)', border: '1px solid rgba(224, 175, 104, 0.2)' }}>
              <IconUser size={22} style={{ color: '#e0af68' }} />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold font-mono" style={{ color: 'var(--site-text)' }}>
              About
            </h1>
          </div>
          <p className="text-sm md:text-base leading-relaxed" style={{ color: 'var(--site-text)' }}>
            {INTRO}
          </p>
        </motion.div>

        <div className="space-y-8">
          {sections.map((section, i) => (
            <motion.div
              key={section.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.1, duration: 0.5 }}
            >
              {section.node}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
