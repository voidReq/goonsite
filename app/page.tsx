"use client";

import { useState } from 'react';
import { Switch, Rating, Text, Tooltip, Notification, Alert, Button } from '@mantine/core';
import { IconArrowRight, IconInfoCircle, IconHeart, IconNotes, IconCode, IconMap, IconMessageCircle, IconChevronRight } from '@tabler/icons-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Terminal } from './components/ui/Terminal';
import PageShell from './components/ui/PageShell';
import GlowCard from './components/ui/GlowCard';

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
      <Link href={href} style={{ textDecoration: 'none' }}>
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

export default function Home() {
  const [isGooning, setIsGooning] = useState(false);
  const [ratingValue, setRatingValue] = useState(0);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [goodGooner, setGoodGooner] = useState(false);

  return (
    <PageShell maxWidth="md" noBreadcrumbs>
      <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-start md:justify-center py-4 md:py-8">
        <div className="w-full grid grid-cols-2 md:grid-cols-3 gap-3">

          {/* Terminal hero */}
          <motion.div
            className="col-span-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="terminal-window h-full">
              <Terminal fullWidth />
            </div>
          </motion.div>

          <NavCard href="/notes" accent="#bb9af7" icon={<IconNotes size={18} />} title="Notes" desc="Personal brain dump" delay={0.1} />
          <NavCard href="/projects" accent="#7dcfff" icon={<IconCode size={18} />} title="Projects" desc="Vuln writeups & builds" delay={0.15} />
          <NavCard href="/goon-hub" accent="#9ece6a" icon={<IconMap size={18} />} title="Sitemap" desc="Everything, mapped" delay={0.2} />
          <NavCard href="/message-board" accent="#e0af68" icon={<IconMessageCircle size={18} />} title="Messages" desc="Leave your mark" delay={0.25} />

          {/* Easter egg toggle */}
          <div className="col-span-2 md:col-span-3 flex justify-center pt-1">
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
              className="col-span-2 md:col-span-3"
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
