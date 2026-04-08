'use client'

import { useState } from 'react'

interface ContactOverlayProps {
  visible: boolean
}

const SOCIAL_LINKS = ['GitHub', 'Twitter', 'LinkedIn']

export default function ContactOverlay({ visible }: ContactOverlayProps) {
  const [hoveredEmail, setHoveredEmail] = useState(false)
  const [hoveredSocial, setHoveredSocial] = useState<string | null>(null)

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '10vh',
        left: '50%',
        transform: visible ? 'translate(-50%, 0)' : 'translate(-50%, 20px)',
        opacity: visible ? 1 : 0,
        transition: 'all 0.7s ease',
        textAlign: 'center',
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      {/* Background section number */}
      <div
        style={{
          position: 'absolute',
          top: '-8rem',
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: "'Anton', sans-serif",
          fontSize: 'clamp(6rem, 15vw, 12rem)',
          color: 'rgba(255,255,255,0.1)',
          lineHeight: 1,
          zIndex: -1,
          userSelect: 'none',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        04
      </div>

      {/* "LET'S" */}
      <div
        style={{
          fontFamily: "'Playfair Display', serif",
          fontStyle: 'italic',
          fontWeight: 700,
          color: '#FFFFFF',
          fontSize: 'clamp(3rem, 8vw, 8rem)',
          lineHeight: 0.9,
        }}
      >
        LET&apos;S
      </div>

      {/* "WORK TOGETHER" */}
      <div
        style={{
          fontFamily: "'Anton', sans-serif",
          color: '#FF3333',
          fontSize: 'clamp(2.5rem, 7vw, 7rem)',
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}
      >
        WORK TOGETHER
      </div>

      {/* Email */}
      <a
        href="mailto:hello@voidreq.dev"
        onMouseEnter={() => setHoveredEmail(true)}
        onMouseLeave={() => setHoveredEmail(false)}
        style={{
          display: 'block',
          fontFamily: "'Anton', sans-serif",
          color: hoveredEmail ? '#FF3333' : '#FFFFFF',
          fontSize: '1.2rem',
          letterSpacing: '0.1em',
          textDecoration: 'none',
          marginTop: '2rem',
          transition: 'color 0.2s ease',
        }}
      >
        hello@voidreq.dev
      </a>

      {/* Social links */}
      <div
        style={{
          display: 'flex',
          gap: '2rem',
          justifyContent: 'center',
          marginTop: '1.5rem',
        }}
      >
        {SOCIAL_LINKS.map((social) => (
          <a
            key={social}
            href="#"
            onMouseEnter={() => setHoveredSocial(social)}
            onMouseLeave={() => setHoveredSocial(null)}
            style={{
              fontFamily: "'Anton', sans-serif",
              fontSize: '0.85rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: hoveredSocial === social ? '#FF3333' : 'rgba(255,255,255,0.5)',
              textDecoration: 'none',
              transition: 'color 0.2s ease',
            }}
          >
            {social}
          </a>
        ))}
      </div>

      {/* Copyright */}
      <div
        style={{
          fontFamily: "'DM Sans', sans-serif",
          color: 'rgba(255,255,255,0.3)',
          fontSize: '0.75rem',
          marginTop: '2rem',
        }}
      >
        &copy; 2025 voidReq
      </div>
    </div>
  )
}
