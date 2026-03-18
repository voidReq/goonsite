'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  MantineProvider,
  TextInput,
  Textarea,
  Button,
  Text,
  Loader,
  Paper,
  Group,
  Badge,
} from '@mantine/core';
import '@mantine/core/styles.css';
import { IconSend, IconArrowLeft, IconMessageCircle, IconTrophy } from '@tabler/icons-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import TicTacToe from './games/TicTacToe';
import ConnectFour from './games/ConnectFour';
import Chess from './games/Chess';

type GameChoice = 'tictactoe' | 'connect4' | 'chess';

const GAMES: { id: GameChoice; label: string; emoji: string; desc: string }[] = [
  { id: 'tictactoe', label: 'Tic-Tac-Toe', emoji: '❌', desc: 'Quick & easy' },
  { id: 'connect4', label: 'Connect Four', emoji: '🔴', desc: 'A classic' },
  { id: 'chess', label: 'Chess', emoji: '♟', desc: 'For the brave' },
];

interface Message {
  id: string;
  text: string;
  author: string;
  timestamp: string;
  game?: string;
}

const GAME_ICONS: Record<string, string> = {
  tictactoe: '❌',
  connect4: '🔴',
  chess: '♟',
};

const PASTEL_COLORS = [
  'rgba(124, 58, 237, 0.15)',
  'rgba(37, 99, 235, 0.15)',
  'rgba(5, 150, 105, 0.15)',
  'rgba(217, 119, 6, 0.15)',
  'rgba(236, 72, 153, 0.15)',
  'rgba(139, 92, 246, 0.15)',
  'rgba(14, 165, 233, 0.15)',
];

const BORDER_COLORS = [
  'rgba(124, 58, 237, 0.5)',
  'rgba(37, 99, 235, 0.5)',
  'rgba(5, 150, 105, 0.5)',
  'rgba(217, 119, 6, 0.5)',
  'rgba(236, 72, 153, 0.5)',
  'rgba(139, 92, 246, 0.5)',
  'rgba(14, 165, 233, 0.5)',
];

