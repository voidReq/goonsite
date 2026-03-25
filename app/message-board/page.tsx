'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  TextInput,
  Textarea,
  Button,
  Text,
  Loader,
  Paper,
  Group,
  Badge,
} from '@mantine/core';
import { IconSend, IconMessageCircle, IconTrophy } from '@tabler/icons-react';
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

type MessageColor = 'violet' | 'blue' | 'green' | 'amber' | 'pink' | 'cyan' | 'red';

interface Message {
  id: string;
  text: string;
  author: string;
  timestamp: string;
  game?: string;
  color?: MessageColor;
}

const GAME_ICONS: Record<string, string> = {
  tictactoe: '❌',
  connect4: '🔴',
  chess: '♟',
};

const COLOR_MAP: Record<MessageColor, { bg: string; border: string; rgb: string }> = {
  violet: { bg: 'rgba(124, 58, 237, 0.15)', border: 'rgba(124, 58, 237, 0.5)', rgb: '124, 58, 237' },
  blue:   { bg: 'rgba(37, 99, 235, 0.15)',  border: 'rgba(37, 99, 235, 0.5)',  rgb: '37, 99, 235' },
  green:  { bg: 'rgba(5, 150, 105, 0.15)',  border: 'rgba(5, 150, 105, 0.5)',  rgb: '5, 150, 105' },
  amber:  { bg: 'rgba(217, 119, 6, 0.15)',  border: 'rgba(217, 119, 6, 0.5)',  rgb: '217, 119, 6' },
  pink:   { bg: 'rgba(236, 72, 153, 0.15)', border: 'rgba(236, 72, 153, 0.5)', rgb: '236, 72, 153' },
  cyan:   { bg: 'rgba(14, 165, 233, 0.15)', border: 'rgba(14, 165, 233, 0.5)', rgb: '14, 165, 233' },
  red:    { bg: 'rgba(239, 68, 68, 0.15)',  border: 'rgba(239, 68, 68, 0.5)',  rgb: '239, 68, 68' },
};

const COLOR_KEYS: MessageColor[] = ['violet', 'blue', 'green', 'amber', 'pink', 'cyan', 'red'];

const PASTEL_COLORS = COLOR_KEYS.map(k => COLOR_MAP[k].bg);
const BORDER_COLORS = COLOR_KEYS.map(k => COLOR_MAP[k].border);

const DEV_MESSAGES: Message[] = [
  { id: '1', text: 'This site goes hard ngl', author: 'xXgamer99Xx', timestamp: '2026-02-10T08:30:00Z', game: 'tictactoe', color: 'violet' },
  { id: '2', text: 'Beat the chess bot on my first try lol get rekt', author: 'Magnus Carlsen (fake)', timestamp: '2026-02-12T14:20:00Z', game: 'chess', color: 'blue' },
  { id: '3', text: 'I have been trying to beat Connect Four for 45 minutes. I am not okay.', author: 'frustrated_frank', timestamp: '2026-02-15T22:10:00Z', game: 'connect4', color: 'red' },
  { id: '4', text: 'Leaving my mark here. Hi future internet archaeologists.', author: 'digital_fossil', timestamp: '2026-02-18T11:00:00Z', game: 'tictactoe', color: 'green' },
  { id: '5', text: 'The vibes are immaculate', author: 'vibecheck', timestamp: '2026-02-20T16:45:00Z', game: 'chess', color: 'cyan' },
  { id: '6', text: 'First! ...wait there are already messages. Whatever. First in spirit.', author: 'AlwaysLate', timestamp: '2026-02-22T09:30:00Z', game: 'tictactoe', color: 'pink' },
  { id: '7', text: 'I showed this to my cat and she walked across my keyboard. Taking that as approval.', author: 'cat_parent_42', timestamp: '2026-02-25T13:15:00Z', game: 'connect4', color: 'amber' },
  { id: '8', text: 'Goon site? More like GOOD site. I will not be taking questions.', author: 'pun_master', timestamp: '2026-02-28T20:00:00Z', game: 'tictactoe', color: 'violet' },
  { id: '9', text: 'Been lurking for a while. Finally beat tic-tac-toe to say: nice work.', author: 'silent_observer', timestamp: '2026-03-02T07:45:00Z', game: 'tictactoe', color: 'blue' },
  { id: '10', text: 'The chess bot blundered its queen on move 3. I almost feel bad. Almost.', author: 'GothamChess Stan', timestamp: '2026-03-04T18:30:00Z', game: 'chess', color: 'green' },
  { id: '11', text: 'Dropping this message like its hot', author: 'DJ_Placeholder', timestamp: '2026-03-06T12:00:00Z', game: 'connect4', color: 'pink' },
  { id: '12', text: 'This is my Roman Empire now', author: 'emperor_of_goon', timestamp: '2026-03-08T15:20:00Z', game: 'chess', color: 'red' },
  { id: '13', text: 'My therapist said I need to touch grass. Does this count?', author: 'terminally_online', timestamp: '2026-03-10T21:00:00Z', game: 'tictactoe', color: 'cyan' },
  { id: '14', text: 'Connect Four is actually just vertical tic-tac-toe with extra steps. Change my mind.', author: 'shower_thoughts', timestamp: '2026-03-12T10:30:00Z', game: 'connect4', color: 'amber' },
  { id: '15', text: 'Whoever made this: you are doing the lords work', author: 'grateful_goon', timestamp: '2026-03-14T17:45:00Z', game: 'chess', color: 'violet' },
  { id: '16', text: 'I was here. Remember me when this site blows up.', author: 'early_adopter', timestamp: '2026-03-15T08:00:00Z', game: 'tictactoe', color: 'blue' },
  { id: '17', text: 'just vibing tbh', author: 'low_effort_larry', timestamp: '2026-03-16T14:30:00Z', game: 'connect4', color: 'pink' },
  { id: '18', text: 'The particles floating in the background are mesmerizing. I have been staring at them for 10 minutes.', author: 'easily_distracted', timestamp: '2026-03-16T23:00:00Z', game: 'tictactoe', color: 'cyan' },
];

