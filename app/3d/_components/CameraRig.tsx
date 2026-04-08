'use client'

import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useControls } from 'leva'

interface CameraRigProps {
  scrollProgress: number
}

const KEYFRAMES = [
  { progress: 0.0,  pos: new THREE.Vector3(0, 14, 35),  target: new THREE.Vector3(0, 2, 0)   },
  { progress: 0.25, pos: new THREE.Vector3(-4, 5, 18),  target: new THREE.Vector3(0, 2, 8)   },
  { progress: 0.5,  pos: new THREE.Vector3(6, 6, 0),    target: new THREE.Vector3(0, 3, -10) },
  { progress: 0.75, pos: new THREE.Vector3(-3, 5, -18), target: new THREE.Vector3(0, 2, -28) },
  { progress: 1.0,  pos: new THREE.Vector3(0, 10, -30), target: new THREE.Vector3(0, 3, -40) },
]

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t)
}

export default function CameraRig({ scrollProgress }: CameraRigProps) {
  const currentPos = useRef(new THREE.Vector3(0, 14, 35))
  const currentTarget = useRef(new THREE.Vector3(0, 2, 0))
  const { camera } = useThree()

  const { lerpSpeed } = useControls('Camera', {
    lerpSpeed: { value: 0.06, min: 0.01, max: 0.3, step: 0.01, label: 'Smoothing' },
  })

  useFrame(() => {
    const progress = Math.max(0, Math.min(1, scrollProgress))

    // Find surrounding keyframes
    let kf1 = KEYFRAMES[0]
    let kf2 = KEYFRAMES[KEYFRAMES.length - 1]

    for (let i = 0; i < KEYFRAMES.length - 1; i++) {
      if (progress >= KEYFRAMES[i].progress && progress <= KEYFRAMES[i + 1].progress) {
        kf1 = KEYFRAMES[i]
        kf2 = KEYFRAMES[i + 1]
        break
      }
    }

    // Compute local t
    const range = kf2.progress - kf1.progress
    let t = range > 0 ? (progress - kf1.progress) / range : 0
    t = Math.max(0, Math.min(1, t))
    t = smoothstep(t)

    // Lerp target position and look-at
    const targetPos = new THREE.Vector3().lerpVectors(kf1.pos, kf2.pos, t)
    const targetLookAt = new THREE.Vector3().lerpVectors(kf1.target, kf2.target, t)

    // Smooth damp toward computed values
    currentPos.current.lerp(targetPos, lerpSpeed)
    currentTarget.current.lerp(targetLookAt, lerpSpeed)

    camera.position.copy(currentPos.current)
    camera.lookAt(currentTarget.current)
  })

  return null
}