function MessageCard({
  message,
  index,
  onMouseEnter,
  onMouseLeave,
  isHovered,
  isMobile,
}: {
  message: Message;
  index: number;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  isHovered: boolean;
  isMobile: boolean;
}) {
  const colorIdx = index % PASTEL_COLORS.length;
  const rotation = ((index * 13) % 10) - 5;
  const zOffset = ((index * 37) % 80) - 40;

  if (isMobile) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.06, duration: 0.4, type: 'spring', stiffness: 120 }}
        style={{ width: '100%' }}
      >
        <div
          style={{
            background: PASTEL_COLORS[colorIdx],
            border: `1px solid ${BORDER_COLORS[colorIdx]}`,
            borderRadius: '12px',
            padding: '16px',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          }}
        >
          <Text
            size="sm"
            style={{ color: '#e2e8f0', lineHeight: 1.6, marginBottom: '10px', wordBreak: 'break-word' }}
          >
            &ldquo;{message.text}&rdquo;
          </Text>
          <Group justify="space-between" align="center">
            <Text size="xs" style={{ color: '#94a3b8', fontStyle: 'italic' }}>
              &mdash; {message.author}
            </Text>
            <Group gap={6} align="center">
              {message.game && GAME_ICONS[message.game] && (
                <span title={message.game} style={{ fontSize: '12px', lineHeight: 1 }}>
                  {GAME_ICONS[message.game]}
                </span>
              )}
              <Text size="xs" style={{ color: '#64748b' }}>
                {new Date(message.timestamp).toLocaleDateString()}
              </Text>
            </Group>
          </Group>
        </div>
      </motion.div>
    );
  }

  const row = Math.floor(index / 3);
  const col = index % 3;
  const xOffset = (col - 1) * 320 + (row % 2 === 0 ? 0 : 40);
  const yBase = row * 220;

  return (
    <motion.div
      initial={{ opacity: 0, y: 60, rotateX: -15 }}
      animate={{
        opacity: 1,
        y: 0,
        rotateX: 0,
        z: isHovered ? 80 : zOffset,
        rotateY: isHovered ? 0 : rotation,
        scale: isHovered ? 1.08 : 1,
      }}
      transition={{
        delay: index * 0.08,
        duration: 0.6,
        type: 'spring',
        stiffness: 100,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: 'absolute',
        left: `calc(50% + ${xOffset}px)`,
        top: `${yBase}px`,
        transform: `translateX(-50%)`,
        transformStyle: 'preserve-3d',
        width: '280px',
        cursor: 'default',
        zIndex: isHovered ? 50 : 10 - Math.abs(zOffset),
      }}
    >
      <div
        style={{
          background: PASTEL_COLORS[colorIdx],
          border: `1px solid ${BORDER_COLORS[colorIdx]}`,
          borderRadius: '12px',
          padding: '20px',
          backdropFilter: 'blur(12px)',
          boxShadow: isHovered
            ? `0 20px 60px rgba(0,0,0,0.4), 0 0 30px ${BORDER_COLORS[colorIdx]}`
            : '0 8px 32px rgba(0,0,0,0.2)',
          transition: 'box-shadow 0.3s ease',
        }}
      >
        <Text
          size="sm"
          style={{
            color: '#e2e8f0',
            lineHeight: 1.6,
            marginBottom: '12px',
            wordBreak: 'break-word',
          }}
        >
          &ldquo;{message.text}&rdquo;
        </Text>
        <Group justify="space-between" align="center">
          <Text size="xs" style={{ color: '#94a3b8', fontStyle: 'italic' }}>
            &mdash; {message.author}
          </Text>
          <Group gap={6} align="center">
            {message.game && GAME_ICONS[message.game] && (
              <span title={message.game} style={{ fontSize: '12px', lineHeight: 1 }}>
                {GAME_ICONS[message.game]}
              </span>
            )}
            <Text size="xs" style={{ color: '#64748b' }}>
              {new Date(message.timestamp).toLocaleDateString()}
            </Text>
          </Group>
        </Group>
      </div>
    </motion.div>
  );
}

