'use client'

import * as THREE from 'three'
import { useControls, folder } from 'leva'

interface MonumentProps {
  position: [number, number, number]
  color: string
  lightIntensity: number
  children: React.ReactNode
}

function Monument({ position, color, lightIntensity, children }: MonumentProps) {
  return (
    <group position={position}>
      {children}
      <pointLight color={color} intensity={lightIntensity} distance={15} />
    </group>
  )
}

interface GlowBoxProps {
  position?: [number, number, number]
  size: [number, number, number]
  color: string
  emissiveIntensity?: number
}

function GlowBox({ position = [0, 0, 0], size, color, emissiveIntensity = 3 }: GlowBoxProps) {
  return (
    <mesh position={position} castShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color="#000000" emissive={color} emissiveIntensity={emissiveIntensity} />
    </mesh>
  )
}

function GlowSphere({ position = [0, 0, 0], radius, color, emissiveIntensity = 3 }: {
  position?: [number, number, number]
  radius: number
  color: string
  emissiveIntensity?: number
}) {
  return (
    <mesh position={position} castShadow>
      <sphereGeometry args={[radius, 16, 16]} />
      <meshStandardMaterial color="#000000" emissive={color} emissiveIntensity={emissiveIntensity} />
    </mesh>
  )
}

export default function PointsOfInterest() {
  const { emissiveIntensity, lightIntensity, accentColor } = useControls('Monuments', {
    accentColor:       { value: '#ff3333', label: 'Accent Color' },
    emissiveIntensity: { value: 3,  min: 0, max: 10, step: 0.1, label: 'Glow Intensity' },
    lightIntensity:    { value: 8,  min: 0, max: 30, step: 0.5, label: 'Light Intensity' },
  })

  return (
    <group>
      {/* Hero POI — tall thin pillar */}
      <Monument position={[0, 4, 5]} color={accentColor} lightIntensity={lightIntensity}>
        <GlowBox size={[0.3, 8, 0.3]} color={accentColor} emissiveIntensity={emissiveIntensity} />
      </Monument>

      {/* About POI — arch */}
      <Monument position={[-2, 3, 12]} color="#ff2200" lightIntensity={lightIntensity}>
        <GlowBox position={[-1.2, 0, 0]} size={[0.3, 6, 0.3]} color="#ff2200" emissiveIntensity={emissiveIntensity} />
        <GlowBox position={[1.2, 0, 0]}  size={[0.3, 6, 0.3]} color="#ff2200" emissiveIntensity={emissiveIntensity} />
        <GlowBox position={[0, 3.35, 0]} size={[2.7, 0.3, 0.3]} color="#ff2200" emissiveIntensity={emissiveIntensity} />
      </Monument>

      {/* Work POI — triple cluster */}
      <Monument position={[3, 0, -5]} color="#ff4400" lightIntensity={lightIntensity}>
        <GlowBox position={[-0.6, 2.5, 0]} size={[0.4, 5, 0.4]} color="#ff4400" emissiveIntensity={emissiveIntensity} />
        <GlowBox position={[0,    3.5, 0]} size={[0.4, 7, 0.4]} color="#ff4400" emissiveIntensity={emissiveIntensity} />
        <GlowBox position={[0.6,  1.5, 0]} size={[0.4, 3, 0.4]} color="#ff4400" emissiveIntensity={emissiveIntensity} />
      </Monument>

      {/* Skills POI — glowing sphere */}
      <Monument position={[-2, 2, -22]} color="#ff1100" lightIntensity={lightIntensity}>
        <GlowSphere radius={1.2} color="#ff1100" emissiveIntensity={emissiveIntensity} />
        <GlowBox position={[0, -2, 0]} size={[0.25, 4, 0.25]} color="#ff1100" emissiveIntensity={emissiveIntensity * 0.67} />
      </Monument>

      {/* Contact POI — ring of pillars */}
      <Monument position={[0, 0, -35]} color="#ff3300" lightIntensity={lightIntensity}>
        {Array.from({ length: 8 }, (_, i) => {
          const angle = (i / 8) * Math.PI * 2
          const r = 2.2
          const height = 2 + Math.sin(i * 1.3) * 1.5
          return (
            <GlowBox
              key={i}
              position={[Math.cos(angle) * r, height / 2, Math.sin(angle) * r]}
              size={[0.3, height, 0.3]}
              color="#ff3300"
              emissiveIntensity={emissiveIntensity}
            />
          )
        })}
      </Monument>
    </group>
  )
}
