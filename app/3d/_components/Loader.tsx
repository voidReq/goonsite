'use client'

import { useEffect, useRef } from 'react'

interface LoaderProps {
  onComplete: () => void
}

export default function Loader({ onComplete }: LoaderProps) {
  const countRef = useRef<HTMLSpanElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let tweenObj = { value: 0 }
    let gsapInstance: typeof import('gsap').default | null = null
    let completed = false

    const init = async () => {
      const gsap = (await import('gsap')).default
      gsapInstance = gsap

      gsap.to(tweenObj, {
        value: 100,
        duration: 2,
        ease: 'power2.inOut',
        onUpdate: () => {
          const rounded = Math.round(tweenObj.value)
          if (countRef.current) {
            countRef.current.textContent = String(rounded).padStart(3, '0')
          }
        },
        onComplete: () => {
          if (completed) return
          completed = true
          setTimeout(() => {
            if (containerRef.current) {
              gsap.to(containerRef.current, {
                scale: 1.1,
                opacity: 0,
                duration: 0.6,
                ease: 'power2.inOut',
                onComplete: onComplete,
              })
            } else {
              onComplete()
            }
          }, 200)
        },
      })
    }

    init()

    return () => {
      if (gsapInstance) {
        gsapInstance.killTweensOf(tweenObj)
      }
    }
  }, [onComplete])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <span
        ref={countRef}
        style={{
          fontFamily: "'Anton', sans-serif",
          fontSize: 'clamp(8rem, 20vw, 18rem)',
          color: '#FFFFFF',
          lineHeight: 1,
          letterSpacing: '-0.02em',
          userSelect: 'none',
        }}
      >
        000
      </span>
    </div>
  )
}