function formatMessageDate(timestamp: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(timestamp));
}

function MessageCard({
  message,
  index,
  onMouseEnter,
  onMouseLeave,
  isHovered,
  isMobile,
  isPinned,
}: {
  message: Message;
  index: number;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  isHovered: boolean;
  isMobile: boolean;
  isPinned?: boolean;
}) {
  const msgColor = message.color && COLOR_MAP[message.color]
    ? COLOR_MAP[message.color]
    : { bg: PASTEL_COLORS[index % PASTEL_COLORS.length], border: BORDER_COLORS[index % BORDER_COLORS.length], rgb: '124, 58, 237' };

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
            background: isPinned ? 'rgba(234, 179, 8, 0.15)' : msgColor.bg,
            border: isPinned ? '1.5px solid rgba(234, 179, 8, 0.6)' : `1px solid ${msgColor.border}`,
            borderRadius: '12px',
            padding: '16px',
            backdropFilter: 'blur(12px)',
            boxShadow: isPinned
              ? '0 4px 24px rgba(234, 179, 8, 0.2), 0 0 12px rgba(234, 179, 8, 0.1)'
              : '0 4px 20px rgba(0,0,0,0.2)',
          }}
        >
          {isPinned && (
            <Text size="xs" fw={700} mb={6} style={{ color: '#eab308', letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>
              📌 First message
            </Text>
          )}
          <Text
            size={isPinned ? 'md' : 'sm'}
            fw={isPinned ? 600 : 400}
            style={{ color: isPinned ? '#fde68a' : '#e2e8f0', lineHeight: 1.6, marginBottom: '10px', wordBreak: 'break-word' }}
          >
            &ldquo;{message.text}&rdquo;
          </Text>
          <Group justify="space-between" align="center">
            <Text size="xs" style={{ color: isPinned ? '#d4a017' : '#94a3b8', fontStyle: 'italic' }}>
              &mdash; {message.author}
            </Text>
            <Group gap={6} align="center">
              {message.game && GAME_ICONS[message.game] && (
                <span title={message.game} style={{ fontSize: '12px', lineHeight: 1 }}>
                  {GAME_ICONS[message.game]}
                </span>
              )}
              <Text size="xs" style={{ color: isPinned ? '#b8860b' : '#64748b' }}>
                {formatMessageDate(message.timestamp)}
              </Text>
            </Group>
          </Group>
        </div>
      </motion.div>
    );
  }


  const row = Math.floor(index / 3);
  const col = index % 3;
  const xOffset = (col - 1) * 320;
  const yBase = row * 260;
  const rotation = ((index * 13) % 10) - 5;

  return (
    <div
      style={{
        position: 'absolute',
        left: `calc(50% + ${xOffset}px - 150px)`,
        top: `${yBase}px`,
        width: '300px',
        cursor: 'default',
        padding: '10px',
        boxSizing: 'border-box',
      }}
    >
      <motion.div
        onHoverStart={onMouseEnter}
        onHoverEnd={onMouseLeave}
        initial={{ opacity: 0, y: 60, rotateX: -15 }}
        animate={{
          opacity: 1,
          y: 0,
          rotateX: 0,
          rotateY: isHovered ? 0 : rotation,
          scale: isHovered ? 1.03 : 1,
          z: isHovered ? 60 : 0,
        }}
        transition={{
          delay: index * 0.08,
          duration: 0.5,
          type: 'spring',
          stiffness: 120,
          damping: 15,
        }}
        style={{
          transformStyle: 'preserve-3d',
          position: 'relative',
          zIndex: isHovered ? 50 : 1,
          willChange: 'transform',
        }}
      >
        <div
          style={{
            background: isPinned
              ? (isHovered ? 'rgba(30, 25, 10, 0.98)' : 'rgba(234, 179, 8, 0.15)')
              : (isHovered ? 'rgba(20, 20, 30, 0.98)' : msgColor.bg),
            border: isPinned
              ? '1.5px solid rgba(234, 179, 8, 0.6)'
              : `1px solid ${msgColor.border}`,
            borderRadius: '12px',
            padding: '20px',
            backdropFilter: isHovered ? 'blur(20px) saturate(180%)' : 'blur(12px)',
            boxShadow: isHovered
              ? `0 12px 40px rgba(0,0,0,0.5), 0 0 20px ${isPinned ? 'rgba(234, 179, 8, 0.3)' : msgColor.border}`
              : '0 8px 32px rgba(0,0,0,0.2)',
            transition: 'box-shadow 0.3s ease, background 0.3s ease, backdrop-filter 0.3s ease',
            minHeight: '120px',
            maxHeight: isHovered ? 'none' : '250px',
            overflow: 'hidden',
          }}
        >
          {isPinned && (
            <Text
              size="xs"
              fw={700}
              mb={6}
              style={{
                color: '#eab308',
                letterSpacing: '0.05em',
                textTransform: 'uppercase' as const,
              }}
            >
              📌 First message
            </Text>
          )}

          <Text
            size={isPinned ? 'md' : 'sm'}
            fw={isPinned ? 600 : 400}
            style={{
              color: isPinned ? '#fde68a' : '#e2e8f0',
              lineHeight: 1.6,
              marginBottom: '12px',
              wordBreak: 'break-word',
              overflowWrap: 'anywhere',
              ...(isHovered
                ? {}
                : {
                    display: '-webkit-box',
                    WebkitLineClamp: 5,
                    WebkitBoxOrient: 'vertical' as const,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }),
            }}
          >
            &ldquo;{message.text}&rdquo;
          </Text>

          <Group justify="space-between" align="center">
            <Text
              size="xs"
              style={{
                color: isPinned ? '#d4a017' : '#94a3b8',
                fontStyle: 'italic',
              }}
            >
              &mdash; {message.author}
            </Text>
            <Group gap={6} align="center">
              {message.game && GAME_ICONS[message.game] && (
                <span title={message.game} style={{ fontSize: '12px', lineHeight: 1 }}>
                  {GAME_ICONS[message.game]}
                </span>
              )}
              <Text size="xs" style={{ color: isPinned ? '#b8860b' : '#64748b' }}>
                {formatMessageDate(message.timestamp)}
              </Text>
            </Group>
          </Group>
        </div>
      </motion.div>
    </div>
  );
}

