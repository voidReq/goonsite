"use client";

import { useState, useEffect } from 'react';
import { Switch, Rating, Text, Tooltip, Notification, Alert, Button } from '@mantine/core';
import { IconArrowRight, IconInfoCircle, IconHeart } from '@tabler/icons-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Terminal } from './components/ui/Terminal';
import PageShell from './components/ui/PageShell';

// Floating code snippets that drift across the background
const CODE_FRAGMENTS = [
  'nmap -sV -sC', 'SELECT * FROM', '0xDEADBEEF', 'chmod 777',
  'curl -X POST', 'ssh root@', '#!/bin/bash', 'import os',
  'while True:', 'sudo rm -rf', '0x41414141', 'grep -r "flag"',
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

export default function Home() {
  const [isGooning, setIsGooning] = useState(false);
  const [ratingValue, setRatingValue] = useState(0);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [goodGooner, setGoodGooner] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  return (
    <PageShell maxWidth="md" noBreadcrumbs>
      <div className="relative min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center py-8 overflow-hidden">

        {/* Animated background orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="orb" style={{ width: 500, height: 500, background: '#bb9af7', top: '-15%', left: '-10%', animationDelay: '0s' }} />
          <div className="orb" style={{ width: 400, height: 400, background: '#7dcfff', bottom: '-10%', right: '-10%', animationDelay: '-7s' }} />
          <div className="orb" style={{ width: 300, height: 300, background: '#9ece6a', top: '40%', right: '20%', animationDelay: '-14s', opacity: 0.08 }} />
        </div>

        {/* Grid background */}
        <div className="absolute inset-0 grid-bg pointer-events-none" />

        {/* Floating code snippets */}
        {mounted && CODE_FRAGMENTS.map((text, i) => (
          <FloatingCode
            key={i}
            text={text}
            delay={i * 1.8}
            duration={14 + Math.random() * 8}
            x={5 + (i * 5.5) % 85}
          />
        ))}

        {/* Main content */}
        <div className="relative z-10 w-full max-w-2xl flex flex-col items-center gap-8 px-4">

          {/* Hero text */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="text-center"
          >
            <h1 className="font-mono text-4xl md:text-5xl font-black tracking-tight mb-3" style={{
              background: 'linear-gradient(135deg, #bb9af7 0%, #7dcfff 50%, #9ece6a 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              lineHeight: 1.1,
            }}>
              goonsite.org
            </h1>
            <p className="text-[#565f89] text-sm md:text-base font-mono">
              Security research &middot; Vulnerability writeups &middot; Interactive tools
            </p>
          </motion.div>

          {/* Terminal */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6, ease: 'easeOut' }}
            className="w-full"
          >
            <div className="terminal-window" style={{
              boxShadow: '0 20px 60px rgba(0,0,0,0.4), 0 0 40px rgba(187,154,247,0.06)',
            }}>
              <Terminal fullWidth />
            </div>
          </motion.div>

          {/* Status line */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="flex items-center gap-6 text-xs font-mono text-[#565f89]"
          >
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#9ece6a] inline-block" /> self-hosted
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7dcfff] inline-block" /> open source
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#bb9af7] inline-block" /> no tracking
            </span>
          </motion.div>

          {/* Easter egg toggle */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
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
          </motion.div>

          {isGooning && (
            <motion.div
              className="w-full"
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
      </div>

      {goodGooner && (
        <Alert
          variant="light"
          color="grape"
          style={{ position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, maxWidth: '280px', width: 'calc(100% - 32px)' }}
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
      )}

      {notificationVisible && (
        <Notification
          title={
            <>
              <Text size="sm">Perhaps you should goon better.</Text>
              <Text style={{ color: '#f7768e' }} fw={700} size="sm">Do better.</Text>
            </>
          }
          onClose={() => setNotificationVisible(false)}
          style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 1000, maxWidth: '320px', width: 'calc(100% - 32px)' }}
        />
      )}
    </PageShell>
  );
}
