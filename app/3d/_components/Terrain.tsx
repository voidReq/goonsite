'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import { createNoise2D } from 'simplex-noise'
import { useControls, folder } from 'leva'

export default function Terrain() {
  const {
    amplitude, frequency,
    amplitude2, frequency2,
    amplitude3, frequency3,
    terrainColor,
    lavaEmissive, lavaIntensity,
    terrainY,
    roughness,
  } = useControls('Terrain', {
    Shape: folder({
      amplitude:   { value: 4.5,   min: 0,     max: 14,   step: 0.1,   label: 'Amplitude 1' },
      frequency:   { value: 0.025, min: 0.001, max: 0.12, step: 0.001, label: 'Frequency 1' },
      amplitude2:  { value: 1.5,   min: 0,     max: 6,    step: 0.1,   label: 'Amplitude 2' },
      frequency2:  { value: 0.08,  min: 0.01,  max: 0.3,  step: 0.005, label: 'Frequency 2' },
      amplitude3:  { value: 0.5,   min: 0,     max: 3,    step: 0.05,  label: 'Amplitude 3' },
      frequency3:  { value: 0.2,   min: 0.05,  max: 0.6,  step: 0.01,  label: 'Frequency 3' },
    }),
    Material: folder({
      terrainColor: { value: '#0a0005', label: 'Ground Color' },
      roughness:    { value: 0.95, min: 0, max: 1, step: 0.01 },
      terrainY:     { value: -1, min: -5, max: 2, step: 0.1, label: 'Terrain Y' },
    }),
    Lava: folder({
      lavaEmissive:  { value: '#ff2200', label: 'Lava Color' },
      lavaIntensity: { value: 2, min: 0, max: 10, step: 0.1, label: 'Lava Glow' },
    }),
  })

  const geometry = useMemo(() => {
    const noise2D = createNoise2D()
    const geo = new THREE.PlaneGeometry(120, 250, 128, 256)
    geo.rotateX(-Math.PI / 2)
    const positions = geo.attributes.position
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i)
      const z = positions.getZ(i)
      const y =
        noise2D(x * frequency,  z * frequency)  * amplitude +
        noise2D(x * frequency2, z * frequency2) * amplitude2 +
        noise2D(x * frequency3, z * frequency3) * amplitude3
      positions.setY(i, y)
    }
    geo.computeVertexNormals()
    return geo
  }, [amplitude, frequency, amplitude2, frequency2, amplitude3, frequency3])

  const lavaPositions: [number, number, number][] = [
    [0, 0.05, 0],
    [0, 0.05, -20],
    [0, 0.05, -40],
  ]

  return (
    <group>
      <mesh geometry={geometry} receiveShadow position={[0, terrainY, 0]}>
        <meshStandardMaterial color={terrainColor} roughness={roughness} metalness={0.05} />
      </mesh>

      {lavaPositions.map((pos, i) => (
        <mesh key={i} position={pos} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[8, 8]} />
          <meshStandardMaterial
            color="#000000"
            emissive={lavaEmissive}
            emissiveIntensity={lavaIntensity}
            roughness={0.8}
          />
        </mesh>
      ))}
    </group>
  )
}
