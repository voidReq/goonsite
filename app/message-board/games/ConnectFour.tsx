'use client';

import { useState, useCallback } from 'react';
import { Text, Button, Group } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';

const ROWS = 6;
const COLS = 7;

type Player = 'red' | 'yellow';
type Cell = Player | null;
type Board = Cell[][];
type GameStatus = 'playing' | 'won' | 'lost' | 'draw';

function createEmptyBoard(): Board {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function getLowestEmptyRow(board: Board, col: number): number {
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row][col] === null) return row;
  }
  return -1;
}

function getAvailableColumns(board: Board): number[] {
  const cols: number[] = [];
  for (let c = 0; c < COLS; c++) {
    if (board[0][c] === null) cols.push(c);
  }
  return cols;
}

type WinResult = { winner: Player; cells: [number, number][] } | null;

function checkWinner(board: Board): WinResult {
  const directions: [number, number][] = [
    [0, 1],  // horizontal
    [1, 0],  // vertical
    [1, 1],  // diagonal down-right
    [1, -1], // diagonal down-left
  ];

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const cell = board[row][col];
      if (!cell) continue;

      for (const [dr, dc] of directions) {
        const cells: [number, number][] = [[row, col]];
        let valid = true;

        for (let i = 1; i < 4; i++) {
          const nr = row + dr * i;
          const nc = col + dc * i;
          if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || board[nr][nc] !== cell) {
            valid = false;
            break;
          }
          cells.push([nr, nc]);
        }

        if (valid) {
          return { winner: cell, cells };
        }
      }
    }
  }

  return null;
}

function isBoardFull(board: Board): boolean {
  return board[0].every((cell) => cell !== null);
}

/**
 * Counts how many of a player's pieces are in a run of 4, checking if a
 * specific column drop could block/complete a 3-in-a-row.
 */
function findBlockingColumn(board: Board, player: Player): number | null {
  const available = getAvailableColumns(board);

  for (const col of available) {
    const row = getLowestEmptyRow(board, col);
    if (row === -1) continue;

    // Temporarily place the piece
    board[row][col] = player;
    const result = checkWinner(board);
    board[row][col] = null;

    if (result && result.winner === player) {
      return col;
    }
  }

  return null;
}

/**
 * Stupid bot: picks a random non-full column.
 * 25% chance it'll block a player's 3-in-a-row.
 */
function stupidBotMove(board: Board): number {
  const available = getAvailableColumns(board);
  if (available.length === 0) return -1;

  // 25% chance: try to block player's winning move
  if (Math.random() < 0.25) {
    const blockCol = findBlockingColumn(board, 'red');
    if (blockCol !== null) return blockCol;
  }

  return available[Math.floor(Math.random() * available.length)];
}

const PIECE_COLORS: Record<Player, string> = {
  red: '#ef4444',
  yellow: '#eab308',
};

const PIECE_GLOW: Record<Player, string> = {
  red: '0 0 10px rgba(239, 68, 68, 0.6)',
  yellow: '0 0 10px rgba(234, 179, 8, 0.6)',
};

const PIECE_GLOW_BRIGHT: Record<Player, string> = {
  red: '0 0 18px rgba(239, 68, 68, 0.9), 0 0 6px rgba(239, 68, 68, 0.6)',
  yellow: '0 0 18px rgba(234, 179, 8, 0.9), 0 0 6px rgba(234, 179, 8, 0.6)',
};

const BOT_TAUNTS = {
  thinking: [
    'Hmm... let me think...',
    '*drops piece randomly*',
    'I totally planned this.',
    'Wait, which color am I again?',
    'Strategic genius at work...',
  ],
  lost: [
    'Impossible! I demand a recount!',
    'You clearly cheated. But fine, leave your message.',
    'I... I let you win. Obviously.',
    'Fine. You earned it. Go write your dumb message.',
    'GG I guess... *flips the board*',
  ],
  won: [
    'Ha! Better luck next time, human.',
    'Too easy. Connect Four? More like Connect Bore.',
    'I am the greatest Connect Four AI of all time.',
    'You lost to a bot that plays randomly. Let that sink in.',
    'Skill diff. Massive skill diff.',
  ],
  draw: [
    'A draw? How boring. Let\'s go again.',
    'Neither of us wins. The board is full of sadness.',
    'We\'re evenly matched... somehow.',
    'All those pieces and nothing to show for it. Again?',
  ],
};

function randomTaunt(category: keyof typeof BOT_TAUNTS): string {
  const list = BOT_TAUNTS[category];
  return list[Math.floor(Math.random() * list.length)];
}

interface ConnectFourProps {
  onWin: () => void;
}

