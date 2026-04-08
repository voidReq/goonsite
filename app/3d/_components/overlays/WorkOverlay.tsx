'use client'

import { useState } from 'react'

interface WorkOverlayProps {
  visible: boolean
}

const PROJECTS = [
  { id: '01', title: 'GoonSite',      tags: ['Next.js', 'TypeScript'], year: '2025' },
  { id: '02', title: 'Turtle Engine', tags: ['Rust', 'WebAssembly'],   year: '2024' },
  { id: '03', title: 'RevEngine',     tags: ['WebGL', 'Three.js'],     year: '2024' },
  { id: '04', title: 'SysMonitor',    tags: ['Go', 'Terminal UI'],     year: '2023' },
]

export default function WorkOverlay({ visible }: WorkOverlayProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: visible ? 'translate(-50%, -50%)' : 'translate(-50%, -40%)',
        opacity: visible ? 1 : 0,
        transition: 'all 0.7s ease',
        width: 'min(700px, 90vw)',
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      {/* Header */}
      <div
        style={{
          fontFamily: "'Anton', sans-serif",
          color: '#FF3333',
          fontSize: '0.75rem',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          marginBottom: '1.5rem',
        }}
      >
        02 — SELECTED WORK
      </div>

      {/* Project list */}
      <div>
        {PROJECTS.map((project) => (
          <div
            key={project.id}
            onMouseEnter={() => setHoveredId(project.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem 1.5rem',
              background: hoveredId === project.id
                ? 'rgba(255,51,51,0.08)'
                : 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              cursor: 'pointer',
              transition: 'background 0.2s ease',
            }}
          >
            {/* Project ID */}
            <div
              style={{
                fontFamily: "'Anton', sans-serif",
                color: '#FF3333',
                fontSize: '1.2rem',
                minWidth: '3rem',
              }}
            >
              {project.id}
            </div>

            {/* Title */}
            <div
              style={{
                fontFamily: "'Playfair Display', serif",
                fontStyle: 'italic',
                fontWeight: 700,
                color: '#FFFFFF',
                fontSize: 'clamp(1.2rem, 3vw, 2.5rem)',
                flex: 1,
                paddingLeft: '1.5rem',
              }}
            >
              {project.title}
            </div>

            {/* Tags + year */}
            <div
              style={{
                textAlign: 'right',
                minWidth: '8rem',
              }}
            >
              <div
                style={{
                  fontFamily: "'Anton', sans-serif",
                  fontSize: '0.7rem',
                  color: 'rgba(255,255,255,0.5)',
                  letterSpacing: '0.05em',
                }}
              >
                {project.tags.join(' / ')}
              </div>
              <div
                style={{
                  fontFamily: "'Anton', sans-serif",
                  fontSize: '0.65rem',
                  color: 'rgba(255,255,255,0.3)',
                  marginTop: '0.2rem',
                }}
              >
                {project.year}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
