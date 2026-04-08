'use client'

interface AboutOverlayProps {
  visible: boolean
}

const STATS = [
  { value: '8+', label: 'YEARS' },
  { value: '50+', label: 'PROJECTS' },
  { value: '∞', label: 'COFFEE' },
]

export default function AboutOverlay({ visible }: AboutOverlayProps) {
  return (
    <div
      style={{
        position: 'fixed',
        left: '5vw',
        top: '50%',
        transform: visible ? 'translateY(-50%) translateX(0)' : 'translateY(-50%) translateX(-30px)',
        width: 'min(500px, 45vw)',
        opacity: visible ? 1 : 0,
        transition: 'all 0.7s ease',
        pointerEvents: visible ? 'auto' : 'none',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        padding: '2.5rem',
        borderLeft: '2px solid #FF3333',
      }}
    >
      {/* Section label */}
      <div
        style={{
          fontFamily: "'Anton', sans-serif",
          color: '#FF3333',
          fontSize: '0.75rem',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
        }}
      >
        01 — ABOUT
      </div>

      {/* Name */}
      <div
        style={{
          fontFamily: "'Playfair Display', serif",
          fontStyle: 'italic',
          fontWeight: 700,
          color: '#FFFFFF',
          fontSize: 'clamp(2rem, 4vw, 4rem)',
          margin: '1rem 0 0.5rem',
          lineHeight: 1,
        }}
      >
        voidReq
      </div>

      {/* Bio */}
      <p
        style={{
          fontFamily: "'DM Sans', sans-serif",
          color: 'rgba(255,255,255,0.8)',
          fontSize: '1rem',
          lineHeight: 1.7,
        }}
      >
        Systems developer and creative technologist. I build interactive experiences at the intersection of code, animation, and design. Previously deep in game engines and embedded systems, now obsessed with the web as a creative medium.
      </p>

      {/* Stats */}
      <div
        style={{
          display: 'flex',
          gap: '3rem',
          marginTop: '1.5rem',
        }}
      >
        {STATS.map((stat) => (
          <div key={stat.label}>
            <div
              style={{
                fontFamily: "'Anton', sans-serif",
                color: '#FF3333',
                fontSize: 'clamp(2rem, 3.5vw, 3.5rem)',
                lineHeight: 1,
              }}
            >
              {stat.value}
            </div>
            <div
              style={{
                fontFamily: "'DM Sans', sans-serif",
                color: 'rgba(255,255,255,0.5)',
                fontSize: '0.8rem',
                letterSpacing: '0.1em',
                marginTop: '0.25rem',
              }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
