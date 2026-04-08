'use client'

import { useEffect, useState } from 'react'

const NAV_LINKS = ['work', 'about', 'skills', 'contact']

export default function Nav() {
  const [visible, setVisible] = useState(false)
  const [hoveredLink, setHoveredLink] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 1500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        pointerEvents: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '60px',
        paddingLeft: '2rem',
        paddingRight: '2rem',
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255,51,51,0.2)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(-10px)',
        transition: 'opacity 0.6s ease, transform 0.6s ease',
      }}
    >
      <a
        href="/3d"
        style={{
          fontFamily: "'Anton', sans-serif",
          fontSize: '1.4rem',
          color: '#FF3333',
          textDecoration: 'none',
          letterSpacing: '0.05em',
        }}
      >
        VR
      </a>

      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
        {NAV_LINKS.map((link) => (
          <a
            key={link}
            href={`#section-${link}`}
            onMouseEnter={() => setHoveredLink(link)}
            onMouseLeave={() => setHoveredLink(null)}
            style={{
              fontFamily: "'Anton', sans-serif",
              fontSize: '0.8rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              color: hoveredLink === link ? '#FF3333' : 'rgba(255,255,255,0.8)',
              transition: 'color 0.2s ease',
            }}
          >
            {link}
          </a>
        ))}
      </div>
    </nav>
  )
}
