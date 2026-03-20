"use client";

import { motion } from 'framer-motion';
import { IconNotes, IconBrain, IconListCheck, IconSparkles } from '@tabler/icons-react';

const STATS = [
  { label: 'Self-taught', icon: IconBrain, color: '#bb9af7' },
  { label: 'Self-written', icon: IconSparkles, color: '#9ece6a' },
  { label: 'No AI slop', icon: IconListCheck, color: '#f7768e' },
];

const PLANNED = [
  { name: 'Web vulnerabilities', desc: 'Expanded XSS, SSRF, SQLi deep dives', color: '#f7768e' },
  { name: 'Computer architecture', desc: 'OS internals, memory management, syscalls', color: '#7dcfff' },
  { name: 'Real-time systems', desc: 'RTOS, embedded security, firmware analysis', color: '#e0af68' },
];

export default function NotesIndexPage() {
  return (
    <div className="relative min-h-[calc(100dvh-3.5rem)] overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 mesh-gradient-purple pointer-events-none" />
      <div className="absolute inset-0 grid-bg pointer-events-none" />
      <div className="absolute inset-0 scanline-overlay pointer-events-none" />

      {/* Floating orbs */}
      <div className="orb" style={{ width: 400, height: 400, background: '#bb9af7', top: '-8%', left: '-8%', animationDelay: '0s' }} />
      <div className="orb" style={{ width: 300, height: 300, background: '#7dcfff', bottom: '5%', right: '-5%', animationDelay: '-8s' }} />
      <div className="orb" style={{ width: 200, height: 200, background: '#9ece6a', top: '50%', left: '60%', animationDelay: '-15s', opacity: 0.06 }} />

      <div className="relative z-10 p-4 md:p-8 max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(187, 154, 247, 0.1)', border: '1px solid rgba(187, 154, 247, 0.2)' }}>
              <IconNotes size={22} style={{ color: '#bb9af7' }} />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold font-mono" style={{ color: '#c0caf5' }}>
              Notes
            </h1>
          </div>
          <p className="text-sm font-mono" style={{ color: '#565f89' }}>
            Security research notes &middot; Continuously updated
          </p>
        </motion.div>

        {/* Status badges */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="flex flex-wrap gap-3 mb-8"
        >
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.08, duration: 0.3 }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{
                backgroundColor: `${stat.color}08`,
                border: `1px solid ${stat.color}20`,
              }}
            >
              <stat.icon size={14} style={{ color: stat.color }} />
              <span className="text-xs font-mono font-medium" style={{ color: stat.color }}>
                {stat.label}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* Planned additions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-mono font-semibold" style={{ color: '#9ece6a' }}>
              Planned additions
            </span>
            <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(158, 206, 106, 0.15)' }} />
          </div>

          <div className="space-y-3">
            {PLANNED.map((item, i) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + i * 0.08, duration: 0.4 }}
                className="rounded-xl p-4 transition-all duration-200"
                style={{
                  backgroundColor: 'rgba(26, 27, 38, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.04)',
                  backdropFilter: 'blur(8px)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = `${item.color}30`;
                  e.currentTarget.style.backgroundColor = 'rgba(26, 27, 38, 0.8)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.04)';
                  e.currentTarget.style.backgroundColor = 'rgba(26, 27, 38, 0.6)';
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-1 h-8 rounded-full mt-0.5" style={{ backgroundColor: item.color }} />
                  <div>
                    <span className="font-mono text-sm font-semibold" style={{ color: '#c0caf5' }}>
                      {item.name}
                    </span>
                    <p className="text-xs mt-0.5" style={{ color: '#565f89' }}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Footer hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-8 text-center"
        >
          <p className="text-xs font-mono" style={{ color: '#565f89' }}>
            <span style={{ color: '#bb9af7' }}></span> Select a note from the sidebar
          </p>
        </motion.div>
      </div>
    </div>
  );
}
