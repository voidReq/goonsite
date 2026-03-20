"use client";

import { useState, useEffect, Suspense } from 'react';
import { Switch, Rating, Text, Tooltip, Notification, Alert, Button } from '@mantine/core';
import { IconArrowRight, IconInfoCircle, IconHeart, IconNotes, IconCode, IconMap, IconMessageCircle, IconChevronRight } from '@tabler/icons-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { Terminal } from './ui/Terminal';
import PageShell from './ui/PageShell';
import GlowCard from './ui/GlowCard';
import type { SiteNode } from './ui/NodeSphere';

const NodeSphere = dynamic(() => import('./ui/NodeSphere'), { ssr: false });

const CODE_FRAGMENTS = [
  'nmap -sV -sC', 'SELECT * FROM', '0xDEADBEEF', 'chmod 777',
  'curl -X POST', 'ssh root@', '#!/bin/bash', 'import os',
  'msfconsole', 'sudo rm -rf', '0x41414141', 'grep -r "flag"',
  'nc -lvnp 4444', 'hashcat -m 0', 'python3 exploit.py', 'gobuster dir',
];

function FloatingCode({ text, delay, duration, x }: { text: string; delay: number; duration: number; x: number }) {
  return (
    <motion.div
      className="absolute font-mono text-xs pointer-events-none select-none whitespace-nowrap"
      initial={{ opacity: 0, y: '100vh', x: `${x}vw` }}
      animate={{ opacity: [0, 0.12, 0.12, 0], y: '-10vh' }}
      transition={{ delay, duration, repeat: Infinity, ease: 'linear' }}
      style={{ color: '#bb9af7' }}
    >
      {text}
    </motion.div>
  );
}

interface NavCardProps {
  href: string;
  accent: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  delay: number;
}

function NavCard({ href, accent, icon, title, desc, delay }: NavCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: 'easeOut' }}
    >
      <Link href={href} style={{ textDecoration: 'none' }} className="pointer-events-auto">
        <GlowCard color={accent}>
          <div className="p-4 md:p-5 h-full">
            <div className="flex flex-col h-full justify-between gap-2" style={{ minHeight: '80px' }}>
              <div>
                <div style={{ color: accent }} className="mb-2">{icon}</div>
                <div className="font-mono font-bold text-[#c0caf5] text-base leading-tight">{title}</div>
                <div className="text-[#565f89] text-xs mt-1">{desc}</div>
              </div>
              <IconChevronRight size={13} className="text-white/20 group-hover:text-white/50 transition-colors" />
            </div>
          </div>
        </GlowCard>
      </Link>
    </motion.div>
  );
}