export default function ConnectFour({ onWin }: ConnectFourProps) {
  const [board, setBoard] = useState<Board>(createEmptyBoard);
  const [status, setStatus] = useState<GameStatus>('playing');
  const [winCells, setWinCells] = useState<Set<string>>(new Set());
  const [botThinking, setBotThinking] = useState(false);
  const [taunt, setTaunt] = useState('Beat me at Connect Four and you can leave a message.');
  const [hoverCol, setHoverCol] = useState<number | null>(null);

  const reset = useCallback(() => {
    setBoard(createEmptyBoard());
    setStatus('playing');
    setWinCells(new Set());
    setBotThinking(false);
    setTaunt('Beat me at Connect Four and you can leave a message.');
    setHoverCol(null);
  }, []);

  const handleColumnClick = useCallback((col: number) => {
    if (status !== 'playing' || botThinking) return;

    const row = getLowestEmptyRow(board, col);
    if (row === -1) return;

    const next = board.map((r) => [...r]);
    next[row][col] = 'red';

    // Check if player won
    const result = checkWinner(next);
    if (result && result.winner === 'red') {
      const cellSet = new Set(result.cells.map(([r, c]) => `${r},${c}`));
      setBoard(next);
      setWinCells(cellSet);
      setStatus('won');
      setTaunt(randomTaunt('lost'));
      setTimeout(onWin, 800);
      return;
    }

    // Check for draw
    if (isBoardFull(next)) {
      setBoard(next);
      setStatus('draw');
      setTaunt(randomTaunt('draw'));
      return;
    }

    setBoard(next);
    setBotThinking(true);
    setTaunt(randomTaunt('thinking'));

    // Bot "thinks" for 300-600ms
    setTimeout(() => {
      const botCol = stupidBotMove(next);
      if (botCol === -1) {
        setBotThinking(false);
        return;
      }

      const botRow = getLowestEmptyRow(next, botCol);
      if (botRow === -1) {
        setBotThinking(false);
        return;
      }

      next[botRow][botCol] = 'yellow';
      setBoard(next.map((r) => [...r]));
      setBotThinking(false);

      const botResult = checkWinner(next);
      if (botResult && botResult.winner === 'yellow') {
        const cellSet = new Set(botResult.cells.map(([r, c]) => `${r},${c}`));
        setWinCells(cellSet);
        setStatus('lost');
        setTaunt(randomTaunt('won'));
      } else if (isBoardFull(next)) {
        setStatus('draw');
        setTaunt(randomTaunt('draw'));
      } else {
        setTaunt('Your turn.');
      }
    }, 300 + Math.random() * 300);
  }, [board, status, botThinking, onWin]);

  const handleMouseEnter = useCallback((col: number) => {
    if (status === 'playing' && !botThinking) {
      setHoverCol(col);
    }
  }, [status, botThinking]);

  const handleMouseLeave = useCallback(() => {
    setHoverCol(null);
  }, []);

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
            background: 'rgba(30, 27, 75, 0.4)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '12px',
            padding: '10px 18px',
            maxWidth: '320px',
            textAlign: 'center',
          }}
        >
          <Text size="sm" style={{ color: '#a5b4fc' }}>
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
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gap: '4px',
          width: 'min(100%, 350px)',
          background: '#1e1b4b',
          borderRadius: '12px',
          padding: '8px',
        }}
      >
        {board.map((row, rowIdx) =>
          row.map((cell, colIdx) => {
            const isWinCell = winCells.has(`${rowIdx},${colIdx}`);
            const isHoverPreview =
              hoverCol === colIdx &&
              !cell &&
              !botThinking &&
              status === 'playing' &&
              rowIdx === getLowestEmptyRow(board, colIdx);

            return (
              <div
                key={`${rowIdx}-${colIdx}`}
                onClick={() => handleColumnClick(colIdx)}
                onMouseEnter={() => handleMouseEnter(colIdx)}
                onMouseLeave={handleMouseLeave}
                style={{
                  aspectRatio: '1',
                  background: 'rgba(15, 12, 50, 0.8)',
                  borderRadius: '50%',
                  border: '1px solid rgba(60, 60, 100, 0.4)',
                  cursor: !cell && status === 'playing' && !botThinking ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Hover preview */}
                {isHoverPreview && (
                  <div
                    style={{
                      width: '80%',
                      height: '80%',
                      borderRadius: '50%',
                      background: PIECE_COLORS.red,
                      opacity: 0.25,
                    }}
                  />
                )}

                {/* Placed piece */}
                {cell && (
                  <motion.div
                    initial={{ y: -200 }}
                    animate={{
                      y: 0,
                      boxShadow: isWinCell
                        ? [
                            PIECE_GLOW_BRIGHT[cell],
                            PIECE_GLOW[cell],
                            PIECE_GLOW_BRIGHT[cell],
                          ]
                        : PIECE_GLOW[cell],
                    }}
                    transition={
                      isWinCell
                        ? {
                            y: { type: 'spring', stiffness: 300, damping: 20 },
                            boxShadow: { duration: 0.8, repeat: Infinity, ease: 'easeInOut' },
                          }
                        : {
                            type: 'spring',
                            stiffness: 300,
                            damping: 20,
                          }
                    }
                    style={{
                      width: '80%',
                      height: '80%',
                      borderRadius: '50%',
                      background: PIECE_COLORS[cell],
                      boxShadow: isWinCell ? PIECE_GLOW_BRIGHT[cell] : PIECE_GLOW[cell],
                    }}
                  />
                )}
              </div>
            );
          })
        )}
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
              You won! Form unlocked below.
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
            <Group justify="center">
              <Button
                variant="light"
                color="indigo"
                size="sm"
                leftSection={<IconRefresh size={14} />}
                onClick={reset}
              >
                Rematch
              </Button>
            </Group>
          )}
        </motion.div>
      )}
    </div>
  );
}
