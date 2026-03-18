'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Text, Button, Group } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Chess, Square, Move } from 'chess.js';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChessProps {
  onWin: () => void;
}

type GameStatus = 'playing' | 'won' | 'lost' | 'draw' | 'check';

// ─── Piece rendering ─────────────────────────────────────────────────────────

// Use filled (black) unicode pieces for both sides — style with color + stroke
const PIECE_UNICODE: Record<string, Record<string, string>> = {
  w: { k: '\u265A', q: '\u265B', r: '\u265C', b: '\u265D', n: '\u265E', p: '\u265F' },
  b: { k: '\u265A', q: '\u265B', r: '\u265C', b: '\u265D', n: '\u265E', p: '\u265F' },
};

// ─── Bot taunts ──────────────────────────────────────────────────────────────

const BOT_TAUNTS = {
  thinking: [
    'Don\'t annoy me before I hack you',
    'I learned chess yesterday, bear with me...',
    'Is the horsie the one that goes in an L?',
    'Let me consult my chess book... oh wait, I ate it.',
    'I\'m calculating 0.5 moves ahead...',
  ],
  lost: [
    'You beat a bot that barely knows how the horsie moves.',
    'I demand a rematch... in checkers.',
    'My GPU was lagging, doesn\'t count.',
    'Fine, you win. Go leave your message.',
    'GG... I blame my training data.',
  ],
  won: [
    'Checkmate! ...wait, did I actually just do that?',
    'I won?! I literally pick random moves!',
    'Even a broken clock is right twice a day.',
    'Skill diff. (I have no skill, so what does that say?)',
    'Ha! The random number gods smiled upon me.',
  ],
  check: [
    'Oh no, is that check?',
    'Rude.',
    'Hey! Watch it with that!',
    'My king is feeling very attacked right now.',
    'That\'s not very nice.',
  ],
};

function randomTaunt(category: keyof typeof BOT_TAUNTS): string {
  const list = BOT_TAUNTS[category];
  return list[Math.floor(Math.random() * list.length)];
}

// ─── Coordinate helpers ──────────────────────────────────────────────────────

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

function squareToCoords(sq: Square): { row: number; col: number } {
  const col = sq.charCodeAt(0) - 97; // 'a' = 0
  const row = 8 - parseInt(sq[1]);    // '8' = 0, '1' = 7
  return { row, col };
}

function coordsToSquare(row: number, col: number): Square {
  return `${FILES[col]}${RANKS[row]}` as Square;
}

function isLightSquare(row: number, col: number): boolean {
  return (row + col) % 2 === 0;
}

// ─── Captured pieces ─────────────────────────────────────────────────────────

const PIECE_VALUES: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

function getCapturedPieces(game: Chess): { white: string[]; black: string[] } {
  const starting: Record<string, number> = { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 };
  const current = { w: { ...starting }, b: { ...starting } };

  const board = game.board();
  for (const row of board) {
    for (const cell of row) {
      if (cell) {
        current[cell.color][cell.type]--;
      }
    }
  }

  // White captured = black pieces missing from board
  const whiteCaptured: string[] = [];
  const blackCaptured: string[] = [];

  for (const piece of ['q', 'r', 'b', 'n', 'p'] as const) {
    for (let i = 0; i < current.b[piece]; i++) whiteCaptured.push(PIECE_UNICODE.b[piece]);
    for (let i = 0; i < current.w[piece]; i++) blackCaptured.push(PIECE_UNICODE.w[piece]);
  }

  return { white: whiteCaptured, black: blackCaptured };
}

// ─── Stupid bot logic ────────────────────────────────────────────────────────

/**
 * Check if a square is attacked by the opponent after a move.
 */
function isSquareAttacked(game: Chess, square: Square, byColor: 'w' | 'b'): boolean {
  return game.isAttacked(square, byColor);
}

/**
 * Basic exchange evaluation for a capture move:
 * gain = value of captured piece - (value of attacker if recaptured)
 * Returns the material gain (negative = bad trade).
 */