export default function HomeContent({ siteNodes }: { siteNodes: SiteNode[] }) {
  const [isGooning, setIsGooning] = useState(false);
  const [ratingValue, setRatingValue] = useState(0);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [goodGooner, setGoodGooner] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsDesktop(window.innerWidth >= 768);
  }, []);

  return (
    <PageShell maxWidth="full" noBreadcrumbs noPadding>
      <div className="relative flex flex-col items-center justify-center p-4 pb-20 md:p-8 md:pb-20 overflow-hidden" style={{ minHeight: 'calc(100dvh - 3.5rem)' }}>

        {mounted && isDesktop && (
          <div className="absolute inset-0 z-0" style={{ opacity: 0.7 }}>
            <Suspense fallback={null}>
              <NodeSphere className="w-full h-full" nodes={siteNodes} />
            </Suspense>
          </div>
        )}

        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="orb" style={{ width: 500, height: 500, background: '#bb9af7', top: '-15%', left: '-10%', animationDelay: '0s', opacity: isDesktop ? 0.06 : undefined }} />
          <div className="orb" style={{ width: 400, height: 400, background: '#7dcfff', bottom: '-10%', right: '-10%', animationDelay: '-7s', opacity: isDesktop ? 0.04 : undefined }} />
          <div className="orb" style={{ width: 300, height: 300, background: '#9ece6a', top: '40%', right: '20%', animationDelay: '-14s', opacity: isDesktop ? 0.03 : 0.08 }} />
        </div>

        <div className="absolute inset-0 grid-bg pointer-events-none" />

        {mounted && CODE_FRAGMENTS.map((text, i) => (
          <FloatingCode
            key={i}
            text={text}
            delay={i * 1.8}
            duration={14 + Math.random() * 8}
            x={5 + (i * 5.5) % 85}
          />
        ))}

        <div className="relative z-10 grid grid-cols-2 md:grid-cols-3 gap-3 pointer-events-none" style={{ width: '100%', maxWidth: '810px' }}>

          <motion.div
            className="col-span-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="terminal-window h-full pointer-events-auto" style={{
              boxShadow: '0 20px 60px rgba(0,0,0,0.3), 0 0 40px rgba(187,154,247,0.04)',
            }}>
              <Terminal fullWidth />
            </div>
          </motion.div>

          <NavCard href="/notes" accent="#bb9af7" icon={<IconNotes size={18} />} title="Notes" desc="Personal brain dump" delay={0.1} />
          <NavCard href="/projects" accent="#7dcfff" icon={<IconCode size={18} />} title="Projects" desc="Vuln writeups & builds" delay={0.15} />
          <NavCard href="/goon-hub" accent="#9ece6a" icon={<IconMap size={18} />} title="Sitemap" desc="Everything, mapped" delay={0.2} />
          <NavCard href="/message-board" accent="#e0af68" icon={<IconMessageCircle size={18} />} title="Messages" desc="Leave your mark" delay={0.25} />

          <div className="col-span-2 md:col-span-3 flex justify-center pt-1 pointer-events-auto">
            <Switch
              label="I am locked in."
              size="sm"
              onChange={(event) => {
                setIsGooning(event.currentTarget.checked);
                if (!event.currentTarget.checked) {
                  setRatingValue(0);
                  setNotificationVisible(false);
                  setGoodGooner(false);
                }
              }}
            />
          </div>

          {isGooning && (
            <motion.div
              className="col-span-2 md:col-span-3 pointer-events-auto"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="rounded-xl p-4" style={{ border: '1px solid rgba(187, 154, 247, 0.2)', backgroundColor: 'rgba(187, 154, 247, 0.05)' }}>
                <Text size="md" fw={700} mb={8} style={{ color: '#c0caf5' }}>Hello, Goon.</Text>
                <div className="flex items-center gap-3">
                  <Text size="sm" c="dimmed">How locked in?</Text>
                  <Tooltip
                    position="top"
                    label="Disclaimer: By giving us a rating, you agree to your information (i.e., the rating) being sold for exorbitant prices"
                  >
                    <Rating
                      value={ratingValue}
                      onChange={(value) => {
                        setRatingValue(value);
                        if (value <= 4) {
                          setNotificationVisible(true);
                          setGoodGooner(false);
                        } else {
                          setGoodGooner(true);
                          setNotificationVisible(false);
                        }
                      }}
                    />
                  </Tooltip>
                </div>
              </div>
            </motion.div>
          )}

        </div>

        {/* Notifications — below the grid so they don't overlap on mobile */}
        <div className="relative z-10 pointer-events-auto mt-4" style={{ width: '100%', maxWidth: '810px' }}>
          {goodGooner && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Alert
                variant="light"
                color="grape"
                icon={<IconInfoCircle />}
                onClose={() => setGoodGooner(false)}
                withCloseButton
              >
                <Text size="sm" mb={10}>Good, very very good.</Text>
                <Link href="macbook" style={{ textDecoration: 'none' }}>
                  <Button size="xs" variant="light" leftSection={<IconHeart size={12} />} rightSection={<IconArrowRight size={12} />}>
                    Visit the goon center
                  </Button>
                </Link>
              </Alert>
            </motion.div>
          )}

          {notificationVisible && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Notification
                title={
                  <>
                    <Text size="sm">Perhaps you should goon better.</Text>
                    <Text style={{ color: '#f7768e' }} fw={700} size="sm">Do better.</Text>
                  </>
                }
                onClose={() => setNotificationVisible(false)}
              />
            </motion.div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
