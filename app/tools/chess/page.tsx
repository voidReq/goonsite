"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  Text,
  Paper,
  Button,
  Group,
  Stack,
  SegmentedControl,
  Badge,
  Alert,
  Divider,
  Title,
  Tooltip,
  Progress,
  TextInput,
} from "@mantine/core";
import { Chess, Square, Move } from "chess.js";
import { motion } from "framer-motion";
import PageShell from "../../components/ui/PageShell";
import { useStockfish } from "./useStockfish";
import {
  IconUpload,
  IconChess,
  IconAlertTriangle,
  IconTrash,
  IconPlayerPlay,
  IconLock,
} from "@tabler/icons-react";

// ─── Board constants ─────────────────────────────────────────────────────────

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"];

const PIECE_UNICODE: Record<string, Record<string, string>> = {
  w: { k: "\u2654", q: "\u2655", r: "\u2656", b: "\u2657", n: "\u2658", p: "\u2659" },
  b: { k: "\u2654", q: "\u2655", r: "\u2656", b: "\u2657", n: "\u2658", p: "\u2659" },
};

const PIECE_VALUES: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

function squareToCoords(sq: Square): { row: number; col: number } {
  return { col: sq.charCodeAt(0) - 97, row: 8 - parseInt(sq[1]) };
}

function coordsToSquare(row: number, col: number): Square {
  return `${FILES[col]}${RANKS[row]}` as Square;
}

function isLightSquare(row: number, col: number): boolean {
  return (row + col) % 2 === 0;
}

// ─── Material ────────────────────────────────────────────────────────────────

function getMaterialBalance(game: Chess): { white: number; black: number; diff: number } {
  let white = 0, black = 0;
  for (const row of game.board()) {
    for (const cell of row) {
      if (!cell || cell.type === "k") continue;
      if (cell.color === "w") white += PIECE_VALUES[cell.type];
      else black += PIECE_VALUES[cell.type];
    }
  }
  return { white, black, diff: white - black };
}

function MaterialBar({ game }: { game: Chess }) {
  const { diff } = getMaterialBalance(game);
  if (diff === 0) return null;
  return (
    <Badge variant="filled" color={diff > 0 ? "teal" : "red"} size="sm">
      {diff > 0 ? "White" : "Black"} +{Math.abs(diff)}
    </Badge>
  );
}

// ─── Eval bar ────────────────────────────────────────────────────────────────

