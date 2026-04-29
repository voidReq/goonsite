'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  IconFolder,
  IconChevronRight,
  IconShieldLock,
  IconCpu,
  IconBug,
  IconCode,
} from '@tabler/icons-react';
import GlowCard from '../components/ui/GlowCard';

const ICONS: Record<string, typeof IconFolder> = {
  shield: IconShieldLock,
  cpu: IconCpu,
  bug: IconBug,
  folder: IconFolder,
};

export interface ProjectsSection {
  title: string;
  color: string;
  iconKey: string;
  items: { name: string; href: string }[];
}

export default function ProjectsListClient({ sections }: { sections: ProjectsSection[] }) {
  return (
    <div className="relative min-h-[calc(100dvh-3.5rem)] overflow-hidden">
      <div className="absolute inset-0 mesh-gradient-purple pointer-events-none" />
      <div className="absolute inset-0 grid-bg pointer-events-none" />
      <div className="absolute inset-0 scanline-overlay pointer-events-none" />

      <div className="orb" style={{ width: 350, height: 350, background: '#7dcfff', top: '-5%', right: '-5%', animationDelay: '-3s' }} />
      <div className="orb" style={{ width: 250, height: 250, background: '#bb9af7', bottom: '10%', left: '-5%', animationDelay: '-10s' }} />

      <div className="relative z-10 p-4 md:p-8 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(125, 207, 255, 0.1)', border: '1px solid rgba(125, 207, 255, 0.2)' }}>
              <IconCode size={22} style={{ color: '#7dcfff' }} />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold font-mono" style={{ color: 'var(--goon-text)' }}>
              Projects & Writeups
            </h1>
          </div>
          <p className="text-sm font-mono" style={{ color: 'var(--goon-text-dim)' }}>
            Cybersecurity tools, IoT smartgrids, and vulnerability disclosures
          </p>
        </motion.div>

        <div className="space-y-6">
          {sections.map((section, si) => {
            const Icon = ICONS[section.iconKey] ?? IconFolder;
            return (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + si * 0.1, duration: 0.5 }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Icon size={16} style={{ color: section.color }} />
                  <span className="text-sm font-mono font-semibold" style={{ color: section.color }}>
                    {section.title}
                  </span>
                  <div className="flex-1 h-px" style={{ backgroundColor: `${section.color}20` }} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {section.items.map((item, ii) => (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + si * 0.1 + ii * 0.05, duration: 0.4 }}
                    >
                      <Link href={item.href} style={{ textDecoration: 'none' }}>
                        <GlowCard color={section.color}>
                          <div className="p-4 flex items-start gap-3">
                            <div className="p-1.5 rounded-md mt-0.5" style={{ backgroundColor: `${section.color}10` }}>
                              <IconFolder size={16} style={{ color: section.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm font-semibold" style={{ color: 'var(--goon-text)' }}>
                                  {item.name}
                                </span>
                              </div>
                            </div>
                            <IconChevronRight size={14} style={{ color: 'var(--goon-text-dim)', marginTop: 4, flexShrink: 0 }} />
                          </div>
                        </GlowCard>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-8 text-center"
        >
          <p className="text-xs font-mono" style={{ color: 'var(--goon-text-dim)' }}>
            <span style={{ color: '#7dcfff' }}></span> or browse the tree in the sidebar
          </p>
        </motion.div>
      </div>
    </div>
  );
}
