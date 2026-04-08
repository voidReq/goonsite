'use client'

import { useState } from 'react'

interface SkillsOverlayProps {
  visible: boolean
}

const SKILLS = [
  'TypeScript',
  'Rust',
  'Next.js',
  'WebGL',
  'GSAP / Canvas',
  'Go',
  'Python',
  'Linux / Docker',
]

export default function SkillsOverlay({ visible }: SkillsOverlayProps) {
  const [hoveredSkill, setHoveredSkill] = useState<string | null>(null)

  return (
    <div
      style={{
        position: 'fixed',
        right: '5vw',
        top: '50%',
        transform: visible
          ? 'translateY(-50%) translateX(0)'
          : 'translateY(-50%) translateX(30px)',
        opacity: visible ? 1 : 0,
        transition: 'all 0.7s ease',
        width: 'min(400px, 42vw)',
        pointerEvents: visible ? 'auto' : 'none',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        padding: '2rem',
        borderRight: '2px solid #FF3333',
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
          marginBottom: '1.25rem',
        }}
      >
        03 — SKILLS
      </div>

      {/* Skills list */}
      <div>
        {SKILLS.map((skill, index) => (
          <div
            key={skill}
            onMouseEnter={() => setHoveredSkill(skill)}
            onMouseLeave={() => setHoveredSkill(null)}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.5rem 0',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <span
              style={{
                fontFamily: "'Anton', sans-serif",
                color: hoveredSkill === skill ? '#FF3333' : '#FFFFFF',
                fontSize: 'clamp(1rem, 2.5vw, 1.8rem)',
                textTransform: 'lowercase',
                transition: 'color 0.2s ease',
              }}
            >
              {skill}
            </span>
            <span
              style={{
                fontFamily: "'Anton', sans-serif",
                color: '#FF3333',
                fontSize: '0.7rem',
                opacity: 0.6,
              }}
            >
              {String(index + 1).padStart(2, '0')}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