function EvalBar({ score, type }: { score: number; type: "cp" | "mate" }) {
  let whitePct: number;
  if (type === "mate") {
    whitePct = score > 0 ? 98 : 2;
  } else {
    const clamped = Math.max(-10, Math.min(10, score));
    whitePct = 50 + clamped * 4.5;
    whitePct = Math.max(2, Math.min(98, whitePct));
  }

  return (
    <div className="relative rounded overflow-hidden" style={{ width: 24, height: "100%", minHeight: 200 }}>
      <div
        className="absolute top-0 left-0 right-0 transition-all duration-700 ease-out"
        style={{ height: `${100 - whitePct}%`, background: "#2a2a2e" }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 transition-all duration-700 ease-out"
        style={{ height: `${whitePct}%`, background: "#e8e8e8" }}
      />
      <div className="absolute inset-0 border border-[#3b3b4f] rounded" />
    </div>
  );
}

// ─── Interactive board ───────────────────────────────────────────────────────

interface InteractiveBoardProps {
  game: Chess;
  boardOrientation: "white" | "black";
  onMove: (from: Square, to: Square) => boolean;
  bestMove?: string | null;
  showBestMove?: boolean;
  allowBothSides?: boolean;
}

function InteractiveBoard({
  game,
  boardOrientation,
  onMove,
  bestMove,
  showBestMove,
  allowBothSides,
}: InteractiveBoardProps) {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [animatingMove, setAnimatingMove] = useState<{
    from: { row: number; col: number };
    to: { row: number; col: number };
    piece: string;
    color: string;
  } | null>(null);

  const board = game.board();

  const legalMoves = useMemo(() => {
    if (!selectedSquare) return [];
    return game.moves({ square: selectedSquare, verbose: true });
  }, [game, selectedSquare]);

  const legalMoveSquares = useMemo(
    () => new Set(legalMoves.map((m: Move) => m.to)),
    [legalMoves],
  );
  const captureMoveSquares = useMemo(
    () => new Set(legalMoves.filter((m: Move) => m.captured).map((m: Move) => m.to)),
    [legalMoves],
  );

  // Best move highlight squares
  const bestMoveFrom = showBestMove && bestMove ? bestMove.slice(0, 2) : null;
  const bestMoveTo = showBestMove && bestMove ? bestMove.slice(2, 4) : null;

  const handleSquareClick = useCallback(
    (row: number, col: number) => {
      if (game.isGameOver() || animatingMove) return;

      const sq = coordsToSquare(row, col);
      const piece = board[row][col];

      // If selected and clicking a legal move target → execute
      if (selectedSquare && legalMoveSquares.has(sq)) {
        const fromCoords = squareToCoords(selectedSquare);
        const pieceOnFrom = board[fromCoords.row][fromCoords.col];
        if (pieceOnFrom) {
          setAnimatingMove({
            from: fromCoords,
            to: { row, col },
            piece: PIECE_UNICODE[pieceOnFrom.color][pieceOnFrom.type],
            color: pieceOnFrom.color,
          });

          setTimeout(() => {
            onMove(selectedSquare, sq);
            setAnimatingMove(null);
            setSelectedSquare(null);
          }, 180);
        }
        return;
      }

      // If clicking own piece, select it
      const canMove = allowBothSides || piece?.color === game.turn();
      if (piece && canMove) {
        setSelectedSquare(selectedSquare === sq ? null : sq);
        return;
      }

      setSelectedSquare(null);
    },
    [game, board, selectedSquare, legalMoveSquares, onMove, animatingMove, allowBothSides],
  );

  // Clear selection when game changes
  useEffect(() => {
    setSelectedSquare(null);
  }, [game.fen()]);  // eslint-disable-line react-hooks/exhaustive-deps

  // Map rows/cols based on orientation
  const rowOrder = boardOrientation === "white" ? [0,1,2,3,4,5,6,7] : [7,6,5,4,3,2,1,0];
  const colOrder = boardOrientation === "white" ? [0,1,2,3,4,5,6,7] : [7,6,5,4,3,2,1,0];
  const fileLabels = boardOrientation === "white" ? FILES : [...FILES].reverse();
  const rankLabels = boardOrientation === "white" ? RANKS : [...RANKS].reverse();

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 480, borderRadius: "6px", boxShadow: "0 4px 24px rgba(0,0,0,0.4)", overflow: "hidden" }}>
      {/* Rank labels (left side) */}
      <div style={{ position: "absolute", left: "2px", top: 0, bottom: 0, display: "flex", flexDirection: "column", zIndex: 2, pointerEvents: "none" }}>
        {rankLabels.map((rank, i) => (
          <div key={rank} style={{ flex: 1, display: "flex", alignItems: "flex-start", paddingTop: "1px" }}>
            <span style={{ fontSize: "10px", color: isLightSquare(rowOrder[i], colOrder[0]) ? "#9e8a6f" : "#c8b899", fontWeight: 600, lineHeight: 1 }}>
              {rank}
            </span>
          </div>
        ))}
      </div>

      {/* Board grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", aspectRatio: "1" }}>
        {rowOrder.map((row) =>
          colOrder.map((col) => {
            const sq = coordsToSquare(row, col);
            const piece = board[row][col];
            const isLight = isLightSquare(row, col);
            const isSelected = selectedSquare === sq;
            const isLegalTarget = legalMoveSquares.has(sq);
            const isCapture = captureMoveSquares.has(sq);
            const isBestFrom = bestMoveFrom === sq;
            const isBestTo = bestMoveTo === sq;
            const isAnimatingFrom = animatingMove && animatingMove.from.row === row && animatingMove.from.col === col;

            let bgColor = isLight ? "#f0d9b5" : "#b58863";
            if (isSelected) bgColor = "rgba(124, 58, 237, 0.5)";
            else if (isBestFrom && !isSelected) bgColor = isLight ? "#a8c66c" : "#7b9e42";
            else if (isBestTo && !isSelected) bgColor = isLight ? "#f7f769" : "#d4c928";

            return (
              <div
                key={sq}
                onClick={() => handleSquareClick(row, col)}
                style={{
                  position: "relative",
                  aspectRatio: "1",
                  background: bgColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: isLegalTarget || (piece && (allowBothSides || piece.color === game.turn())) ? "pointer" : "default",
                  userSelect: "none",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                {/* Selected pulse */}
                {isSelected && (
                  <motion.div
                    animate={{ opacity: [0.3, 0.15, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{ position: "absolute", inset: 0, background: "rgba(124, 58, 237, 0.3)", pointerEvents: "none" }}
                  />
                )}

                {/* Legal move dot */}
                {isLegalTarget && !isCapture && (
                  <div style={{
                    position: "absolute", width: "28%", height: "28%", minWidth: "12px", minHeight: "12px",
                    borderRadius: "50%", background: "rgba(0, 0, 0, 0.2)", pointerEvents: "none", zIndex: 1,
                  }} />
                )}

                {/* Capture ring */}
                {isCapture && (
                  <div style={{
                    position: "absolute", inset: "4%", borderRadius: "50%",
                    border: "3px solid rgba(0, 0, 0, 0.2)", pointerEvents: "none", zIndex: 1,
                  }} />
                )}

                {/* Piece */}
                {piece && !isAnimatingFrom && (
                  <span style={{
                    fontSize: "clamp(24px, 5vw, 48px)",
                    lineHeight: 1,
                    color: piece.color === "w" ? "#fff" : "#222",
                    textShadow: piece.color === "w"
                      ? "0 0 4px rgba(0,0,0,0.8), 0 1px 2px rgba(0,0,0,0.6)"
                      : "0 0 4px rgba(255,255,255,0.5), 0 1px 2px rgba(0,0,0,0.3)",
                    WebkitTextStroke: piece.color === "w" ? "0.5px rgba(0,0,0,0.3)" : "0.5px rgba(255,255,255,0.4)",
                    pointerEvents: "none",
                    zIndex: 1,
                  }}>
                    {PIECE_UNICODE[piece.color][piece.type]}
                  </span>
                )}
              </div>
            );
          }),
        )}
      </div>

      {/* File labels (bottom) */}
      <div style={{ position: "absolute", bottom: "1px", left: 0, right: 0, display: "flex", zIndex: 2, pointerEvents: "none" }}>
        {fileLabels.map((file, i) => (
          <div key={file} style={{ flex: 1, display: "flex", justifyContent: "flex-end", paddingRight: "2px" }}>
            <span style={{ fontSize: "10px", color: isLightSquare(rowOrder[7], colOrder[i]) ? "#9e8a6f" : "#c8b899", fontWeight: 600, lineHeight: 1 }}>
              {file}
            </span>
          </div>
        ))}
      </div>

      {/* Animating piece overlay */}
      {animatingMove && (
        <motion.div
          initial={{
            position: "absolute",
            left: `${((boardOrientation === "white" ? animatingMove.from.col : 7 - animatingMove.from.col) / 8) * 100}%`,
            top: `${((boardOrientation === "white" ? animatingMove.from.row : 7 - animatingMove.from.row) / 8) * 100}%`,
            width: "12.5%", height: "12.5%",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 10, pointerEvents: "none" as const,
          }}
          animate={{
            left: `${((boardOrientation === "white" ? animatingMove.to.col : 7 - animatingMove.to.col) / 8) * 100}%`,
            top: `${((boardOrientation === "white" ? animatingMove.to.row : 7 - animatingMove.to.row) / 8) * 100}%`,
          }}
          transition={{ duration: 0.18, ease: "easeInOut" }}
        >
          <span style={{
            fontSize: "clamp(24px, 5vw, 48px)", lineHeight: 1,
            color: animatingMove.color === "w" ? "#fff" : "#222",
            textShadow: animatingMove.color === "w"
              ? "0 0 4px rgba(0,0,0,0.8), 0 1px 2px rgba(0,0,0,0.6)"
              : "0 0 4px rgba(255,255,255,0.5), 0 1px 2px rgba(0,0,0,0.3)",
            WebkitTextStroke: animatingMove.color === "w" ? "0.5px rgba(0,0,0,0.3)" : "0.5px rgba(255,255,255,0.4)",
          }}>
            {animatingMove.piece}
          </span>
        </motion.div>
      )}
    </div>
  );
}

