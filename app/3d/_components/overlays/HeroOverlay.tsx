'use client'

import { useEffect, useRef } from 'react'

interface HeroOverlayProps {
  visible: boolean
  loaded: boolean
}

export default function HeroOverlay({ visible, loaded }: HeroOverlayProps) {
  const line1Ref = useRef<HTMLDivElement>(null)
  const line2Ref = useRef<HTMLDivElement>(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (!loaded || hasAnimated.current) return
    hasAnimated.current = true

    const animate = async () => {
      const gsap = (await import('gsap')).default

      const targets = [line1Ref.current, line2Ref.current].filter(Boolean)
      gsap.fromTo(
        targets,
        { yPercent: 120, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 1,
          ease: 'power3.out',
          stagger: 0.05,
        }
      )
    }

    animate()
  }, [loaded])

  return (
    <>
      <style>{`
        @keyframes scrollPulse {
          0%, 100% { opacity: 0.4; transform: scaleY(1); }
          50% { opacity: 1; transform: scaleY(1.15); }
        }
      `}</style>

      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.8s ease',
        }}
      >
        {/* Main hero text */}
        <div
          style={{
            paddingLeft: '8vw',
            paddingTop: '28vh',
            overflow: 'hidden',
          }}
        >
          {/* Overflow clip for line 1 */}
          <div style={{ overflow: 'hidden' }}>
            <div
              ref={line1Ref}
              style={{
                fontFamily: "'Playfair Display', serif",
                fontStyle: 'italic',
                fontWeight: 700,
                fontSize: 'clamp(5rem, 13vw, 13rem)',
                color: '#FFFFFF',
                lineHeight: 0.9,
                opacity: loaded ? undefined : 0,
              }}
            >
              void
            </div>
          </div>

          {/* Overflow clip for line 2 */}
          <div style={{ overflow: 'hidden' }}>
            <div
              ref={line2Ref}
              style={{
                fontFamily: "'Playfair Display', serif",
                fontStyle: 'italic',
                fontWeight: 700,
                fontSize: 'clamp(5rem, 13vw, 13rem)',
                color: '#FFFFFF',
                lineHeight: 0.9,
                opacity: loaded ? undefined : 0,
              }}
            >
              Req
            </div>
          </div>

          {/* Tagline */}
          <div
            style={{
              fontFamily: "'Anton', sans-serif",
              color: '#FF3333',
              fontSize: 'clamp(1rem, 2vw, 2rem)',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              marginTop: '1.5rem',
            }}
          >
            Creative Developer &amp; Systems Engineer
          </div>

          {/* Sub */}
          <div
            style={{
              fontFamily: "'DM Sans', sans-serif",
              color: 'rgba(255,255,255,0.4)',
              fontSize: '0.9rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              marginTop: '3rem',
            }}
          >
            Scroll to explore
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          style={{
            position: 'absolute',
            bottom: '5vh',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <div
            style={{
              width: '2px',
              height: '60px',
              background: '#FF3333',
              animation: 'scrollPulse 1.8s ease-in-out infinite',
              transformOrigin: 'top',
            }}
          />
          <span
            style={{
              fontFamily: "'Anton', sans-serif",
              fontSize: '0.65rem',
              color: '#FF3333',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              opacity: 0.7,
            }}
          >
            SCROLL
          </span>
        </div>
      </div>
    </>
  )
}
