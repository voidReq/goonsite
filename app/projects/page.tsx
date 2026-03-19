"use client";

import { motion } from 'framer-motion';

export default function ProjectsIndexPage() {
  return (
    <div className="flex justify-center items-start min-h-[calc(100vh-3.5rem)] p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="terminal-window w-full max-w-[800px]"
      >
        <div className="terminal-titlebar">
          <span className="terminal-dot" style={{ backgroundColor: '#f7768e' }} />
          <span className="terminal-dot" style={{ backgroundColor: '#e0af68' }} />
          <span className="terminal-dot" style={{ backgroundColor: '#9ece6a' }} />
          <span className="ml-3 text-xs font-mono text-[#565f89]">goon@goonsite: ~/projects</span>
        </div>
        <div className="p-6 md:p-8" style={{ color: '#a9b1d6' }}>
          <div className="mb-5">
            <span style={{ color: '#bb9af7' }}>goon@goonsite</span>
            <span style={{ color: '#7dcfff' }}>:</span>
            <span style={{ color: '#c0caf5' }}>~/projects</span>
            <span style={{ color: '#7dcfff' }}>$</span>
            <span style={{ color: '#a9b1d6', marginLeft: '10px' }}>cat README.md</span>
          </div>

          <div className="font-mono leading-relaxed">
            <div style={{ color: '#7aa2f7' }} className="text-lg mb-4 font-bold"># Projects and Writeups</div>

            <div style={{ color: '#9ece6a' }} className="mb-2 font-semibold">## Overview</div>
            <div className="mb-4 text-sm">A collection of personal projects spanning cybersecurity, IoT, and math visualization. I'm also in the process of publishing writeups on various vulnerabilities I've found.</div>

            <div style={{ color: '#9ece6a' }} className="mb-2 font-semibold">## Projects/security/</div>
            <div className="mb-1 text-sm"><span style={{ color: '#bb9af7' }}>├──</span> <span style={{ color: '#7dcfff' }}>discord-remote-access</span> — Discord-based remote access tool (C)</div>
            <div className="mb-4 text-sm"><span style={{ color: '#bb9af7' }}>└──</span> <span style={{ color: '#7dcfff' }}>t-watch-evil-portal</span> — Evil portal for LILYGO T-Watch S3 (HTML/C++)</div>

            <div style={{ color: '#9ece6a' }} className="mb-2 font-semibold">## Projects/other/</div>
            <div className="mb-1 text-sm"><span style={{ color: '#bb9af7' }}>├──</span> <span style={{ color: '#7dcfff' }}>revolutions</span> — 3D revolution surface visualizer (Python)</div>
            <div className="mb-4 text-sm"><span style={{ color: '#bb9af7' }}>└──</span> <span style={{ color: '#7dcfff' }}>smartgrid-iot</span> — Smart grid cybersecurity testbed (C++)</div>

            <div style={{ color: '#9ece6a' }} className="mb-2 font-semibold">## Writeups/</div>
            <div className="mb-1 text-sm"><span style={{ color: '#bb9af7' }}>├──</span> <span style={{ color: '#7dcfff' }}>march_5_2026</span> — Critical IDOR PII Exposure</div>
            <div className="mb-4 text-sm"><span style={{ color: '#bb9af7' }}>└──</span> <span style={{ color: '#7dcfff' }}>other-vulnerabilities</span> — Coming soon...</div>

            <div className="mt-6 pt-4 text-sm" style={{ color: '#f7768e', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              → Select a folder from the sidebar to begin
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