// ─── Eval normalization (Stockfish scores are relative to side-to-move) ──────

function normalizeEval(
  sfEval: { score: number; type: "cp" | "mate"; display: string; depth: number; bestMove: string | null; pv: string } | null,
  turn: "w" | "b",
): { score: number; type: "cp" | "mate"; display: string } | null {
  if (!sfEval) return null;
  const flip = turn === "b" ? -1 : 1;
  const score = sfEval.score * flip;
  const display = sfEval.type === "mate"
    ? score > 0 ? `M${Math.abs(score)}` : `-M${Math.abs(score)}`
    : `${score >= 0 ? "+" : ""}${score.toFixed(1)}`;
  return { score, type: sfEval.type, display };
}

// ─── Analysis stage types ────────────────────────────────────────────────────

interface AnalysisResult {
  fen: string;
  pieces: { white: string[]; black: string[] };
  turn: string;
  inCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isDraw: boolean;
}

type AnalysisStage = "idle" | "recognizing" | "evaluating" | "done";

// ─── Page component ──────────────────────────────────────────────────────────

export default function ChessAnalysisPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");
  const [perspective, setPerspective] = useState<"white" | "black">("white");
  const [turn, setTurn] = useState<"w" | "b">("w");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<AnalysisStage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [game, setGame] = useState<Chess | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sfDepthTarget = 22;
  const { ready: sfReady, evaluation: sfEval, analyzing: sfAnalyzing, analyze: sfAnalyze, stop: sfStop } = useStockfish();

  const handleLogin = useCallback(async () => {
    setAuthError("");
    try {
      const res = await fetch("/api/admin/visitors?dates=list", {
        headers: { Authorization: `Bearer ${password}` },
      });
      if (res.ok) {
        setAuthed(true);
      } else {
        setAuthError("Invalid password");
      }
    } catch {
      setAuthError("Connection error");
    }
  }, [password]);

  const loadImage = useCallback((file: File) => {
    setImageFile(file);
    setError(null);
    setResult(null);
    setGame(null);
    setShowAnalysis(false);
    sfStop();
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }, [sfStop]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadImage(file);
  }, [loadImage]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith("image/")) loadImage(file);
  }, [loadImage]);

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const file = Array.from(e.clipboardData?.files ?? []).find((f) => f.type.startsWith("image/"));
    if (file) { e.preventDefault(); loadImage(file); }
  }, [loadImage]);

  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  const clearImage = useCallback(() => {
    setImageFile(null);
    setImagePreview(null);
    setResult(null);
    setError(null);
    setStage("idle");
    setGame(null);
    setShowAnalysis(false);
    sfStop();
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [sfStop]);

  const fetchPosition = useCallback(async (): Promise<AnalysisResult | null> => {
    if (!imageFile) return null;
    setLoading(true);
    setError(null);
    setResult(null);
    setGame(null);
    setStage("recognizing");
    sfStop();

    try {
      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("perspective", perspective);
      formData.append("turn", turn);

      const res = await fetch("/api/tools/chess-analyze", {
        method: "POST",
        headers: { Authorization: `Bearer ${password}` },
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        let msg = data.error || "Analysis failed.";
        if (data.rawFen) msg += `\n\nExtracted FEN: ${data.rawFen}`;
        if (data.rawResponse) msg += `\n\nRaw AI response:\n${data.rawResponse}`;
        setError(msg);
        setStage("idle");
        return null;
      }

      const analysisResult = data as AnalysisResult;
      setResult(analysisResult);
      setGame(new Chess(analysisResult.fen));
      return analysisResult;
    } catch {
      setError("Network error. Please try again.");
      setStage("idle");
      return null;
    } finally {
      setLoading(false);
    }
  }, [imageFile, perspective, turn, password, sfStop]);

  const plotBoard = useCallback(async () => {
    setShowAnalysis(false);
    const r = await fetchPosition();
    if (r) setStage("done");
  }, [fetchPosition]);

  const plotAndAnalyze = useCallback(async () => {
    setShowAnalysis(true);
    const r = await fetchPosition();
    if (r && sfReady) {
      setStage("evaluating");
      sfAnalyze(r.fen, sfDepthTarget);
    } else if (r) {
      setStage("done");
    }
  }, [fetchPosition, sfReady, sfAnalyze]);

  useEffect(() => {
    if (stage === "evaluating" && !sfAnalyzing && sfEval?.bestMove) setStage("done");
  }, [stage, sfAnalyzing, sfEval]);

  const handleMove = useCallback((from: Square, to: Square): boolean => {
    if (!game) return false;
    try {
      const newGame = new Chess(game.fen());
      const move = newGame.move({ from, to, promotion: "q" });
      if (!move) return false;
      setGame(newGame);
      if (showAnalysis && sfReady) sfAnalyze(newGame.fen(), sfDepthTarget);
      return true;
    } catch {
      return false;
    }
  }, [game, showAnalysis, sfReady, sfAnalyze]);

  const stageLabel = { idle: "", recognizing: "Reading board position...", evaluating: "Stockfish analyzing...", done: "" }[stage];
  const sfProgress = sfEval ? Math.round((sfEval.depth / sfDepthTarget) * 100) : 0;
  const normEval = normalizeEval(sfEval, game?.turn() ?? "w");

  const gameStatus = useMemo(() => {
    if (!game) return null;
    if (game.isCheckmate()) return "Checkmate";
    if (game.isStalemate()) return "Stalemate";
    if (game.isDraw()) return "Draw";
    if (game.inCheck()) return "Check";
    return null;
  }, [game?.fen()]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!authed) {
    return (
      <PageShell maxWidth="sm">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", padding: "20px" }}>
          <Paper p="xl" radius="md" style={{ background: "#16161e", border: "1px solid #2a2a3c", width: "100%", maxWidth: 400 }}>
            <Stack gap="md" align="center">
              <IconLock size={40} className="text-[#565f89]" />
              <Title order={3} className="text-[#c0caf5]">Chess Analyzer</Title>
              <Text size="sm" c="dimmed" ta="center">
                This tool requires admin access.
              </Text>
              <TextInput
                placeholder="Admin password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                error={authError || undefined}
                styles={{ input: { background: "#1a1b26", border: "1px solid #2a2a3c" } }}
                style={{ width: "100%" }}
              />
              <Button onClick={handleLogin} fullWidth variant="filled" color="violet" leftSection={<IconLock size={16} />}>
                Authenticate
              </Button>
            </Stack>
          </Paper>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell maxWidth="xl">
      <Stack gap="lg" py="md">
        <div>
          <Title order={2} className="text-[#c0caf5]">Chess Position Analyzer</Title>
          <Text size="sm" c="dimmed" mt={4}>
            Upload a screenshot to identify pieces, evaluate the position, and explore moves.
          </Text>
        </div>

        <Paper p="lg" radius="md" style={{ background: "#16161e", border: "1px solid #2a2a3c" }}>
          <Stack gap="md">
            <Group gap="sm" wrap="wrap">
              <div>
                <Text size="xs" c="dimmed" mb={4} fw={500}>Board perspective</Text>
                <SegmentedControl
                  value={perspective}
                  onChange={(v) => setPerspective(v as "white" | "black")}
                  data={[{ label: "White", value: "white" }, { label: "Black", value: "black" }]}
                  size="xs"
                  styles={{ root: { background: "#1a1b26" } }}
                />
              </div>
              <div>
                <Text size="xs" c="dimmed" mb={4} fw={500}>Side to move</Text>
                <SegmentedControl
                  value={turn}
                  onChange={(v) => setTurn(v as "w" | "b")}
                  data={[{ label: "White", value: "w" }, { label: "Black", value: "b" }]}
                  size="xs"
                  styles={{ root: { background: "#1a1b26" } }}
                />
              </div>
            </Group>

            {/* Upload area */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer border-2 border-dashed border-[#3b3b4f] hover:border-[#7aa2f7] rounded-lg transition-colors flex flex-col items-center justify-center gap-3 p-8"
              style={{ minHeight: 160 }}
            >
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
              {imagePreview ? (
                <img src={imagePreview} alt="Chess board screenshot" className="max-h-48 rounded" style={{ maxWidth: "100%" }} />
              ) : (
                <>
                  <IconUpload size={32} className="text-[#565f89]" />
                  <Text size="sm" c="dimmed">Click, drag, or paste (Ctrl+V) a chess board screenshot</Text>
                  <Text size="xs" c="dimmed">PNG, JPG, WebP up to 10MB</Text>
                </>
              )}
            </div>

            {/* Buttons */}
            <Group wrap="wrap" gap="xs">
              <Button onClick={plotBoard} disabled={!imageFile || loading} loading={loading && !showAnalysis}
                leftSection={<IconPlayerPlay size={16} />} variant="filled" color="violet" size="sm">
                Plot Board
              </Button>
              <Button onClick={plotAndAnalyze} disabled={!imageFile || loading} loading={loading && showAnalysis}
                leftSection={<IconChess size={16} />} variant="filled" color="blue" size="sm">
                Plot & Analyze
              </Button>
              {imageFile && (
                <Button onClick={clearImage} variant="subtle" color="red" leftSection={<IconTrash size={16} />} disabled={loading} size="sm">
                  Clear
                </Button>
              )}
            </Group>

            {/* Progress */}
            {stage !== "idle" && stage !== "done" && (
              <Paper p="sm" radius="sm" style={{ background: "#1a1b26", border: "1px solid #2a2a3c" }}>
                <Stack gap={6}>
                  <Text size="xs" c="dimmed" fw={500}>{stageLabel}</Text>
                  {stage === "recognizing" && <Progress value={100} animated color="blue" size="sm" />}
                  {stage === "evaluating" && (
                    <Progress value={sfProgress} color={sfProgress >= 100 ? "teal" : "blue"} size="sm" animated={sfProgress < 100} />
                  )}
                </Stack>
              </Paper>
            )}
          </Stack>
        </Paper>

        {/* Error */}
        {error && (
          <Alert icon={<IconAlertTriangle size={18} />} title="Analysis Error" color="red" variant="light">
            <Text size="sm" style={{ whiteSpace: "pre-wrap", fontFamily: error.includes("Raw AI") ? "monospace" : undefined }}>
              {error}
            </Text>
          </Alert>
        )}

        {/* Board section */}
        {game && (
          <Paper p="lg" radius="md" style={{ background: "#16161e", border: "1px solid #2a2a3c" }}>
            <Stack gap="md">
              {/* Header */}
              <Group justify="space-between" align="center" wrap="wrap">
                <Group gap="xs">
                  {gameStatus && (
                    <Badge color={gameStatus === "Checkmate" ? "red" : gameStatus === "Check" ? "orange" : "yellow"} variant="filled">
                      {gameStatus}
                    </Badge>
                  )}
                  <Badge color={game.turn() === "w" ? "gray" : "dark"} variant="filled">
                    {game.turn() === "w" ? "White" : "Black"} to move
                  </Badge>
                  <MaterialBar game={game} />
                </Group>
                {showAnalysis && normEval && (
                  <Tooltip label={`Stockfish depth ${sfEval?.depth}`}>
                    <Badge
                      size="lg" variant="filled" ff="monospace" className="cursor-help"
                      color={sfAnalyzing ? "blue" : normEval.score > 0.5 ? "teal" : normEval.score < -0.5 ? "red" : "gray"}
                    >
                      {normEval.display}
                    </Badge>
                  </Tooltip>
                )}
              </Group>

              {/* Board + eval bar */}
              <div style={{ display: "flex", gap: "8px", justifyContent: "center", alignItems: "stretch", flexWrap: "nowrap" }}>
                {showAnalysis && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, flexShrink: 0 }}>
                    <EvalBar score={normEval?.score ?? 0} type={normEval?.type ?? "cp"} />
                    <Text size="xs" c="dimmed">
                      {sfAnalyzing ? `d${sfEval?.depth ?? 0}/${sfDepthTarget}` : sfEval ? `d${sfEval.depth}` : ""}
                    </Text>
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <InteractiveBoard
                    game={game}
                    boardOrientation={perspective}
                    onMove={handleMove}
                    bestMove={sfEval?.bestMove}
                    showBestMove={showAnalysis && !!sfEval?.bestMove}
                    allowBothSides
                  />
                </div>
              </div>

              {/* Best move */}
              {showAnalysis && sfEval?.bestMove && (
                <>
                  <Divider color="#2a2a3c" />
                  <Group gap="md" wrap="wrap">
                    <div>
                      <Text size="xs" c="dimmed" fw={500} mb={4}>Best move</Text>
                      <Badge size="xl" variant="filled" color="teal" ff="monospace">{sfEval.bestMove}</Badge>
                    </div>
                    {sfEval.pv && (
                      <div>
                        <Text size="xs" c="dimmed" fw={500} mb={4}>Top line</Text>
                        <Text size="xs" ff="monospace" className="text-[#c0caf5]" style={{ wordBreak: "break-all" }}>
                          {sfEval.pv.split(" ").slice(0, 8).join(" ")}
                        </Text>
                      </div>
                    )}
                  </Group>
                </>
              )}

              <Divider color="#2a2a3c" />

              {/* FEN */}
              <div>
                <Text size="xs" c="dimmed" fw={500} mb={4}>FEN</Text>
                <Paper p="xs" radius="sm" style={{ background: "#1a1b26", border: "1px solid #2a2a3c" }}>
                  <Text size="xs" ff="monospace" className="text-[#7aa2f7] break-all">{game.fen()}</Text>
                </Paper>
              </div>
            </Stack>
          </Paper>
        )}

        <Text size="xs" c="dimmed">
          Powered by Gemini for piece recognition (64-square classification) and
          Stockfish 18 (WASM) for position evaluation. Analysis runs in your browser.
          Images are not stored.
        </Text>
      </Stack>
    </PageShell>
  );
}
