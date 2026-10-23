
"use client";
import Link from 'next/link';
import { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { SITE, NUAUTO_URL } from '@/lib/site';

interface TreeEntry {
  href: string;
  name: string;
  color?: string;
  children?: TreeEntry[];
}

// Inlined per module so the clean build's JS drops the goon-only entries; see lib/site.ts
const CLEAN = process.env.NEXT_PUBLIC_SITE_VARIANT === 'clean';

const siteTree: TreeEntry[] = [
  { href: '/', name: 'home', color: '#9ece6a' },
  ...(CLEAN ? [] : [{
    href: '/goon-hub', name: 'goon-hub/', color: '#bb9af7',
    children: [
      { href: '/goon-sploit', name: 'goon-sploit', color: '#f7768e' },
    ],
  }]),
  { href: '/macbook', name: 'macbook', color: '#7dcfff' },
  ...(CLEAN ? [] : [{ href: '/message-board', name: 'message-board', color: '#e0af68' }]),
  { href: '/notes', name: 'notes/', color: '#bb9af7' },
  { href: '/projects', name: 'projects/', color: '#7dcfff' },
  CLEAN ? {
    href: '/about', name: 'about/', color: '#e0af68',
    children: [
      { href: NUAUTO_URL, name: 'nuauto', color: '#bb9af7' },
    ],
  } : {
    href: '/tools/encode', name: 'tools/', color: '#f7768e',
    children: [
      { href: '/tools/encode', name: 'encode-hash', color: '#9ece6a' },
      { href: NUAUTO_URL, name: 'nuauto', color: '#bb9af7' },
    ],
  },
  { href: '/revolutions', name: 'revolutions', color: '#ff9e64' },
];

const isExternal = (href: string) => /^https?:\/\//.test(href);

// Flatten tree into lookups — supports both bare names and parent/child paths
function flattenTree(entries: TreeEntry[], parentPath = ''): { name: string; path: string; href: string }[] {
  const result: { name: string; path: string; href: string }[] = [];
  for (const entry of entries) {
    const bare = entry.name.replace(/\/$/, '');
    const fullPath = parentPath ? `${parentPath}/${bare}` : bare;
    result.push({ name: bare, path: fullPath, href: entry.href });
    if (entry.children) {
      result.push(...flattenTree(entry.children, bare));
    }
  }
  return result;
}

const allPages = flattenTree(siteTree);

function TreeLines({ entries, depth = 0, parentPrefixes = [], onNavigate }: { entries: TreeEntry[]; depth?: number; parentPrefixes?: string[]; onNavigate?: () => void }) {
  return (
    <>
      {entries.map((entry, i) => {
        const isLast = i === entries.length - 1;
        const prefix = isLast ? '└── ' : '├── ';
        const continuation = isLast ? '    ' : '│   ';

        return (
          <div key={entry.href}>
            <div className="leading-relaxed">
              <span className="text-[var(--site-text-dim)] select-none">
                {parentPrefixes.join('')}{prefix}
              </span>
              <Link
                href={entry.href}
                className="hover:underline transition-colors"
                style={{ color: entry.color || 'var(--site-text)' }}
                onClick={onNavigate}
                {...(isExternal(entry.href) && { target: '_blank', rel: 'noopener noreferrer' })}
              >
                {entry.name}
              </Link>
              {isExternal(entry.href) && <span className="text-[var(--site-text-dim)] select-none"> ↗</span>}
            </div>
            {entry.children && (
              <TreeLines entries={entry.children} depth={depth + 1} parentPrefixes={[...parentPrefixes, continuation]} onNavigate={onNavigate} />
            )}
          </div>
        );
      })}
    </>
  );
}

interface HistoryLine {
  type: 'command' | 'output' | 'error';
  text: string;
}

function Prompt() {
  return (
    <>
      <span style={{ color: '#bb9af7' }}>{SITE.prompt}</span>
      <span style={{ color: '#7dcfff' }}>:</span>
      <span style={{ color: 'var(--site-text)' }}>~</span>
      <span style={{ color: '#7dcfff' }}>$&nbsp; </span>
    </>
  );
}

/**
 * The interactive sitemap terminal. Rendered full-size on the sitemap page, and
 * as a popup from the home page's mini-terminal (`popup`), where following a
 * link or `cd` also calls `onClose`.
 */
export default function SiteMapTerminal({ popup = false, onClose }: { popup?: boolean; onClose?: () => void }) {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<HistoryLine[]>([]);
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [ghost, setGhost] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const termBodyRef = useRef<HTMLDivElement>(null);

  // Scroll terminal body to bottom when history changes (skip initial mount)
  const hasInteracted = useRef(false);
  useEffect(() => {
    if (!hasInteracted.current) {
      hasInteracted.current = history.length > 0;
      return;
    }
    const el = termBodyRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [history]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Compute tab-completion ghost text — matches bare names and parent/child paths
  const updateGhost = useCallback((value: string) => {
    const trimmed = value.trimStart();
    const cdMatch = trimmed.match(/^cd\s+(.+)/i);
    if (cdMatch) {
      const partial = cdMatch[1].replace(/^\//, '').toLowerCase();
      if (partial.length > 0) {
        // Try path match first (e.g. "tools/enc" → "tools/encode-hash"), then bare name
        const match = allPages.find(p => p.path.toLowerCase().startsWith(partial) && p.path.toLowerCase() !== partial)
          || allPages.find(p => p.name.toLowerCase().startsWith(partial) && p.name.toLowerCase() !== partial);
        if (match) {
          // Use whichever matched — path or name
          const matchStr = match.path.toLowerCase().startsWith(partial) ? match.path : match.name;
          setGhost(matchStr.slice(partial.length));
          return;
        }
      }
    }
    setGhost('');
  }, []);

  const handleInputChange = (value: string) => {
    setInput(value);
    setHistoryIndex(-1);
    updateGhost(value);
  };

  // Resolve cd target — supports bare names (e.g. "notes") and paths (e.g. "tools/encode-hash", "goon-hub/goon-sploit")
  const resolveTarget = (arg: string): { href: string; name: string } | null => {
    const clean = arg.replace(/^\//, '').replace(/\/$/, '').toLowerCase();
    // Match full path first, then bare name
    const byPath = allPages.find(p => p.path.toLowerCase() === clean);
    if (byPath) return byPath;
    return allPages.find(p => p.name.toLowerCase() === clean) || null;
  };

  const go = (href: string) => {
    setTimeout(() => {
      onClose?.();
      if (isExternal(href)) window.open(href, '_blank', 'noopener,noreferrer');
      else router.push(href);
    }, 400);
  };

  const executeCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    // Save to command history
    setCmdHistory(prev => [trimmed, ...prev]);
    setHistoryIndex(-1);

    // Add command line to visual history
    setHistory(prev => [...prev, { type: 'command', text: trimmed }]);

    const parts = trimmed.split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1).join(' ');

    if (command === 'cd') {
      if (!args || args === '~' || args === '/' || args === 'home') {
        setHistory(prev => [...prev, { type: 'output', text: 'Navigating to ~/' }]);
        go('/');
      } else if (args === '..') {
        setHistory(prev => [...prev, { type: 'output', text: 'Navigating to ~/' }]);
        go('/');
      } else {
        const target = resolveTarget(args);
        if (target) {
          setHistory(prev => [...prev, { type: 'output', text: `Navigating to ${target.href}` }]);
          go(target.href);
        } else {
          setHistory(prev => [...prev, { type: 'error', text: `cd: no such directory: ${args}` }]);
        }
      }
    } else if (command === 'ls') {
      const paths = allPages.map(p => p.path);
      setHistory(prev => [...prev, { type: 'output', text: paths.join('  ') }]);
    } else if (command === 'tree') {
      setHistory(prev => [...prev, { type: 'output', text: '__tree__' }]);
    } else if (command === 'pwd') {
      setHistory(prev => [...prev, { type: 'output', text: `${SITE.home}/sitemap` }]);
    } else if (command === 'help') {
      setHistory(prev => [...prev, {
        type: 'output',
        text: 'Available commands:\n  cd <dir>     Navigate to a page (tab to autocomplete)\n  cd ..        Go back home\n  cd ~         Go home\n  ls           List all pages\n  tree         Show the sitemap tree\n  pwd          Print working directory\n  clear        Clear the terminal\n  help         Show this message'
      }]);
    } else if (command === 'clear') {
      setHistory([]);
    } else {
      setHistory(prev => [...prev, { type: 'error', text: `command not found: ${command}. Type 'help' for available commands.` }]);
    }

    setInput('');
    setGhost('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      if (ghost) {
        const newValue = input + ghost;
        setInput(newValue);
        setGhost('');
      }
    } else if (e.key === 'Enter') {
      executeCommand(input);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (cmdHistory.length > 0) {
        const newIndex = Math.min(historyIndex + 1, cmdHistory.length - 1);
        setHistoryIndex(newIndex);
        const cmd = cmdHistory[newIndex];
        setInput(cmd);
        updateGhost(cmd);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        const cmd = cmdHistory[newIndex];
        setInput(cmd);
        updateGhost(cmd);
      } else {
        setHistoryIndex(-1);
        setInput('');
        setGhost('');
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setHistory([]);
    }
  };

  return (
    <div className="w-full flex flex-col" style={{ maxHeight: popup ? 'min(80dvh, 720px)' : 'calc(100dvh - 5rem)' }}>
      {/* Terminal window */}
      <div
        className="terminal-window cursor-text flex flex-col min-h-0"
        onClick={() => inputRef.current?.focus()}
      >

        {/* Title bar */}
        <div className="terminal-titlebar shrink-0">
          {popup ? (
            <>
              <button type="button" aria-label="Close" onClick={onClose} className="terminal-dot terminal-dot-red p-0 border-0 cursor-pointer" style={{ backgroundColor: '#f7768e' }} />
              <span className="terminal-dot" style={{ backgroundColor: '#e0af68' }} />
              <button type="button" aria-label="Open the full sitemap page" title="Maximize" onClick={() => { onClose?.(); router.push(SITE.sitemapPath); }} className="terminal-dot terminal-dot-green p-0 border-0" style={{ backgroundColor: '#9ece6a' }} />
            </>
          ) : (
            <>
              <span className="terminal-dot" style={{ backgroundColor: '#f7768e' }} />
              <span className="terminal-dot" style={{ backgroundColor: '#e0af68' }} />
              <span className="terminal-dot" style={{ backgroundColor: '#9ece6a' }} />
            </>
          )}
          <span className="ml-3 text-xs font-mono" style={{ color: 'var(--site-text-dim)' }}>{SITE.prompt}: ~/sitemap</span>
        </div>

        {/* Terminal body */}
        <div ref={termBodyRef} className={`font-mono flex-1 min-h-0 overflow-y-auto ${popup ? 'p-4 md:p-6 text-sm md:text-base' : 'p-4 md:p-6 lg:p-8 text-sm md:text-base lg:text-lg'}`}>

          {/* Initial tree output */}
          <div className="mb-2">
            <Prompt />
            <span style={{ color: 'var(--site-text)' }}>tree --sitemap</span>
          </div>
          <TreeLines entries={siteTree} onNavigate={onClose} />
          <div className="mt-3 mb-1 text-[var(--site-text-dim)] text-xs md:text-sm">
            {siteTree.length} directories, {siteTree.reduce((acc, e) => acc + (e.children?.length || 0), 0)} subdirectories
          </div>

          {/* Command history */}
          {history.map((line, i) => (
            <div key={i}>
              {line.type === 'command' ? (
                <div className="mt-3">
                  <Prompt />
                  <span style={{ color: 'var(--site-text)' }}>{line.text}</span>
                </div>
              ) : line.type === 'error' ? (
                <div style={{ color: '#f7768e' }} className="whitespace-pre-wrap">{line.text}</div>
              ) : line.text === '__tree__' ? (
                <div className="mt-2">
                  <TreeLines entries={siteTree} onNavigate={onClose} />
                  <div className="mt-1 text-[var(--site-text-dim)] text-xs md:text-sm">
                    {siteTree.length} directories, {siteTree.reduce((acc, e) => acc + (e.children?.length || 0), 0)} subdirectories
                  </div>
                </div>
              ) : (
                <div style={{ color: '#9ece6a' }} className="whitespace-pre-wrap">{line.text}</div>
              )}
            </div>
          ))}

          {/* Active input line */}
          <div className="mt-3 flex items-center">
            <Prompt />
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                data-autofocus
                className="bg-transparent outline-none border-none w-full caret-[var(--site-text)]"
                style={{ color: 'var(--site-text)', fontFamily: 'inherit', fontSize: 'inherit' }}
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                autoComplete="off"
              />
              {/* Ghost autocomplete overlay */}
              {ghost && (
                <div
                  className="absolute top-0 left-0 pointer-events-none whitespace-pre"
                  style={{ color: 'var(--site-text-dim)', fontFamily: 'inherit', fontSize: 'inherit' }}
                  aria-hidden
                >
                  <span className="invisible">{input}</span>
                  <span>{ghost}</span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Hint */}
      <div className="mt-3 shrink-0 text-center text-xs font-mono text-white/20">
        type <span className="text-white/35">help</span> for commands · <span className="text-white/35">tab</span> to autocomplete
      </div>
    </div>
  );
}
