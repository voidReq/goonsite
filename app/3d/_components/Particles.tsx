'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useControls, folder } from 'leva'

const COUNT_PRIMARY = 400
const COUNT_SECONDARY = 100

function createParticles(count: number, seed: number) {
  let s = seed
  const rand = () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
  const positions = new Float32Array(count * 3)
  const offsets = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    positions[i * 3 + 0] = (rand() - 0.5) * 60
    positions[i * 3 + 1] = rand() * 6
    positions[i * 3 + 2] = rand() * 80 - 50
    offsets[i] = rand() * Math.PI * 2
  }
  return { positions, offsets }
}

export default function Particles() {
  const primaryGeoRef   = useRef<THREE.BufferGeometry>(null)
  const secondaryGeoRef = useRef<THREE.BufferGeometry>(null)

  const { emberColor, emberSize, emberOpacity, riseSpeed, driftAmount,
          sparkColor, sparkSize } = useControls('Particles', {
    Embers: folder({
      emberColor:   { value: '#ff4400', label: 'Ember Color' },
      emberSize:    { value: 0.08, min: 0.01, max: 0.4, step: 0.01, label: 'Size' },
      emberOpacity: { value: 0.8,  min: 0,    max: 1,   step: 0.05, label: 'Opacity' },
      riseSpeed:    { value: 0.008, min: 0,   max: 0.05, step: 0.001, label: 'Rise Speed' },
      driftAmount:  { value: 0.002, min: 0,   max: 0.02, step: 0.001, label: 'Drift' },
    }),
    Sparks: folder({
      sparkColor: { value: '#ffaa00', label: 'Spark Color' },
      sparkSize:  { value: 0.05, min: 0.01, max: 0.3, step: 0.01, label: 'Size' },
    }),
  })

  const { positions: primaryPos,   offsets: primaryOffsets   } = useMemo(() => createParticles(COUNT_PRIMARY,   999),  [])
  const { positions: secondaryPos, offsets: secondaryOffsets } = useMemo(() => createParticles(COUNT_SECONDARY, 1337), [])

  const primaryResetY = useMemo(() => {
    let s = 555
    const rand = () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff }
    return new Float32Array(COUNT_PRIMARY).map(() => 8 + rand() * 3)
  }, [])

  const secondaryResetY = useMemo(() => {
    let s = 777
    const rand = () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff }
    return new Float32Array(COUNT_SECONDARY).map(() => 8 + rand() * 3)
  }, [])

  useFrame(({ clock }, delta) => {
    const time = clock.getElapsedTime()
    const dt = delta * 60

    if (primaryGeoRef.current) {
      const pos = primaryGeoRef.current.attributes.position.array as Float32Array
      for (let i = 0; i < COUNT_PRIMARY; i++) {
        pos[i * 3 + 1] += riseSpeed * dt
        pos[i * 3 + 0] += Math.sin(time + primaryOffsets[i] * 0.7) * driftAmount
        if (pos[i * 3 + 1] > primaryResetY[i]) pos[i * 3 + 1] = -0.5
      }
      primaryGeoRef.current.attributes.position.needsUpdate = true
    }

    if (secondaryGeoRef.current) {
      const pos = secondaryGeoRef.current.attributes.position.array as Float32Array
      for (let i = 0; i < COUNT_SECONDARY; i++) {
        pos[i * 3 + 1] += riseSpeed * dt
        pos[i * 3 + 0] += Math.sin(time + secondaryOffsets[i] * 0.7) * driftAmount
        if (pos[i * 3 + 1] > secondaryResetY[i]) pos[i * 3 + 1] = -0.5
      }
      secondaryGeoRef.current.attributes.position.needsUpdate = true
    }
  })

  return (
    <group>
      <points>
        <bufferGeometry ref={primaryGeoRef}>
          <bufferAttribute attach="attributes-position" args={[primaryPos, 3]} count={COUNT_PRIMARY} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial color={emberColor} size={emberSize} transparent opacity={emberOpacity} sizeAttenuation depthWrite={false} />
      </points>

      <points>
        <bufferGeometry ref={secondaryGeoRef}>
          <bufferAttribute attach="attributes-position" args={[secondaryPos, 3]} count={COUNT_SECONDARY} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial color={sparkColor} size={sparkSize} transparent opacity={0.7} sizeAttenuation depthWrite={false} />
      </points>
    </group>
  )
}