function evaluateCapture(game: Chess, move: Move): number {
  const capturedValue = move.captured ? PIECE_VALUES[move.captured] : 0;
  const attackerValue = PIECE_VALUES[move.piece];

  // Make the move, check if the destination is attacked by opponent
  const testGame = new Chess(game.fen());
  testGame.move({ from: move.from, to: move.to, promotion: move.promotion || undefined });

  // If the piece we just moved to can be recaptured, we lose our piece
  const opponentColor = move.color === 'w' ? 'b' : 'w';
  if (isSquareAttacked(testGame, move.to as Square, opponentColor)) {
    return capturedValue - attackerValue;
  }

  return capturedValue;
}

/**
 * Check if moving a piece to a square would hang it (no capture, just moving to an attacked square).
 */
function wouldHangPiece(game: Chess, move: Move): boolean {
  const testGame = new Chess(game.fen());
  testGame.move({ from: move.from, to: move.to, promotion: move.promotion || undefined });

  const opponentColor = move.color === 'w' ? 'b' : 'w';
  if (isSquareAttacked(testGame, move.to as Square, opponentColor)) {
    // Check if the square is also defended
    const myColor = move.color;
    if (isSquareAttacked(testGame, move.to as Square, myColor)) {
      // Defended, but is the piece more valuable than what would recapture?
      // Simplified: hanging if piece is worth more than a pawn
      return PIECE_VALUES[move.piece] > 1;
    }
    return true;
  }
  return false;
}

