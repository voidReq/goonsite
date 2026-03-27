"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface StockfishEval {
  /** Centipawns (positive = white advantage) or mate distance */
  score: number;
  type: "cp" | "mate";
  display: string;
  depth: number;
  bestMove: string | null;
  pv: string;
}

export function useStockfish() {
  const workerRef = useRef<Worker | null>(null);
  const [ready, setReady] = useState(false);
  const [evaluation, setEvaluation] = useState<StockfishEval | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const resolveRef = useRef<((val: StockfishEval) => void) | null>(null);

  useEffect(() => {
    const worker = new Worker("/stockfish/stockfish-18-lite-single.js");

    worker.onmessage = (e: MessageEvent<string>) => {
      const msg = e.data;

      if (msg === "uciok") {
        worker.postMessage("isready");
      }
      if (msg === "readyok") {
        setReady(true);
      }

      // Parse "info depth N score cp X ..." or "info depth N score mate X ..."
      if (msg.startsWith("info depth")) {
        const depthMatch = msg.match(/depth (\d+)/);
        const cpMatch = msg.match(/score cp (-?\d+)/);
        const mateMatch = msg.match(/score mate (-?\d+)/);
        const pvMatch = msg.match(/ pv (.+)/);
        const depth = depthMatch ? parseInt(depthMatch[1]) : 0;

        if (cpMatch || mateMatch) {
          const isMate = !!mateMatch;
          const rawScore = parseInt(
            isMate ? mateMatch![1] : cpMatch![1],
          );
          // Raw score is relative to side-to-move. Caller must normalize.
          const display = isMate
            ? rawScore > 0
              ? `M${rawScore}`
              : `-M${Math.abs(rawScore)}`
            : `${rawScore >= 0 ? "+" : ""}${(rawScore / 100).toFixed(1)}`;

          const eval_: StockfishEval = {
            score: isMate ? rawScore : rawScore / 100,
            type: isMate ? "mate" : "cp",
            display,
            depth,
            bestMove: null,
            pv: pvMatch ? pvMatch[1] : "",
          };
          setEvaluation(eval_);
        }
      }

      // Parse "bestmove e2e4 ..."
      if (msg.startsWith("bestmove")) {
        const moveMatch = msg.match(/bestmove (\S+)/);
        setEvaluation((prev) => {
          const final = prev
            ? { ...prev, bestMove: moveMatch?.[1] ?? null }
            : null;
          if (final && resolveRef.current) {
            resolveRef.current(final);
            resolveRef.current = null;
          }
          return final;
        });
        setAnalyzing(false);
      }
    };

    worker.postMessage("uci");
    workerRef.current = worker;

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const analyze = useCallback(
    (fen: string, depth = 20): Promise<StockfishEval> => {
      return new Promise((resolve) => {
        if (!workerRef.current || !ready) {
          resolve({
            score: 0,
            type: "cp",
            display: "+0.0",
            depth: 0,
            bestMove: null,
            pv: "",
          });
          return;
        }

        resolveRef.current = resolve;
        setAnalyzing(true);
        setEvaluation(null);

        const worker = workerRef.current;
        worker.postMessage("stop");
        worker.postMessage(`position fen ${fen}`);
        worker.postMessage(`go depth ${depth}`);
      });
    },
    [ready],
  );

  const stop = useCallback(() => {
    workerRef.current?.postMessage("stop");
    setAnalyzing(false);
  }, []);

  return { ready, evaluation, analyzing, analyze, stop };
}
