"use client";
import { useRouter } from 'next/navigation'
import { useTypewriter, Cursor } from 'react-simple-typewriter'
import { SITE } from '@/lib/site'

// Inlined per module so the clean build's JS drops the goon-only branches; see lib/site.ts
const CLEAN = process.env.NEXT_PUBLIC_SITE_VARIANT === 'clean'

const GOON_WORDS = [
  'npm install goon-package',
  'npm start',
  'Gooning initialized...',
  'Welcome to the Gooniverse.',
  'Accessing goon-hub...',
  'Injecting goon-sploits...',
  'Hacking the goon-frame...',
  'Compiling goon-code...',
  'Running diagnostics...',
  'Establishing goonnection...',
  'Optimizing goon-flow...',
  'Analyzing goon-data...',
  'Preparing for launch...',
  'System check complete.',
  'Initiating goon-protocol...',
  'Synchronizing goon-nodes...',
  'Gooning session active.',
]

// Commands that work in the sitemap terminal this opens, so they double as a hint
const CLEAN_WORDS = [
  'cd projects # writeups & builds',
  'cd notes # networking, databases, security',
  'tree # map of the whole site',
  'help # list available commands',
  '# click to explore...',
]

export function Terminal({ fullWidth = false }: { fullWidth?: boolean }) {
  const router = useRouter()
  const [text] = useTypewriter({
    words: CLEAN ? CLEAN_WORDS : GOON_WORDS,
    loop: 1,
    typeSpeed: 70,
    deleteSpeed: 50,
    delaySpeed: 1000,
  })

  const hasHash = text.includes('#')
  const hashIndex = text.indexOf('#')
  const command = hasHash ? text.slice(0, hashIndex).trimEnd() : text
  const comment = hasHash ? text.slice(hashIndex + 1) : ''

  return (
    <div style={{ width: '100%', height: '100%', maxWidth: fullWidth ? 'none' : '600px' }}>
      <div className="terminal-titlebar">
        <span className="terminal-dot terminal-dot-red" style={{ backgroundColor: 'var(--site-red)' }} />
        <span className="terminal-dot terminal-dot-yellow" style={{ backgroundColor: 'var(--site-amber)' }} />
        <span
          className="terminal-dot terminal-dot-green"
          style={{ backgroundColor: 'var(--site-green)' }}
          onClick={(e) => { e.stopPropagation(); router.push(SITE.sitemapPath) }}
          title="Maximize"
        />
        <span className="ml-3 text-xs font-mono" style={{ color: 'var(--site-text-dim)' }}>{SITE.prompt}: ~</span>
        <span className="ml-auto text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--site-text-dim)' }}>sitemap</span>
      </div>
      <div className="p-4 sm:p-5 font-mono">
        {/* Command on the prompt line */}
        <div className="text-xs sm:text-sm flex items-center" style={{ color: 'var(--site-text)' }}>
          <span className="shrink-0 select-none mr-2">
            <span style={{ color: 'var(--site-purple)' }}>{SITE.prompt}</span>
            <span style={{ color: 'var(--site-cyan)' }}>:</span>
            <span style={{ color: 'var(--site-text)' }}>~</span>
            <span style={{ color: 'var(--site-cyan)' }}>$</span>
          </span>
          {command && (
            <span style={{ color: 'var(--site-text)' }}>
              {command}
            </span>
          )}
          {!hasHash && <Cursor cursorStyle="_" />}
        </div>

        {/* Comment line below */}
        <div className="text-xs mt-1.5 min-h-[1.25rem] flex items-center" style={{ color: 'var(--site-text-dim)' }}>
          {hasHash ? (
            <span>
              #{comment}
              <Cursor cursorStyle="_" />
            </span>
          ) : (
            <span className="invisible select-none">&nbsp;</span>
          )}
        </div>
      </div>
    </div>
  )
}