function FloatingParticle({
  delay,
  duration,
  size,
  startX,
}: {
  delay: number;
  duration: number;
  size: number;
  startX: number;
}) {
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

// the guy who owns goonsite is so cool honestly one could even say they're the King of Goon, Came Too Soon

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
  const [page, setPage] = useState(0);
  const [selectedColor, setSelectedColor] = useState<MessageColor>('violet');
  const [particleData, setParticleData] = useState<
    { delay: number; duration: number; size: number; startX: number }[]
  >([]);
  const sceneRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1024px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const count = isMobile ? 6 : 15;
    setParticleData(
      Array.from({ length: count }, (_, i) => ({
        delay: i * 1.2,
        duration: 8 + Math.random() * 6,
        size: 2 + Math.random() * 3,
        startX: Math.random() * 100,
      }))
    );
  }, [isMobile]);

  useEffect(() => {
    fetch('/api/messages')
      .then((r) => r.json())
      .then((data) => {
        const real = data.messages || [];
        // In dev, pad with fake messages to test layout
        if (process.env.NODE_ENV === 'development' && real.length < 10) {
          setMessages([...real, ...DEV_MESSAGES]);
        } else {
          setMessages(real);
        }
      })
      .catch(() => {
        if (process.env.NODE_ENV === 'development') setMessages(DEV_MESSAGES);
      })
      .finally(() => setLoading(false));
  }, []);

  const lastMoveRef = useRef(0);
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const now = Date.now();
    if (now - lastMoveRef.current < 50) return;
    lastMoveRef.current = now;
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
        body: JSON.stringify({ text: text.trim(), author: author.trim(), game: selectedGame, color: selectedColor }),
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

  const cardsPerPage = 9; 

  const { pinned, descending } = useMemo(() => {
    if (messages.length === 0) return { pinned: null, descending: [] };
    const sorted = [...messages].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    return { pinned: sorted[0], descending: sorted.slice(1).reverse() };
  }, [messages]);

  const totalPages = messages.length === 0
    ? 0
    : 1 + Math.ceil(Math.max(0, descending.length - (cardsPerPage - 1)) / cardsPerPage);

  const displayMessages = useMemo(() => {
    if (messages.length === 0) return [];
    if (isMobile) {
      return pinned ? [pinned, ...descending] : descending;
    }
    if (page === 0) {
      const rest = descending.slice(0, cardsPerPage - 1);
      return pinned ? [pinned, ...rest] : rest;
    }
    const offset = cardsPerPage - 1 + (page - 1) * cardsPerPage;
    return descending.slice(offset, offset + cardsPerPage);
  }, [messages, pinned, descending, page, isMobile, cardsPerPage]);
  const boardHeight = isMobile ? 'auto' : `${Math.max(230, Math.ceil(displayMessages.length / 3) * 230 + 80)}px`;

  return (
    <>
      {particleData.map((particle, i) => (
        <FloatingParticle
          key={i}
          delay={particle.delay}
          duration={particle.duration}
          size={particle.size}
          startX={particle.startX}
        />
      ))}

      <div
        style={{
          minHeight: 'calc(100vh - 3.5rem)',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.08) 0%, #0f0f14 70%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ padding: '30px 20px 0', maxWidth: '900px', margin: '0 auto' }}>
          <Group justify="flex-end" align="center" mb="md">
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
            {!hasWon && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 1 }}
                style={{ marginTop: '10px' }}
              >
              <motion.div
                animate={{ y: [0, 4, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatType: 'loop', ease: 'easeInOut' }}
              >
                <Text
                  size="md"
                  fw={600}
                  style={{
                    cursor: 'pointer',
                    background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '0.02em',
                  }}
                  onClick={() => {
                    document.getElementById('game-challenge')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                >
                  ↓ Tap to scroll to bottom ↓
                </Text>
              </motion.div>
              </motion.div>
            )}
          </motion.div>
        </div>

        <div
          ref={sceneRef}
          onMouseMove={isMobile ? undefined : handleMouseMove}
          style={{
            perspective: isMobile ? 'none' : '1200px',
            perspectiveOrigin: '50% 30%',
            maxWidth: isMobile ? '100%' : '1100px',
            margin: '0 auto',
            padding: isMobile ? '0 16px 40px' : '0 20px',
            position: 'relative',
            zIndex: 10,
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
                {displayMessages.map((msg, i) => (
                  <MessageCard
                    key={msg.id}
                    message={msg}
                    index={i}
                    isHovered={hoveredIdx === i}
                    onMouseEnter={() => setHoveredIdx(i)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    isMobile={isMobile}
                    isPinned={pinned !== null && msg.id === pinned.id}
                  />
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
        {!isMobile && totalPages > 1 && (
          <Group justify="center" mt="xl" gap="xs" style={{ position: 'relative', zIndex: 1 }}>
            <Button
              variant="subtle"
              color="gray"
              size="xs"
              disabled={page === 0}
              onClick={() => { setPage(p => p - 1); setHoveredIdx(null); }}
            >
              &larr; Prev
            </Button>
            <Text size="xs" c="dimmed">
              {page + 1} / {totalPages}
            </Text>
            <Button
              variant="subtle"
              color="gray"
              size="xs"
              disabled={page >= totalPages - 1}
              onClick={() => { setPage(p => p + 1); setHoveredIdx(null); }}
            >
              Next &rarr;
            </Button>
          </Group>
        )}

        {/* Game Challenge */}
        {!hasWon && (
          <motion.div
            id="game-challenge"
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

                <Group justify="space-between" mb="sm">
                  <Text size="xs" c={wordCount > 150 ? 'red' : 'dimmed'}>
                    {wordCount}/150 words
                  </Text>
                  {wordCount > 150 && (
                    <Text size="xs" c="red">
                      Over the limit!
                    </Text>
                  )}
                </Group>

                <div style={{ marginBottom: '16px' }}>
                  <Text size="sm" fw={500} mb={6} style={{ color: '#c9d1d9' }}>
                    Card color
                  </Text>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {COLOR_KEYS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setSelectedColor(c)}
                        title={c}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          border: selectedColor === c
                            ? `2.5px solid ${COLOR_MAP[c].border}`
                            : '2px solid transparent',
                          background: COLOR_MAP[c].bg,
                          boxShadow: selectedColor === c
                            ? `0 0 10px ${COLOR_MAP[c].border}`
                            : 'none',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          position: 'relative',
                        }}
                      >
                        <span
                          style={{
                            position: 'absolute',
                            inset: '6px',
                            borderRadius: '50%',
                            background: `rgba(${COLOR_MAP[c].rgb}, 0.8)`,
                          }}
                        />
                      </button>
                    ))}
                  </div>
                </div>

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
    </>
  );
}
