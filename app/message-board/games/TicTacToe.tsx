'use client';

import { useState, useCallback } from 'react';
import { Text, Button, Group } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';

type Cell = 'X' | 'O' | null;
type GameStatus = 'playing' | 'won' | 'lost' | 'draw';

const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6],             // diagonals
];

function checkWinner(board: Cell[]): Cell | 'draw' | null {
  for (const [a, b, c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  if (board.every((c) => c !== null)) return 'draw';
  return null;
}

function getWinLine(board: Cell[]): number[] | null {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return line;
    }
  }
  return null;
}

/**
 * Stupid bot: picks a random empty cell.
 * Occasionally (30%) it'll block an obvious win, just so it's not *completely* braindead.
 */
function stupidBotMove(board: Cell[]): number {
  const empty = board.map((c, i) => (c === null ? i : -1)).filter((i) => i !== -1);
  if (empty.length === 0) return -1;

  // 30% chance: try to block player's winning move
  if (Math.random() < 0.3) {
    for (const [a, b, c] of WIN_LINES) {
      const cells = [board[a], board[b], board[c]];
      const xCount = cells.filter((v) => v === 'X').length;
      const nullCount = cells.filter((v) => v === null).length;
      if (xCount === 2 && nullCount === 1) {
        const blockIdx = [a, b, c].find((i) => board[i] === null);
        if (blockIdx !== undefined) return blockIdx;
      }
    }
  }

  return empty[Math.floor(Math.random() * empty.length)];
}

const CELL_COLORS = {
  X: '#7c3aed',
  O: '#ec4899',
};

function CellContent({ value }: { value: Cell }) {
  if (!value) return null;

  if (value === 'X') {
    return (
      <motion.svg
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        viewBox="0 0 50 50"
        style={{ width: '60%', height: '60%' }}
      >
        <motion.line
          x1="10" y1="10" x2="40" y2="40"
          stroke={CELL_COLORS.X}
          strokeWidth="4"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3 }}
        />
        <motion.line
          x1="40" y1="10" x2="10" y2="40"
          stroke={CELL_COLORS.X}
          strokeWidth="4"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        />
      </motion.svg>
    );
  }

  return (
    <motion.svg
      viewBox="0 0 50 50"
      style={{ width: '60%', height: '60%' }}
    >
      <motion.circle
        cx="25" cy="25" r="15"
        fill="none"
        stroke={CELL_COLORS.O}
        strokeWidth="4"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4 }}
      />
    </motion.svg>
  );
}

const BOT_TAUNTS = {
  thinking: [
    'Hmm... let me think...',
    '*scratches head*',
    'Uhhh...',
    'Wait, how does this game work again?',
    'I meant to do that.',
    'Strategic genius at work...',
  ],
  lost: [
    'Impossible! I demand a recount!',
    'You clearly cheated. But fine, leave your message.',
    'My cat could have beaten you. You got lucky.',
    'I... I let you win. Obviously.',
    'Fine. You earned it. Go write your dumb message.',
    'GG I guess... *flips table*',
  ],
  won: [
    'Ha! Better luck next time, human.',
    'Too easy. Try again?',
    'I am the greatest tic-tac-toe AI of all time.',
    'You lost to a bot that plays randomly. Let that sink in.',
    'Skill diff.',
  ],
  draw: [
    'A draw? How boring. Let\'s go again.',
    'Neither of us wins. Perfectly balanced.',
    'We\'re evenly matched... somehow.',
    'The only winning move is not to play. But you have to, so try again.',
  ],
};

function randomTaunt(category: keyof typeof BOT_TAUNTS): string {
  const list = BOT_TAUNTS[category];
  return list[Math.floor(Math.random() * list.length)];
}

