import { NextRequest, NextResponse } from "next/server";
import { Chess } from "chess.js";
import sharp from "sharp";
import { rateLimit } from "../../../../lib/rate-limit";

const GEMINI_FLASH = "gemini-2.5-flash";
const GEMINI_PRO = "gemini-3.1-pro-preview";

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  return authHeader.slice(7) === process.env.ADMIN_PASSWORD;
}

/**
 * POST /api/tools/chess-analyze
 * Requires admin auth (Bearer token).
 * Accepts multipart form data with:
 *   - image: File (screenshot of chess board)
 *   - perspective: "white" | "black" (which side the board is viewed from)
 *   - turn: "w" | "b" (whose turn it is)
 *
 * Returns: { fen, pieces, error? }
 */
export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (!isAuthorized(request)) {
    const { limited } = rateLimit("admin-login", ip, 5, 60_000);
    if (limited) {
      return NextResponse.json(
        { error: "Too many attempts. Try again later." },
        { status: 429 },
      );
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 10 requests per minute per IP
  const { limited } = rateLimit("chess-analyze", ip, 10, 60_000);
  if (limited) {
    return NextResponse.json(
      { error: "Rate limited. Try again in a minute." },
      { status: 429 },
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Gemini API key not configured." },
      { status: 500 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid form data." },
      { status: 400 },
    );
  }

  const imageFile = formData.get("image") as File | null;
  const perspective = (formData.get("perspective") as string) || "white";
  const turn = (formData.get("turn") as string) || "w";
  const debug = formData.get("debug") === "true";

  if (!imageFile || imageFile.size === 0) {
    return NextResponse.json({ error: "No image provided." }, { status: 400 });
  }

  if (imageFile.size > 10 * 1024 * 1024) {
    return NextResponse.json(
      { error: "Image too large. Max 10MB." },
      { status: 400 },
    );
  }

  try {
    // Convert image to base64
    const imageBytes = await imageFile.arrayBuffer();
    const base64Image = Buffer.from(imageBytes).toString("base64");
    const mimeType = imageFile.type || "image/png";

    // Call Gemini to extract FEN
    const { fen, rawResponse } = await extractFenFromImage(
      apiKey,
      base64Image,
      mimeType,
      perspective,
      turn,
    );

    // Validate FEN with chess.js
    let chess: Chess;
    try {
      chess = new Chess(fen);
    } catch {
      return NextResponse.json(
        {
          error:
            "Could not parse a valid chess position from the image. Try a clearer screenshot.",
          rawFen: fen,
          rawResponse,
        },
        { status: 422 },
      );
    }

    // Extract piece list from the position
    const pieces = describePieces(chess);

    return NextResponse.json({
      fen: chess.fen(),
      pieces,
      turn: chess.turn() === "w" ? "white" : "black",
      inCheck: chess.inCheck(),
      isCheckmate: chess.isCheckmate(),
      isStalemate: chess.isStalemate(),
      isDraw: chess.isDraw(),
      ...(debug && { rawResponse }),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Analysis failed.";
    const raw = (err as { rawResponse?: string }).rawResponse;
    return NextResponse.json(
      { error: message, ...(raw && { rawResponse: raw }) },
      { status: 500 },
    );
  }
}

interface GeminiResult {
  text: string;
  finishReason: string;
  partCount: number;
  debug: string;
}

async function callGemini(
  apiKey: string,
  model: string,
  parts: Record<string, unknown>[],
  maxTokens: number,
  thinkingLevel?: "LOW" | "MEDIUM" | "HIGH",
): Promise<GeminiResult> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const generationConfig: Record<string, unknown> = {
    temperature: 0.1,
    maxOutputTokens: maxTokens,
  };

  if (thinkingLevel) {
    generationConfig.thinkingConfig = { thinkingLevel: thinkingLevel.toLowerCase() };
  }

  const body = { contents: [{ parts }], generationConfig };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error (${model}): ${response.status} - ${errText}`);
  }

  const data = await response.json();
  const responseParts = data?.candidates?.[0]?.content?.parts ?? [];
  const finishReason = data?.candidates?.[0]?.finishReason ?? "unknown";

  // Build debug summary
  const partSummaries = responseParts.map((p: Record<string, unknown>, i: number) => {
    const keys = Object.keys(p);
    const textLen = typeof p.text === "string" ? p.text.length : 0;
    return `part[${i}]: keys=[${keys}] textLen=${textLen} thought=${!!p.thought}`;
  });
  const debugInfo = `model=${model} finishReason=${finishReason} parts=${responseParts.length}\n${partSummaries.join("\n")}`;

  console.log("[chess-analyze] callGemini:", debugInfo);

  // Thinking models return a "thought" part first, then the actual response
  let text = "";
  for (let i = responseParts.length - 1; i >= 0; i--) {
    if (responseParts[i].text && !responseParts[i].thought) {
      text = responseParts[i].text.trim();
      break;
    }
  }
  // Fallback: last part with text
  if (!text) {
    for (let i = responseParts.length - 1; i >= 0; i--) {
      if (responseParts[i].text) {
        text = (responseParts[i].text as string).trim();
        break;
      }
    }
  }

  return { text, finishReason, partCount: responseParts.length, debug: debugInfo };
}

/** Convert the grid description from the vision model into a FEN placement string */
function gridToFen(gridText: string, perspective: string): string | null {
  const pieceMap: Record<string, string> = {
    WK: "K", WQ: "Q", WR: "R", WB: "B", WN: "N", WP: "P",
    bK: "k", bQ: "q", bR: "r", bB: "b", bN: "n", bp: "p",
    // Also handle lowercase variants
    wK: "K", wQ: "Q", wR: "R", wB: "B", wN: "N", wP: "P",
    Wk: "K", Wq: "Q", Wr: "R", Wb: "B", Wn: "N", Wp: "P",
    wk: "K", wq: "Q", wr: "R", wb: "B", wn: "N", wp: "P",
    bk: "k", bq: "q", br: "r", bb: "b", bn: "n", bP: "p",
    Bk: "k", Bq: "q", Br: "r", Bb: "b", Bn: "n", Bp: "p",
    BK: "k", BQ: "q", BR: "r", BB: "b", BN: "n", BP: "p",
  };

  // Extract rows in order they appear (top to bottom of image)
  const rows: string[][] = [];
  for (let i = 1; i <= 8; i++) {
    const rowPattern = new RegExp(`Row\\s*${i}[^:]*:\\s*(.+)`, "i");
    const match = gridText.match(rowPattern);
    if (!match) return null;
    const squares = match[1].trim().split(/\s+/);
    if (squares.length !== 8) return null;
    rows.push(squares);
  }

  // Convert each row to FEN rank
  // From white's perspective: Row 1 = rank 8, Row 2 = rank 7, etc. (already FEN order)
  // From black's perspective: Row 1 = rank 1, Row 8 = rank 8 (need to reverse for FEN)
  const orderedRows = perspective === "black" ? [...rows].reverse() : rows;

  const fenRanks = orderedRows.map((row) => {
    let rank = "";
    let empty = 0;
    for (const sq of row) {
      if (sq === "--") {
        empty++;
      } else {
        if (empty > 0) { rank += empty; empty = 0; }
        const piece = pieceMap[sq];
        if (!piece) return null;
        rank += piece;
      }
    }
    if (empty > 0) rank += empty;
    return rank;
  });

  if (fenRanks.some((r) => r === null)) return null;
  return fenRanks.join("/");
}

/** Crop the image to just the chess board using bounding box from Flash */
async function cropBoardFromImage(
  apiKey: string,
  base64Image: string,
  mimeType: string,
): Promise<{ croppedBase64: string; croppedMime: string } | null> {
  const bboxPrompt = `Find the 8x8 chess board grid in this image. I need the bounding box of ONLY the playing squares — exclude any coordinate labels (a-h, 1-8), borders, margins, or UI elements around the board.

Return ONLY four integers on a single line, space-separated:
x y width height

Where x,y is the top-left pixel of the top-left square (a8 or h1 depending on orientation) and width,height are the dimensions of the 8x8 grid of squares only.
Example: 120 80 500 500

Output nothing else.`;

  const bboxResponse = await callGemini(
    apiKey,
    GEMINI_FLASH,
    [
      { text: bboxPrompt },
      { inline_data: { mime_type: mimeType, data: base64Image } },
    ],
    512,
  );

  console.log("[chess-analyze] Bounding box:", bboxResponse.text, "debug:", bboxResponse.debug);

  if (!bboxResponse.text) return null;

  // Parse "x y width height" from response
  const nums = bboxResponse.text.match(/(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/);
  if (!nums) return null;

  const [, x, y, w, h] = nums.map(Number);

  // Sanity check: board should be roughly square and reasonably sized
  const aspect = Math.max(w, h) / Math.min(w, h);
  if (aspect > 1.5 || w < 50 || h < 50) return null;

  try {
    const imgBuffer = Buffer.from(base64Image, "base64");
    const metadata = await sharp(imgBuffer).metadata();
    const imgW = metadata.width ?? 0;
    const imgH = metadata.height ?? 0;

    // Trim inward slightly to skip board borders/margins that could misalign the grid
    const inset = Math.round(Math.min(w, h) * 0.01);
    const cropX = Math.min(x + inset, imgW - 1);
    const cropY = Math.min(y + inset, imgH - 1);
    const cropW = Math.min(w - inset * 2, imgW - cropX);
    const cropH = Math.min(h - inset * 2, imgH - cropY);

    const cropped = await sharp(imgBuffer)
      .extract({ left: cropX, top: cropY, width: cropW, height: cropH })
      .png()
      .toBuffer();

    return {
      croppedBase64: cropped.toString("base64"),
      croppedMime: "image/png",
    };
  } catch (e) {
    console.log("[chess-analyze] Crop failed:", e);
    return null;
  }
}

function buildRecognitionPrompt(perspective: string): string {
  const whiteView = perspective === "white";
  return `You are an expert chess position reader. Examine this chess board screenshot and list every piece you see.

The board is viewed from ${perspective}'s perspective (${whiteView ? "white pieces at the bottom, rank 1 at bottom, rank 8 at top" : "black pieces at the bottom, rank 8 at bottom, rank 1 at top"}).

The board may use non-standard square colors (e.g. purple/white instead of green/cream). Ignore square colors. Identify pieces by their shape. Light/white colored pieces are White, dark colored pieces are Black.

FILE COUNTING (critical — count carefully from the ${whiteView ? "left" : "right"} edge of the board):
${whiteView
    ? "Left edge = a-file, then b, c, d, e, f, g, right edge = h-file"
    : "Left edge = h-file, then g, f, e, d, c, b, right edge = a-file"}

RANK COUNTING:
${whiteView
    ? "Bottom edge = rank 1, top edge = rank 8"
    : "Bottom edge = rank 8, top edge = rank 1"}

For EACH piece on the board, output one line in this exact format:
[color] [piece] [square]

Where:
- color: "W" for White, "B" for Black
- piece: King, Queen, Rook, Bishop, Knight, or Pawn
- square: file letter + rank number (e.g. e4, a7, h1)

To determine a piece's file: count which column it is in from the left edge (1st=${whiteView ? "a" : "h"}, 2nd=${whiteView ? "b" : "g"}, 3rd=${whiteView ? "c" : "f"}, 4th=${whiteView ? "d" : "e"}, 5th=${whiteView ? "e" : "d"}, 6th=${whiteView ? "f" : "c"}, 7th=${whiteView ? "g" : "b"}, 8th=${whiteView ? "h" : "a"}).
To determine a piece's rank: count which row it is in from the bottom edge (1st=${whiteView ? "1" : "8"}, 2nd=${whiteView ? "2" : "7"}, etc.).

Example output:
B Rook a8
B Knight b8
W Pawn e4
W King g1

List ALL pieces. Do not skip any. Output nothing else — just the piece list.`;
}

/** Parse piece-list format ("W King e1", "B Rook a8", etc.) into FEN */
function pieceListToFen(text: string, turn: string): string | null {
  const pieceTypeMap: Record<string, string> = {
    king: "k", queen: "q", rook: "r", bishop: "b", knight: "n", pawn: "p",
  };

  // Build empty 8x8 board (rank 8 = index 0, rank 1 = index 7)
  const board: (string | null)[][] = Array.from({ length: 8 }, () =>
    Array(8).fill(null),
  );

  const linePattern = /^(W|B)\s+(King|Queen|Rook|Bishop|Knight|Pawn)\s+([a-h][1-8])$/i;
  let matchCount = 0;

  for (const line of text.split("\n")) {
    const match = line.trim().match(linePattern);
    if (!match) continue;

    const color = match[1].toUpperCase();
    const pieceType = pieceTypeMap[match[2].toLowerCase()];
    const file = match[3].charCodeAt(0) - 97; // a=0, h=7
    const rank = parseInt(match[3][1]) - 1; // 1=0, 8=7

    if (!pieceType || file < 0 || file > 7 || rank < 0 || rank > 7) continue;

    const piece = color === "W" ? pieceType.toUpperCase() : pieceType;
    const boardRank = 7 - rank; // FEN rank 8 = board[0]
    board[boardRank][file] = piece;
    matchCount++;
  }

  if (matchCount < 2) return null; // Need at least 2 pieces (both kings)

  // Convert board to FEN placement
  const fenRanks = board.map((row) => {
    let rank = "";
    let empty = 0;
    for (const sq of row) {
      if (sq === null) {
        empty++;
      } else {
        if (empty > 0) { rank += empty; empty = 0; }
        rank += sq;
      }
    }
    if (empty > 0) rank += empty;
    return rank;
  });

  return `${fenRanks.join("/")} ${turn} - - 0 1`;
}

function parseResponse(
  response: string,
  perspective: string,
  turn: string,
): string | null {
  // Strategy 1: piece-list format ("W King e1", "B Rook a8")
  const fenFromList = pieceListToFen(response, turn);
  if (fenFromList) return fenFromList;

  // Strategy 2: grid format (Row 1: WK -- bR ...)
  const placement = gridToFen(response, perspective);
  if (placement) return `${placement} ${turn} - - 0 1`;

  // Strategy 3: raw FEN string in response
  const cleaned = response
    .replace(/```[\s\S]*?\n?/g, "")
    .replace(/`/g, "")
    .trim();

  const fenMatch = cleaned.match(
    /([rnbqkpRNBQKP1-8]+\/){7}[rnbqkpRNBQKP1-8]+(\s+[wb]\s+[KQkq-]+\s+[a-h1-8-]+\s+\d+\s+\d+)?/,
  );
  if (fenMatch) {
    return fenMatch[0].includes(" ") ? fenMatch[0] : `${fenMatch[0]} ${turn} - - 0 1`;
  }

  return null;
}

/** Validate that a FEN is parseable by chess.js */
function isValidFen(fen: string): boolean {
  try {
    new Chess(fen);
    return true;
  } catch {
    return false;
  }
}

/** Count non-empty squares in a FEN placement string */
function countPieces(fen: string): number {
  const placement = fen.split(" ")[0];
  return [...placement].filter((c) => /[rnbqkpRNBQKP]/.test(c)).length;
}

/** Check if FEN has exactly one white king and one black king */
function hasValidKings(fen: string): boolean {
  const placement = fen.split(" ")[0];
  const whiteKings = (placement.match(/K/g) ?? []).length;
  const blackKings = (placement.match(/k/g) ?? []).length;
  return whiteKings === 1 && blackKings === 1;
}

/** Split a cropped board image into 64 individual square images */
async function splitBoardIntoSquares(
  croppedBase64: string,
): Promise<{ square: string; base64: string }[]> {
  const imgBuffer = Buffer.from(croppedBase64, "base64");
  const metadata = await sharp(imgBuffer).metadata();
  const boardW = metadata.width ?? 0;
  const boardH = metadata.height ?? 0;

  if (boardW < 80 || boardH < 80) throw new Error("Board image too small to split");

  const sqW = Math.floor(boardW / 8);
  const sqH = Math.floor(boardH / 8);

  const squares: { square: string; base64: string }[] = [];

  // Top-left of image is always row 0, col 0
  // We label them generically as grid positions; the caller maps to algebraic coords
  // Trim ~8% from each square edge to avoid grid lines and adjacent square bleed
  const trimPct = 0.08;
  const trimW = Math.round(sqW * trimPct);
  const trimH = Math.round(sqH * trimPct);

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const cropped = await sharp(imgBuffer)
        .extract({
          left: col * sqW + trimW,
          top: row * sqH + trimH,
          width: sqW - trimW * 2,
          height: sqH - trimH * 2,
        })
        .png()
        .toBuffer();

      // Grid position label (will be mapped to algebraic by caller based on perspective)
      squares.push({
        square: `${row}-${col}`,
        base64: cropped.toString("base64"),
      });
    }
  }

  return squares;
}

/** Map grid row/col to algebraic square name based on perspective */
function gridToAlgebraic(
  row: number,
  col: number,
  perspective: string,
): string {
  const files = "abcdefgh";
  if (perspective === "white") {
    // White perspective: top-left = a8, top-right = h8, bottom-left = a1
    const file = files[col];
    const rank = 8 - row;
    return `${file}${rank}`;
  } else {
    // Black perspective: top-left = h1, top-right = a1, bottom-left = h8
    const file = files[7 - col];
    const rank = row + 1;
    return `${file}${rank}`;
  }
}

/** Classify 64 square images in a single Gemini call and return FEN */
async function classifySquares(
  apiKey: string,
  squareImages: { square: string; base64: string }[],
  perspective: string,
  turn: string,
): Promise<{ fen: string; rawResponse: string }> {
  // Build the prompt parts: alternating text labels and images
  const promptParts: Record<string, unknown>[] = [];

  promptParts.push({
    text: `You will see 64 individual chess square images, each labeled with its algebraic coordinate.
For each square, identify what piece is on it, or say "empty" if no piece is present.

Pieces are identified by their shape:
- King (tall piece with a cross on top)
- Queen (tall piece with a crown/coronet)
- Rook (piece with battlements/crenellations on top)
- Bishop (piece with a pointed/mitred top)
- Knight (horse-shaped piece)
- Pawn (small piece with a round top)

Color: Light/white colored pieces = White (W), Dark colored pieces = Black (B).

Respond with EXACTLY 64 lines, one per square, in this format:
[square]: [color][piece] OR [square]: empty

Where color is W or B, and piece is K, Q, R, B, N, or P.

Example:
a8: BR
b8: BN
c8: empty
d8: BQ
e1: WK

Here are the 64 squares:
`,
  });

  // Add each square image with its label
  for (const sq of squareImages) {
    const [rowStr, colStr] = sq.square.split("-");
    const row = parseInt(rowStr);
    const col = parseInt(colStr);
    const algebraic = gridToAlgebraic(row, col, perspective);

    promptParts.push({ text: `\nSquare ${algebraic}:` });
    promptParts.push({
      inline_data: { mime_type: "image/png", data: sq.base64 },
    });
  }

  promptParts.push({
    text: "\n\nNow list all 64 squares with their contents:",
  });

  console.log("[chess-analyze] Classifying 64 squares with Flash");
  const result = await callGemini(apiKey, GEMINI_FLASH, promptParts, 4096);
  console.log("[chess-analyze] Square classification done: %s", result.debug);

  // Parse the response into a board
  const fen = parseSquareClassification(result.text, turn);
  if (!fen) {
    throw new Error("Could not parse square classification response");
  }

  return { fen, rawResponse: result.text };
}

/** Parse square classification response into FEN */
function parseSquareClassification(text: string, turn: string): string | null {
  const pieceMap: Record<string, string> = {
    WK: "K", WQ: "Q", WR: "R", WB: "B", WN: "N", WP: "P",
    BK: "k", BQ: "q", BR: "r", BB: "b", BN: "n", BP: "p",
    wK: "K", wQ: "Q", wR: "R", wB: "B", wN: "N", wP: "P",
    bK: "k", bQ: "q", bR: "r", bB: "b", bN: "n", bP: "p",
    Wk: "K", Wq: "Q", Wr: "R", Wb: "B", Wn: "N", Wp: "P",
    Bk: "k", Bq: "q", Br: "r", Bb: "b", Bn: "n", Bp: "p",
  };

  // Board: board[0] = rank 8, board[7] = rank 1
  const board: (string | null)[][] = Array.from({ length: 8 }, () =>
    Array(8).fill(null),
  );

  // Match lines like "a8: BR" or "e4: empty" or "a8: B R" (with space)
  const linePattern = /([a-h][1-8])\s*:\s*(empty|([WBwb])\s*([KQRBNPkqrbnp]))/i;
  let matchCount = 0;

  for (const line of text.split("\n")) {
    const match = line.trim().match(linePattern);
    if (!match) continue;

    const squareName = match[1].toLowerCase();
    if (match[2].toLowerCase() === "empty") {
      matchCount++;
      continue;
    }

    const color = match[3].toUpperCase();
    const pieceChar = match[4].toUpperCase();
    const key = color + pieceChar;
    const piece = pieceMap[key];
    if (!piece) continue;

    const file = squareName.charCodeAt(0) - 97; // a=0
    const rank = parseInt(squareName[1]) - 1; // 1=0, 8=7
    const boardRank = 7 - rank; // rank 8 -> index 0
    board[boardRank][file] = piece;
    matchCount++;
  }

  console.log("[chess-analyze] Parsed %d square classifications", matchCount);
  if (matchCount < 32) return null; // Need a reasonable number of squares classified

  // Convert board to FEN
  const fenRanks = board.map((row) => {
    let rankStr = "";
    let empty = 0;
    for (const sq of row) {
      if (sq === null) {
        empty++;
      } else {
        if (empty > 0) { rankStr += empty; empty = 0; }
        rankStr += sq;
      }
    }
    if (empty > 0) rankStr += empty;
    return rankStr;
  });

  return `${fenRanks.join("/")} ${turn} - - 0 1`;
}

async function extractFenFromImage(
  apiKey: string,
  base64Image: string,
  mimeType: string,
  perspective: string,
  turn: string,
): Promise<{ fen: string; rawResponse: string }> {
  // === Strategy 1: Square-by-square classification (preferred) ===
  // Crop the board, split into 64 squares, classify each one
  try {
    console.log("[chess-analyze] Attempting square-by-square classification");

    // Step 1: Detect and crop the board
    const cropResult = await cropBoardFromImage(apiKey, base64Image, mimeType);
    if (cropResult) {
      console.log("[chess-analyze] Board cropped successfully, splitting into 64 squares");

      // Step 2: Split into 64 square images
      const squareImages = await splitBoardIntoSquares(cropResult.croppedBase64);

      // Step 3: Classify all 64 squares in a single API call
      const { fen, rawResponse } = await classifySquares(
        apiKey,
        squareImages,
        perspective,
        turn,
      );

      // Validate the result
      const validFen = isValidFen(fen);
      const validKings = hasValidKings(fen);
      console.log("[chess-analyze] Square classification FEN: %s (validFen=%s validKings=%s)", fen, validFen, validKings);

      if (validFen && validKings) {
        return { fen, rawResponse: `--- Square Classification ---\n${rawResponse}` };
      }

      console.log("[chess-analyze] Square classification invalid, falling back. Raw:\n%s", rawResponse.slice(0, 500));
    } else {
      console.log("[chess-analyze] Board crop failed, falling back to multi-pass approach");
    }
  } catch (e) {
    console.log("[chess-analyze] Square classification failed:", e);
  }

  // === Strategy 2: Multi-pass piece-list consensus (fallback) ===
  const prompt = buildRecognitionPrompt(perspective);
  const imageData = { mime_type: mimeType, data: base64Image };
  const numPasses = 3;

  console.log("[chess-analyze] Falling back to %d parallel passes with Pro", numPasses);
  const passPromises = Array.from({ length: numPasses }, (_, i) =>
    callGemini(
      apiKey,
      GEMINI_PRO,
      [{ text: prompt }, { inline_data: imageData }],
      8192,
      "LOW",
    ).then((res) => {
      console.log("[chess-analyze] Pass %d done: finishReason=%s textLen=%d", i + 1, res.finishReason, res.text.length);
      return res;
    }),
  );

  const results = await Promise.all(passPromises);

  // Parse each response into a FEN
  const candidates: { fen: string; text: string; debug: string }[] = [];
  for (let i = 0; i < results.length; i++) {
    const res = results[i];
    if (!res.text) continue;
    const fen = parseResponse(res.text, perspective, turn);
    if (fen) {
      candidates.push({ fen, text: res.text, debug: res.debug });
      console.log("[chess-analyze] Pass %d FEN: %s", i + 1, fen.split(" ")[0]);
    } else {
      console.log("[chess-analyze] Pass %d: could not parse grid", i + 1);
    }
  }

  const allResponses = results
    .map((r, i) => `--- Pass ${i + 1} ---\n${r.debug}\n\nResponse:\n${r.text}`)
    .join("\n\n");

  if (candidates.length === 0) {
    const err = new Error(
      "Could not extract a valid FEN from any of the AI responses. Try a clearer image.",
    );
    (err as Error & { rawResponse: string }).rawResponse = allResponses;
    throw err;
  }

  // Pick best FEN by consensus: most common placement, then most pieces, then valid kings
  const candidatePlacements = candidates.map((c) => c.fen.split(" ")[0]);
  const freq = new Map<string, number>();
  for (const p of candidatePlacements) freq.set(p, (freq.get(p) ?? 0) + 1);

  // Sort candidates: highest frequency → most pieces → valid kings
  candidates.sort((a, b) => {
    const aPlacement = a.fen.split(" ")[0];
    const bPlacement = b.fen.split(" ")[0];
    const freqDiff = (freq.get(bPlacement) ?? 0) - (freq.get(aPlacement) ?? 0);
    if (freqDiff !== 0) return freqDiff;
    const validDiff = (hasValidKings(b.fen) ? 1 : 0) - (hasValidKings(a.fen) ? 1 : 0);
    if (validDiff !== 0) return validDiff;
    return countPieces(b.fen) - countPieces(a.fen);
  });

  const best = candidates[0];
  console.log("[chess-analyze] Selected FEN (freq=%d): %s", freq.get(best.fen.split(" ")[0]), best.fen);
  return { fen: best.fen, rawResponse: allResponses };
}

function describePieces(chess: Chess): { white: string[]; black: string[] } {
  const nameMap: Record<string, string> = {
    k: "King",
    q: "Queen",
    r: "Rook",
    b: "Bishop",
    n: "Knight",
    p: "Pawn",
  };

  const white: string[] = [];
  const black: string[] = [];

  const board = chess.board();
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const sq = board[rank][file];
      if (!sq) continue;
      const files = "abcdefgh";
      const square = `${files[file]}${8 - rank}`;
      const name = nameMap[sq.type] ?? sq.type;
      const entry = `${name} on ${square}`;

      if (sq.color === "w") white.push(entry);
      else black.push(entry);
    }
  }

  return { white, black };
}
