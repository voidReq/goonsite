"use client";

import { useState } from 'react';
import { MantineProvider, Switch, Rating, Text, Tooltip, Notification, Alert, Button } from '@mantine/core';
import '@mantine/core/styles.css';
import { IconArrowRight, IconInfoCircle, IconHeart, IconNotes, IconCode, IconMap, IconMessageCircle, IconChevronRight } from '@tabler/icons-react';
import Link from 'next/link';
import { Terminal } from './components/ui/Terminal';

interface NavCardProps {
  href: string;
  accent: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}

function NavCard({ href, accent, icon, title, desc }: NavCardProps) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div
        className="group h-full rounded-xl border border-white/10 bg-white/5 p-4 md:p-5 cursor-pointer transition-all duration-200 hover:bg-white/8 hover:border-white/20"
        style={{ minHeight: '100px' }}
      >
        <div className="flex flex-col h-full justify-between gap-2">
          <div>
            <div style={{ color: accent }} className="mb-2">{icon}</div>
            <div className="font-mono font-bold text-white text-base leading-tight">{title}</div>
            <div className="text-white/40 text-xs mt-0.5">{desc}</div>
          </div>
          <IconChevronRight size={13} className="text-white/20 group-hover:text-white/50 transition-colors" />
        </div>
      </div>
    </Link>
  );
}

export default function Home() {
  const [isGooning, setIsGooning] = useState(false);
  const [ratingValue, setRatingValue] = useState(0);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [goodGooner, setGoodGooner] = useState(false);

  return (
    <MantineProvider forceColorScheme="dark">
      <div className="min-h-screen flex flex-col items-center justify-start md:justify-center p-4 py-8 md:p-8">
        <div className="w-full max-w-3xl grid grid-cols-2 md:grid-cols-3 gap-3">

          {/* Terminal — hero, spans 2 cols on mobile, 2 of 3 on desktop */}
          <div className="col-span-2 rounded-xl overflow-hidden border border-white/10 h-full">
            <Terminal fullWidth />
          </div>

          {/* Notes — sits to the right of terminal on desktop, wraps to next row on mobile */}
          <NavCard
            href="/notes"
            accent="#bb9af7"
            icon={<IconNotes size={18} />}
            title="Notes"
            desc="Personal brain dump"
          />

          {/* Projects */}
          <NavCard
            href="/projects"
            accent="#7dcfff"
            icon={<IconCode size={18} />}
            title="Projects"
            desc="Vuln writeups & builds"
          />

          {/* Sitemap */}
          <NavCard
            href="/goon-hub"
            accent="#9ece6a"
            icon={<IconMap size={18} />}
            title="Sitemap"
            desc="Everything, mapped"
          />

          {/* Message Board */}
          <NavCard
            href="/message-board"
            accent="#e0af68"
            icon={<IconMessageCircle size={18} />}
            title="Messages"
            desc="Leave your mark"
          />

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

          {/* Locked in expansion */}
          {isGooning && (
            <div className="col-span-2 md:col-span-3 rounded-xl border border-purple-600/40 bg-purple-950/20 p-4">
              <Text size="md" fw={700} mb={8}>Hello, Goon.</Text>
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
              <Text style={{ color: 'red' }} fw={700} size="sm">Do better.</Text>
            </>
          }
          onClose={() => setNotificationVisible(false)}
          style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 1000, maxWidth: '320px', width: 'calc(100% - 32px)' }}
        />
      )}
    </MantineProvider>
  );
}
