"use client";
import { useRouter } from 'next/navigation'
import { Typewriter } from 'react-simple-typewriter'
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

const CLEAN_WORDS = [
  'whoami',
  'james',
  'ls ~',
  'notes/  projects/  tools/',
  'cat README.md',
  'Security notes, vulnerability writeups & projects.',
  'Running diagnostics...',
  'System check complete.',
  'Welcome.',
]

export function Terminal({ fullWidth = false }: { fullWidth?: boolean }) {
  const router = useRouter()

  return (
    <div style={{ width: '100%', height: '100%', maxWidth: fullWidth ? 'none' : '600px' }}>
      <div className="terminal-titlebar">
        <span className="terminal-dot terminal-dot-red" style={{ backgroundColor: 'var(--site-red)' }} />
        <span className="terminal-dot terminal-dot-yellow" style={{ backgroundColor: 'var(--site-amber)' }} />
        <span
          className="terminal-dot terminal-dot-green"
          style={{ backgroundColor: 'var(--site-green)' }}
          onClick={() => router.push(SITE.sitemapPath)}
          title="Maximize"
        />
        <span className="ml-3 text-xs font-mono" style={{ color: 'var(--site-text-dim)' }}>{SITE.prompt}: ~</span>
      </div>
      <div className="p-5" style={{ color: '#a9b1d6' }}>
        <div style={{ marginBottom: '10px' }}>
          <span style={{ color: 'var(--site-purple)' }}>{SITE.prompt}</span>
          <span style={{ color: 'var(--site-cyan)' }}>:</span>
          <span style={{ color: 'var(--site-text)' }}>~</span>
          <span style={{ color: 'var(--site-cyan)' }}>$</span>
        </div>
        <div>
          <Typewriter
            words={CLEAN ? CLEAN_WORDS : GOON_WORDS}
            loop={1}
            cursor
            cursorStyle='_'
            typeSpeed={70}
            deleteSpeed={50}
            delaySpeed={1000}
          />
        </div>
      </div>
    </div>
  )
}