function stupidBotMove(game: Chess): Move | null {
  const moves = game.moves({ verbose: true });
  if (moves.length === 0) return null;

  // Separate captures from quiet moves
  const captures = moves.filter((m) => m.captured);
  const quietMoves = moves.filter((m) => !m.captured);

  // Find good captures (positive or neutral exchanges)
  const goodCaptures = captures.filter((m) => evaluateCapture(game, m) >= 0);

  // 50% chance: take a good capture if available
  if (goodCaptures.length > 0 && Math.random() < 0.5) {
    // Prefer higher-value captures
    goodCaptures.sort((a, b) => evaluateCapture(game, b) - evaluateCapture(game, a));
    // Pick from the top captures (some randomness — pick from top 2)
    const pick = Math.min(Math.floor(Math.random() * 2), goodCaptures.length - 1);
    return goodCaptures[pick];
  }

  // Filter out moves that hang pieces (60% of the time — still stupid sometimes)
  if (Math.random() < 0.6) {
    const safeMoves = quietMoves.filter((m) => !wouldHangPiece(game, m));
    if (safeMoves.length > 0) {
      return safeMoves[Math.floor(Math.random() * safeMoves.length)];
    }
  }

  // Fallback: random move
  return moves[Math.floor(Math.random() * moves.length)];
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Chess_Game({ onWin }: ChessProps) {
  const [game, setGame] = useState(() => new Chess());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [botThinking, setBotThinking] = useState(false);
  const [taunt, setTaunt] = useState('Beat me at chess and you can leave a message.');
  const [winCalled, setWinCalled] = useState(false);
  const [animatingMove, setAnimatingMove] = useState<{
    from: { row: number; col: number };
    to: { row: number; col: number };
    piece: string;
    color: string;
  } | null>(null);

  const boardRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef(game);
  gameRef.current = game;

  // ─── Derived state ──────────────────────────────────────────────────────

  const gameStatus: GameStatus = useMemo(() => {
    if (game.isCheckmate()) {
      return game.turn() === 'b' ? 'won' : 'lost';
    }
    if (game.isStalemate() || game.isDraw()) return 'draw';
    if (game.inCheck()) return 'check';
    return 'playing';
  }, [game]);

  const legalMoves = useMemo(() => {
    if (!selectedSquare) return [];
    return game.moves({ square: selectedSquare, verbose: true });
  }, [game, selectedSquare]);

  const legalMoveSquares = useMemo(() => {
    return new Set(legalMoves.map((m) => m.to));
  }, [legalMoves]);

  const captureMoveSquares = useMemo(() => {
    return new Set(legalMoves.filter((m) => m.captured).map((m) => m.to));
  }, [legalMoves]);

  const captured = useMemo(() => getCapturedPieces(game), [game]);

  const isGameOver = gameStatus === 'won' || gameStatus === 'lost' || gameStatus === 'draw';

  // ─── Win callback ───────────────────────────────────────────────────────

  useEffect(() => {
    if (gameStatus === 'won' && !winCalled) {
      setWinCalled(true);
      setTaunt(randomTaunt('lost'));
      const timer = setTimeout(() => onWin(), 800);
      return () => clearTimeout(timer);
    }
    if (gameStatus === 'lost') {
      setTaunt(randomTaunt('won'));
    }
    if (gameStatus === 'draw') {
      setTaunt('Stalemate... I\'ll take it.');
    }
  }, [gameStatus, winCalled, onWin]);

  // ─── Make a move (with animation) ──────────────────────────────────────

  const executeMoveRef = useRef<(from: Square, to: Square, isBot: boolean) => void>(null);

  const executeMove = useCallback(
    (from: Square, to: Square, isBot: boolean) => {
      const currentGame = gameRef.current;
      const fromCoords = squareToCoords(from);
      const toCoords = squareToCoords(to);
      const currentBoard = currentGame.board();
      const piece = currentBoard[fromCoords.row][fromCoords.col];
      if (!piece) return;

      setAnimatingMove({
        from: fromCoords,
        to: toCoords,
        piece: PIECE_UNICODE[piece.color][piece.type],
        color: piece.color,
      });

      setTimeout(() => {
        const newGame = new Chess(gameRef.current.fen());
        try {
          newGame.move({ from, to, promotion: 'q' });
        } catch {
          setAnimatingMove(null);
          return;
        }

        setGame(newGame);
        gameRef.current = newGame;
        setLastMove({ from, to });
        setSelectedSquare(null);
        setAnimatingMove(null);

        if (!isBot) {
          // Check game state after player move
          if (newGame.isCheckmate() || newGame.isStalemate() || newGame.isDraw()) {
            return;
          }

          if (newGame.inCheck()) {
            setTaunt(randomTaunt('check'));
          }

          // Bot's turn
          setBotThinking(true);
          if (!newGame.inCheck()) {
            setTaunt(randomTaunt('thinking'));
          }

          const delay = 400 + Math.random() * 400;
          setTimeout(() => {
            const botMove = stupidBotMove(newGame);
            if (!botMove) {
              setBotThinking(false);
              return;
            }
            setBotThinking(false);
            executeMoveRef.current?.(botMove.from as Square, botMove.to as Square, true);
          }, delay);
        } else {
          // After bot move
          if (newGame.inCheck() && !newGame.isCheckmate()) {
            setTaunt(randomTaunt('check'));
          }
        }
      }, 200);
    },
    [],
  );

  executeMoveRef.current = executeMove;

  // ─── Click handler ─────────────────────────────────────────────────────

  const handleSquareClick = useCallback(
    (row: number, col: number) => {
      if (isGameOver || botThinking || animatingMove) return;
      if (game.turn() !== 'w') return;

      const sq = coordsToSquare(row, col);
      const board = game.board();
      const piece = board[row][col];

      // If a square is selected and we click a legal move target
      if (selectedSquare && legalMoveSquares.has(sq)) {
        executeMove(selectedSquare, sq, false);
        return;
      }

      // If we click our own piece, select it
      if (piece && piece.color === 'w') {
        setSelectedSquare(selectedSquare === sq ? null : sq);
        return;
      }

      // Otherwise deselect
      setSelectedSquare(null);
    },
    [isGameOver, botThinking, animatingMove, game, selectedSquare, legalMoveSquares, executeMove],
  );

  // ─── Reset ─────────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    const fresh = new Chess();
    setGame(fresh);
    gameRef.current = fresh;
    setSelectedSquare(null);
    setLastMove(null);
    setBotThinking(false);
    setAnimatingMove(null);
    setWinCalled(false);
    setTaunt('Beat me at chess and you can leave a message.');
  }, []);

  // ─── Render ─────────────────────────────────────────────────────────────

  const board = game.board();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
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
            maxWidth: '340px',
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

      {/* Check badge */}
      {gameStatus === 'check' && !isGameOver && (
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <Text
            size="sm"
            fw={700}
            style={{
              color: '#fff',
              background: '#ef4444',
              borderRadius: '6px',
              padding: '2px 10px',
            }}
          >
            Check!
          </Text>
        </motion.div>
      )}

      {/* Black captured pieces (pieces white has captured) */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '2px',
          minHeight: '20px',
          justifyContent: 'center',
          maxWidth: 'min(100%, 340px)',
        }}
      >
        {captured.white.map((p, i) => (
          <span key={i} style={{ fontSize: '16px', lineHeight: 1 }}>
            {p}
          </span>
        ))}
      </div>

      {/* Board */}
      <div
        ref={boardRef}
        style={{
          position: 'relative',
          width: 'min(100%, 340px)',
          borderRadius: '6px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          overflow: 'hidden',
        }}
      >
        {/* Coordinate labels - ranks (left side) */}
        <div
          style={{
            position: 'absolute',
            left: '2px',
            top: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        >
          {RANKS.map((rank, i) => (
            <div
              key={rank}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'flex-start',
                paddingTop: '1px',
              }}
            >
              <span
                style={{
                  fontSize: '10px',
                  color: isLightSquare(i, 0) ? '#9e8a6f' : '#c8b899',
                  fontWeight: 600,
                  lineHeight: 1,
                }}
              >
                {rank}
              </span>
            </div>
          ))}
        </div>

        {/* Board grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(8, 1fr)',
            aspectRatio: '1',
          }}
        >
          {RANKS.map((_, row) =>
            FILES.map((_, col) => {
              const sq = coordsToSquare(row, col);
              const piece = board[row][col];
              const isLight = isLightSquare(row, col);
              const isSelected = selectedSquare === sq;
              const isLegalTarget = legalMoveSquares.has(sq);
              const isCapture = captureMoveSquares.has(sq);
              const isLastMoveSquare = lastMove && (lastMove.from === sq || lastMove.to === sq);
              const isAnimatingFrom =
                animatingMove &&
                animatingMove.from.row === row &&
                animatingMove.from.col === col;

              const bgColor = isSelected
                ? 'rgba(124, 58, 237, 0.5)'
                : isLastMoveSquare
                  ? isLight
                    ? '#e8d44d'
                    : '#daa520'
                  : isLight
                    ? '#f0d9b5'
                    : '#b58863';

              return (
                <div
                  key={sq}
                  onClick={() => handleSquareClick(row, col)}
                  style={{
                    position: 'relative',
                    aspectRatio: '1',
                    background: bgColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor:
                      isGameOver || botThinking
                        ? 'default'
                        : isLegalTarget || (piece && piece.color === 'w')
                          ? 'pointer'
                          : 'default',
                    userSelect: 'none',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {/* Selected pulse overlay */}
                  {isSelected && (
                    <motion.div
                      animate={{ opacity: [0.3, 0.15, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(124, 58, 237, 0.3)',
                        pointerEvents: 'none',
                      }}
                    />
                  )}

                  {/* Legal move dot */}
                  {isLegalTarget && !isCapture && (
                    <div
                      style={{
                        position: 'absolute',
                        width: '28%',
                        height: '28%',
                        minWidth: '12px',
                        minHeight: '12px',
                        borderRadius: '50%',
                        background: 'rgba(0, 0, 0, 0.2)',
                        pointerEvents: 'none',
                        zIndex: 1,
                      }}
                    />
                  )}

                  {/* Capture ring */}
                  {isCapture && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: '4%',
                        borderRadius: '50%',
                        border: '3px solid rgba(0, 0, 0, 0.2)',
                        pointerEvents: 'none',
                        zIndex: 1,
                      }}
                    />
                  )}

                  {/* Piece */}
                  {piece && !isAnimatingFrom && (
                    <span
                      style={{
                        fontSize: 'clamp(20px, 4.5vw, 36px)',
                        lineHeight: 1,
                        color: piece.color === 'w' ? '#fff' : '#222',
                        textShadow:
                          piece.color === 'w'
                            ? '0 0 4px rgba(0,0,0,0.8), 0 1px 2px rgba(0,0,0,0.6)'
                            : '0 0 4px rgba(255,255,255,0.5), 0 1px 2px rgba(0,0,0,0.3)',
                        WebkitTextStroke: piece.color === 'w' ? '0.5px rgba(0,0,0,0.3)' : '0.5px rgba(255,255,255,0.4)',
                        pointerEvents: 'none',
                        zIndex: 1,
                      }}
                    >
                      {PIECE_UNICODE[piece.color][piece.type]}
                    </span>
                  )}
                </div>
              );
            }),
          )}
        </div>

        {/* Coordinate labels - files (bottom) */}
        <div
          style={{
            position: 'absolute',
            bottom: '1px',
            left: 0,
            right: 0,
            display: 'flex',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        >
          {FILES.map((file, i) => (
            <div
              key={file}
              style={{
                flex: 1,
                display: 'flex',
                justifyContent: 'flex-end',
                paddingRight: '2px',
              }}
            >
              <span
                style={{
                  fontSize: '10px',
                  color: isLightSquare(7, i) ? '#9e8a6f' : '#c8b899',
                  fontWeight: 600,
                  lineHeight: 1,
                }}
              >
                {file}
              </span>
            </div>
          ))}
        </div>

        {/* Animating piece overlay */}
        {animatingMove && (
          <motion.div
            initial={{
              position: 'absolute',
              left: `${(animatingMove.from.col / 8) * 100}%`,
              top: `${(animatingMove.from.row / 8) * 100}%`,
              width: '12.5%',
              height: '12.5%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              pointerEvents: 'none' as const,
            }}
            animate={{
              left: `${(animatingMove.to.col / 8) * 100}%`,
              top: `${(animatingMove.to.row / 8) * 100}%`,
            }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <span
              style={{
                fontSize: 'clamp(20px, 4.5vw, 36px)',
                lineHeight: 1,
                color: animatingMove.color === 'w' ? '#fff' : '#222',
                textShadow:
                  animatingMove.color === 'w'
                    ? '0 0 4px rgba(0,0,0,0.8), 0 1px 2px rgba(0,0,0,0.6)'
                    : '0 0 4px rgba(255,255,255,0.5), 0 1px 2px rgba(0,0,0,0.3)',
                WebkitTextStroke: animatingMove.color === 'w' ? '0.5px rgba(0,0,0,0.3)' : '0.5px rgba(255,255,255,0.4)',
              }}
            >
              {animatingMove.piece}
            </span>
          </motion.div>
        )}
      </div>

      {/* White captured pieces (pieces black has captured) */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '2px',
          minHeight: '20px',
          justifyContent: 'center',
          maxWidth: 'min(100%, 340px)',
        }}
      >
        {captured.black.map((p, i) => (
          <span key={i} style={{ fontSize: '16px', lineHeight: 1 }}>
            {p}
          </span>
        ))}
      </div>

      {/* Game over status */}
      {isGameOver && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}
        >
          {gameStatus === 'won' && (
            <>
              <Text size="sm" fw={600} style={{ color: '#4ade80' }}>
                Checkmate! You won!
              </Text>
              <Text size="xs" style={{ color: '#4ade80', opacity: 0.8 }}>
                Form unlocked below.
              </Text>
            </>
          )}
          {gameStatus === 'lost' && (
            <Text size="sm" fw={600} style={{ color: '#f87171' }}>
              Checkmate! You lost!
            </Text>
          )}
          {gameStatus === 'draw' && (
            <Text size="sm" fw={600} style={{ color: '#fbbf24' }}>
              Stalemate! It&apos;s a draw.
            </Text>
          )}

          <Button
            variant="light"
            color="violet"
            size="sm"
            leftSection={<IconRefresh size={14} />}
            onClick={reset}
          >
            Rematch
          </Button>
        </motion.div>
      )}
    </div>
  );
}