export default function TicTacToe({ onWin }: { onWin: () => void }) {
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [status, setStatus] = useState<GameStatus>('playing');
  const [winLine, setWinLine] = useState<number[] | null>(null);
  const [botThinking, setBotThinking] = useState(false);
  const [taunt, setTaunt] = useState('Beat me at tic-tac-toe and you can leave a message.');

  const reset = useCallback(() => {
    setBoard(Array(9).fill(null));
    setStatus('playing');
    setWinLine(null);
    setBotThinking(false);
    setTaunt('Beat me at tic-tac-toe and you can leave a message.');
  }, []);

  const handleClick = useCallback((idx: number) => {
    if (board[idx] || status !== 'playing' || botThinking) return;

    const next = [...board];
    next[idx] = 'X';

    const result = checkWinner(next);
    if (result === 'X') {
      setBoard(next);
      setWinLine(getWinLine(next));
      setStatus('won');
      setTaunt(randomTaunt('lost'));
      setTimeout(onWin, 800);
      return;
    }
    if (result === 'draw') {
      setBoard(next);
      setStatus('draw');
      setTaunt(randomTaunt('draw'));
      return;
    }

    setBoard(next);
    setBotThinking(true);
    setTaunt(randomTaunt('thinking'));

    // Bot "thinks" for a moment
    setTimeout(() => {
      const botIdx = stupidBotMove(next);
      if (botIdx === -1) {
        setBotThinking(false);
        return;
      }
      next[botIdx] = 'O';
      setBoard([...next]);
      setBotThinking(false);

      const botResult = checkWinner(next);
      if (botResult === 'O') {
        setWinLine(getWinLine(next));
        setStatus('lost');
        setTaunt(randomTaunt('won'));
      } else if (botResult === 'draw') {
        setStatus('draw');
        setTaunt(randomTaunt('draw'));
      } else {
        setTaunt('Your turn.');
      }
    }, 400 + Math.random() * 400);
  }, [board, status, botThinking, onWin]);

  const gameOver = status !== 'playing';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
      {/* Bot speech bubble */}
      <AnimatePresence mode="wait">
        <motion.div
          key={taunt}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.25 }}
          style={{
            background: 'rgba(124, 58, 237, 0.1)',
            border: '1px solid rgba(124, 58, 237, 0.3)',
            borderRadius: '12px',
            padding: '10px 18px',
            maxWidth: '320px',
            textAlign: 'center',
          }}
        >
          <Text size="sm" style={{ color: '#c4b5fd' }}>
            {botThinking ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                {taunt}
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  ...
                </motion.span>
              </span>
            ) : (
              taunt
            )}
          </Text>
        </motion.div>
      </AnimatePresence>

      {/* Board */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '6px',
          width: '240px',
        }}
      >
        {board.map((cell, i) => {
          const isWinCell = winLine?.includes(i);
          return (
            <motion.button
              key={i}
              onClick={() => handleClick(i)}
              whileHover={!cell && status === 'playing' && !botThinking ? { scale: 1.05 } : {}}
              whileTap={!cell && status === 'playing' && !botThinking ? { scale: 0.95 } : {}}
              style={{
                width: '100%',
                aspectRatio: '1',
                background: isWinCell
                  ? 'rgba(124, 58, 237, 0.2)'
                  : 'rgba(30, 30, 40, 0.8)',
                border: isWinCell
                  ? '2px solid rgba(124, 58, 237, 0.6)'
                  : '1px solid rgba(60, 60, 80, 0.5)',
                borderRadius: '10px',
                cursor: !cell && status === 'playing' && !botThinking ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s, border 0.2s',
              }}
            >
              <CellContent value={cell} />
            </motion.button>
          );
        })}
      </div>

      {/* Status & actions */}
      {gameOver && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}
        >
          {status === 'won' && (
            <Text size="sm" fw={600} style={{ color: '#4ade80' }}>
              You won!
            </Text>
          )}
          {status === 'lost' && (
            <Text size="sm" fw={600} style={{ color: '#f87171' }}>
              You lost. Try again!
            </Text>
          )}
          {status === 'draw' && (
            <Text size="sm" fw={600} style={{ color: '#fbbf24' }}>
              It&apos;s a draw. Try again!
            </Text>
          )}
          {status !== 'won' && (
            <Button
              variant="light"
              color="violet"
              size="sm"
              leftSection={<IconRefresh size={14} />}
              onClick={reset}
            >
              Rematch
            </Button>
          )}
        </motion.div>
      )}
    </div>
  );
}
