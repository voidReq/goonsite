'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Loader from './Loader'
import Nav from './Nav'
import HeroOverlay from './overlays/HeroOverlay'
import AboutOverlay from './overlays/AboutOverlay'
import WorkOverlay from './overlays/WorkOverlay'
import SkillsOverlay from './overlays/SkillsOverlay'
import ContactOverlay from './overlays/ContactOverlay'

const Scene = dynamic(() => import('./Scene'), { ssr: false })

export default function Main() {
  const [scrollProgress, setScrollProgress] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [loaderVisible, setLoaderVisible] = useState(true)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      setScrollProgress(Math.max(0, Math.min(1, window.scrollY / max)))
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLoaderComplete = () => {
    setLoaderVisible(false)
    setLoaded(true)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Anton&family=Playfair+Display:ital,wght@0,700;1,700&family=DM+Sans:wght@400;500&display=swap');

        :root {
          --color-bg: #000000;
          --color-accent: #FF3333;
          --color-text: #FFFFFF;
          --color-muted: rgba(255,255,255,0.5);
        }

        body {
          background: #000;
          overflow-x: hidden;
        }

        html {
          background: #000;
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        ::selection {
          background: rgba(255, 51, 51, 0.3);
          color: #FFFFFF;
        }

        ::-webkit-scrollbar {
          width: 4px;
        }

        ::-webkit-scrollbar-track {
          background: #000;
        }

        ::-webkit-scrollbar-thumb {
          background: #FF3333;
          border-radius: 2px;
        }
      `}</style>

      {/* Scroll progress indicator */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '2px',
          width: `${scrollProgress * 100}%`,
          background: '#FF3333',
          zIndex: 100,
          transition: 'width 0.1s linear',
          pointerEvents: 'none',
        }}
      />

      {loaderVisible && <Loader onComplete={handleLoaderComplete} />}

      {/* 3D Canvas - fixed, full screen */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 1 }}>
        <Scene scrollProgress={scrollProgress} />
      </div>

      {/* Scroll container - tall, transparent, captures scroll */}
      <div
        ref={scrollContainerRef}
        style={{
          height: '600vh',
          position: 'relative',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />

      {/* Overlays - fixed, z-index 3 */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 3,
          pointerEvents: 'none',
        }}
      >
        <Nav />
        <HeroOverlay visible={scrollProgress < 0.18} loaded={loaded} />
        <AboutOverlay visible={scrollProgress >= 0.15 && scrollProgress < 0.42} />
        <WorkOverlay visible={scrollProgress >= 0.38 && scrollProgress < 0.68} />
        <SkillsOverlay visible={scrollProgress >= 0.63 && scrollProgress < 0.88} />
        <ContactOverlay visible={scrollProgress >= 0.83} />
      </div>
    </>
  )
}