function FloatingParticle({ delay, duration }: { delay: number; duration: number }) {
  const size = 2 + Math.random() * 3;
  const startX = Math.random() * 100;
  return (
    <motion.div
      initial={{ opacity: 0, x: `${startX}vw`, y: '100vh' }}
      animate={{
        opacity: [0, 0.6, 0],
        y: '-10vh',
      }}
      transition={{
        delay,
        duration,
        repeat: Infinity,
        ease: 'linear',
      }}
      style={{
        position: 'fixed',
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        background: 'rgba(124, 58, 237, 0.4)',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}

export default function MessageBoardPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [author, setAuthor] = useState('');
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  const [selectedGame, setSelectedGame] = useState<GameChoice | null>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    fetch('/api/messages')
      .then((r) => r.json())
      .then((data) => setMessages(data.messages || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!sceneRef.current) return;
    const rect = sceneRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setMousePos({ x, y });
  }, []);

  const handleSubmit = async () => {
    if (!author.trim() || !text.trim()) return;
    if (wordCount > 150) return;

    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), author: author.trim(), game: selectedGame }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({ type: 'success', msg: data.message || 'Submitted!' });
        setText('');
      } else {
        setFeedback({ type: 'error', msg: data.error || 'Something went wrong.' });
      }
    } catch {
      setFeedback({ type: 'error', msg: 'Network error. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const boardHeight = isMobile ? 'auto' : `${Math.max(600, Math.ceil(messages.length / 3) * 220 + 100)}px`;

  return (
    <MantineProvider forceColorScheme="dark">
      {/* Floating particles — fewer on mobile */}
      {Array.from({ length: isMobile ? 6 : 15 }).map((_, i) => (
        <FloatingParticle key={i} delay={i * 1.2} duration={8 + Math.random() * 6} />
      ))}

      <div
        style={{
          minHeight: '100vh',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.08) 0%, #0a0a0a 70%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ padding: '30px 20px 0', maxWidth: '900px', margin: '0 auto' }}>
          <Group justify="space-between" align="center" mb="md">
            <Link href="/" style={{ textDecoration: 'none' }}>
              <Button variant="subtle" color="gray" leftSection={<IconArrowLeft size={16} />}>
                Back
              </Button>
            </Link>
            <Badge
              size="lg"
              variant="light"
              color="violet"
              leftSection={<IconMessageCircle size={14} />}
            >
              {messages.length} message{messages.length !== 1 ? 's' : ''}
            </Badge>
          </Group>

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ textAlign: 'center', marginBottom: '30px' }}
          >
            <Text
              size="xl"
              fw={700}
              style={{
                fontSize: isMobile ? '1.6rem' : '2.2rem',
                background: 'linear-gradient(135deg, #7c3aed, #2563eb, #ec4899)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '8px',
              }}
            >
              Message Board
            </Text>
            <Text size="sm" c="dimmed">
              Beat the bot, leave a message. It&apos;ll appear once approved.
            </Text>
          </motion.div>
        </div>

        {/* 3D Message Scene (desktop) / Stacked cards (mobile) */}
        <div
          ref={sceneRef}
          onMouseMove={isMobile ? undefined : handleMouseMove}
          style={{
            perspective: isMobile ? 'none' : '1200px',
            perspectiveOrigin: '50% 30%',
            maxWidth: isMobile ? '100%' : '1100px',
            margin: '0 auto',
            padding: isMobile ? '0 16px' : '0 20px',
          }}
        >
          <div
            style={
              isMobile
                ? {
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    alignItems: 'center',
                  }
                : {
                    transformStyle: 'preserve-3d',
                    transform: `rotateY(${mousePos.x * 3}deg) rotateX(${-mousePos.y * 2}deg)`,
                    transition: 'transform 0.15s ease-out',
                    position: 'relative',
                    height: boardHeight,
                  }
            }
          >
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '60px' }}>
                <Loader color="violet" size="lg" />
              </div>
            ) : messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ textAlign: 'center', paddingTop: '60px' }}
              >
                <Text size="lg" c="dimmed">
                  No messages yet. Be the first to leave one!
                </Text>
              </motion.div>
            ) : (
              <AnimatePresence>
                {messages.map((msg, i) => (
                  <MessageCard
                    key={msg.id}
                    message={msg}
                    index={i}
                    isHovered={hoveredIdx === i}
                    onMouseEnter={() => setHoveredIdx(i)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    isMobile={isMobile}
                  />
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Game Challenge */}
        {!hasWon && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            style={{
              maxWidth: '600px',
              margin: isMobile ? '24px auto' : '40px auto',
              padding: isMobile ? '0 16px 20px' : '0 20px 20px',
            }}
          >
            <Paper
              p={isMobile ? 'md' : 'xl'}
              radius="lg"
              style={{
                background: 'rgba(20, 20, 30, 0.8)',
                border: '1px solid rgba(124, 58, 237, 0.2)',
                backdropFilter: 'blur(16px)',
              }}
            >
              <Text fw={600} size="lg" mb="xs" ta="center" style={{ color: '#e2e8f0' }}>
                Want to leave a message?
              </Text>
              <Text size="xs" c="dimmed" ta="center" mb={selectedGame ? 'md' : 'lg'}>
                You&apos;ll have to earn it first. Pick your challenge.
              </Text>

              {/* Game selector */}
              <AnimatePresence mode="wait">
                {!selectedGame ? (
                  <motion.div
                    key="selector"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, y: -10 }}
                    style={{
                      display: 'flex',
                      flexDirection: isMobile ? 'column' : 'row',
                      gap: '10px',
                      justifyContent: 'center',
                    }}
                  >
                    {GAMES.map((game) => (
                      <motion.button
                        key={game.id}
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setSelectedGame(game.id)}
                        style={{
                          background: 'rgba(40, 40, 60, 0.6)',
                          border: '1px solid rgba(124, 58, 237, 0.3)',
                          borderRadius: '12px',
                          padding: isMobile ? '14px 20px' : '16px 20px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '6px',
                          flex: 1,
                          minWidth: isMobile ? undefined : '140px',
                        }}
                      >
                        <span style={{ fontSize: '1.6rem' }}>{game.emoji}</span>
                        <Text size="sm" fw={600} style={{ color: '#e2e8f0' }}>
                          {game.label}
                        </Text>
                        <Text size="xs" c="dimmed">{game.desc}</Text>
                      </motion.button>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key="game"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <Group justify="center" mb="md">
                      <Button
                        variant="subtle"
                        color="gray"
                        size="xs"
                        onClick={() => setSelectedGame(null)}
                      >
                        &larr; Pick a different game
                      </Button>
                    </Group>

                    {selectedGame === 'tictactoe' && (
                      <TicTacToe
                        onWin={() => {
                          setHasWon(true);
                          setTimeout(() => {
                            formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }, 300);
                        }}
                      />
                    )}
                    {selectedGame === 'connect4' && (
                      <ConnectFour
                        onWin={() => {
                          setHasWon(true);
                          setTimeout(() => {
                            formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }, 300);
                        }}
                      />
                    )}
                    {selectedGame === 'chess' && (
                      <Chess
                        onWin={() => {
                          setHasWon(true);
                          setTimeout(() => {
                            formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }, 300);
                        }}
                      />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </Paper>
          </motion.div>
        )}

        {/* Submission Form — unlocked after winning */}
        <AnimatePresence>
          {hasWon && (
            <motion.div
              ref={formRef}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, type: 'spring', stiffness: 100 }}
              style={{
                maxWidth: '600px',
                margin: isMobile ? '0 auto' : '0 auto',
                padding: isMobile ? '0 16px 40px' : '0 20px 60px',
              }}
            >
              <Paper
                p={isMobile ? 'md' : 'xl'}
                radius="lg"
                style={{
                  background: 'rgba(20, 20, 30, 0.8)',
                  border: '1px solid rgba(74, 222, 128, 0.3)',
                  backdropFilter: 'blur(16px)',
                }}
              >
                <Group gap="xs" mb="md" justify="center">
                  <IconTrophy size={20} color="#4ade80" />
                  <Text fw={600} size="lg" style={{ color: '#4ade80' }}>
                    You earned it. Leave your message.
                  </Text>
                </Group>

                <TextInput
                  label="Your name"
                  placeholder="Anonymous Goon"
                  value={author}
                  onChange={(e) => setAuthor(e.currentTarget.value)}
                  maxLength={50}
                  mb="sm"
                />

                <Textarea
                  label="Message"
                  placeholder="Say something nice... or don't."
                  value={text}
                  onChange={(e) => setText(e.currentTarget.value)}
                  minRows={3}
                  maxRows={6}
                  mb="xs"
                />

                <Group justify="space-between" mb="md">
                  <Text size="xs" c={wordCount > 150 ? 'red' : 'dimmed'}>
                    {wordCount}/150 words
                  </Text>
                  {wordCount > 150 && (
                    <Text size="xs" c="red">
                      Over the limit!
                    </Text>
                  )}
                </Group>

                <AnimatePresence>
                  {feedback && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <Text
                        size="sm"
                        mb="sm"
                        c={feedback.type === 'success' ? 'green' : 'red'}
                        fw={500}
                      >
                        {feedback.msg}
                      </Text>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button
                  fullWidth
                  color="violet"
                  leftSection={<IconSend size={16} />}
                  loading={submitting}
                  disabled={!author.trim() || !text.trim() || wordCount > 150}
                  onClick={handleSubmit}
                >
                  Submit Message
                </Button>

                <Text size="xs" c="dimmed" mt="sm" ta="center">
                  Messages are reviewed before appearing on the board.
                </Text>
              </Paper>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MantineProvider>
  );
}
