import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const MESSAGES_DIR = join(process.cwd(), 'data', 'messages');
const PENDING_FILE = join(MESSAGES_DIR, 'pending.json');
const APPROVED_FILE = join(MESSAGES_DIR, 'approved.json');

/** Ensure the data/messages directory exists */
function ensureDir() {
  if (!existsSync(MESSAGES_DIR)) {
    mkdirSync(MESSAGES_DIR, { recursive: true });
  }
}

export type GameType = 'tictactoe' | 'connect4' | 'chess';

export const VALID_GAMES: GameType[] = ['tictactoe', 'connect4', 'chess'];

export interface Message {
  id: string;
  text: string;
  author: string;
  timestamp: string;
  ip: string;
  game?: GameType;
}

function readJson(filePath: string): Message[] {
  if (!existsSync(filePath)) return [];
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch {
    return [];
  }
}

function writeJson(filePath: string, data: Message[]) {
  ensureDir();
  writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export function getPendingMessages(): Message[] {
  return readJson(PENDING_FILE);
}

export function getApprovedMessages(): Omit<Message, 'ip'>[] {
  return readJson(APPROVED_FILE).map(({ ip: _, ...rest }) => rest);
}

export function addPendingMessage(msg: Message) {
  const pending = readJson(PENDING_FILE);
  pending.push(msg);
  writeJson(PENDING_FILE, pending);
}

export function approveMessage(id: string): boolean {
  const pending = readJson(PENDING_FILE);
  const idx = pending.findIndex((m) => m.id === id);
  if (idx === -1) return false;

  const [msg] = pending.splice(idx, 1);
  writeJson(PENDING_FILE, pending);

  const approved = readJson(APPROVED_FILE);
  approved.push(msg);
  writeJson(APPROVED_FILE, approved);
  return true;
}

export function denyMessage(id: string): boolean {
  const pending = readJson(PENDING_FILE);
  const idx = pending.findIndex((m) => m.id === id);
  if (idx === -1) return false;

  pending.splice(idx, 1);
  writeJson(PENDING_FILE, pending);
  return true;
}

/**
 * Sanitize user input: strip HTML tags, trim whitespace, collapse runs of whitespace.
 */
export function sanitizeText(input: string): string {
  return input
    .replace(/<[^>]*>/g, '')       // strip HTML tags
    .replace(/\s+/g, ' ')          // collapse whitespace
    .trim();
}

/**
 * Validate message text: must be non-empty string, 150 words or fewer, no script injection.
 */
export function validateMessage(text: unknown): { valid: boolean; error?: string } {
  if (typeof text !== 'string') {
    return { valid: false, error: 'Message must be a string.' };
  }

  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Message cannot be empty.' };
  }

  if (trimmed.length > 5000) {
    return { valid: false, error: 'Message is too long.' };
  }

  const wordCount = trimmed.split(/\s+/).length;
  if (wordCount > 150) {
    return { valid: false, error: `Message exceeds 150 word limit (${wordCount} words).` };
  }

  return { valid: true };
}

export function validateAuthor(author: unknown): { valid: boolean; error?: string } {
  if (typeof author !== 'string') {
    return { valid: false, error: 'Author must be a string.' };
  }

  const trimmed = author.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Author name cannot be empty.' };
  }

  if (trimmed.length > 50) {
    return { valid: false, error: 'Author name must be 50 characters or less.' };
  }

  return { valid: true };
}
