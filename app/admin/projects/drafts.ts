export interface Draft {
  id: string;
  dir: string;
  filename: string;
  title: string;
  description: string;
  body: string;
  useNewDir: boolean;
  updatedAt: number;
}

const STORAGE_KEY = 'goonsite:projects-drafts:v1';
const MAX_DRAFTS = 50;

function readStore(): Record<string, Draft> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return {};
    return parsed as Record<string, Draft>;
  } catch {
    return {};
  }
}

function writeStore(store: Record<string, Draft>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // quota exceeded — drop oldest until it fits
    const sorted = Object.values(store).sort((a, b) => a.updatedAt - b.updatedAt);
    while (sorted.length > 0) {
      sorted.shift();
      const next: Record<string, Draft> = {};
      for (const d of sorted) next[d.id] = d;
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return;
      } catch {
        continue;
      }
    }
  }
}

export function loadAllDrafts(): Draft[] {
  const store = readStore();
  return Object.values(store).sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getDraft(id: string): Draft | null {
  const store = readStore();
  return store[id] ?? null;
}

export function saveDraft(draft: Draft): void {
  const store = readStore();
  store[draft.id] = draft;
  const all = Object.values(store).sort((a, b) => b.updatedAt - a.updatedAt);
  if (all.length > MAX_DRAFTS) {
    const trimmed: Record<string, Draft> = {};
    for (const d of all.slice(0, MAX_DRAFTS)) trimmed[d.id] = d;
    writeStore(trimmed);
  } else {
    writeStore(store);
  }
}

export function deleteDraft(id: string): void {
  const store = readStore();
  if (!(id in store)) return;
  delete store[id];
  writeStore(store);
}

export function newDraftId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function timeAgo(ts: number, now: number = Date.now()): string {
  const diff = Math.max(0, now - ts);
  if (diff < 5_000) return 'just now';
  if (diff < 60_000) return `${Math.floor(diff / 1_000)}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(ts).toLocaleDateString();
}
