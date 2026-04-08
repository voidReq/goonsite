'use client'

import { useRef, useMemo, useEffect } from 'react'
import * as THREE from 'three'

export default function Vegetation() {
  const trunkRef = useRef<THREE.InstancedMesh>(null)
  const branchRef = useRef<THREE.InstancedMesh>(null)
  const rockRef = useRef<THREE.InstancedMesh>(null)

  const treePositions = useMemo(() => {
    const pts: [number, number, number][] = []
    let seed = 42
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) & 0xffffffff
      return (seed >>> 0) / 0xffffffff
    }
    for (let i = 0; i < 80; i++) {
      const angle = rand() * Math.PI * 2
      const radius = 8 + rand() * 45
      const x = Math.cos(angle) * radius
      const z = (rand() - 0.5) * 250 - 10
      if (Math.abs(x) < 6) continue
      if (pts.length >= 60) break
      pts.push([x, 0, z])
    }
    return pts
  }, [])

  const rockPositions = useMemo(() => {
    const pts: { pos: [number, number, number]; scale: number }[] = []
    let seed = 137
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) & 0xffffffff
      return (seed >>> 0) / 0xffffffff
    }
    for (let i = 0; i < 40; i++) {
      const angle = rand() * Math.PI * 2
      const radius = 4 + rand() * 50
      const x = Math.cos(angle) * radius
      const z = (rand() - 0.5) * 260 - 10
      pts.push({ pos: [x, -0.5, z], scale: 0.3 + rand() * 0.5 })
    }
    return pts
  }, [])

  useEffect(() => {
    const dummy = new THREE.Object3D()

    if (trunkRef.current) {
      treePositions.forEach(([x, y, z], i) => {
        dummy.position.set(x, y + 0.25, z)
        dummy.rotation.set(0, 0, 0)
        dummy.scale.set(1, 1, 1)
        dummy.updateMatrix()
        trunkRef.current!.setMatrixAt(i, dummy.matrix)
      })
      trunkRef.current.instanceMatrix.needsUpdate = true
    }

    if (branchRef.current) {
      treePositions.forEach(([x, y, z], i) => {
        dummy.position.set(x, y + 2.0, z)
        dummy.rotation.set(0, 0, 0)
        dummy.scale.set(1, 1, 1)
        dummy.updateMatrix()
        branchRef.current!.setMatrixAt(i, dummy.matrix)
      })
      branchRef.current.instanceMatrix.needsUpdate = true
    }

    if (rockRef.current) {
      rockPositions.forEach(({ pos: [x, y, z], scale }, i) => {
        dummy.position.set(x, y, z)
        dummy.rotation.set(0, 0, 0)
        dummy.scale.set(scale, scale, scale)
        dummy.updateMatrix()
        rockRef.current!.setMatrixAt(i, dummy.matrix)
      })
      rockRef.current.instanceMatrix.needsUpdate = true
    }
  }, [treePositions, rockPositions])

  return (
    <group>
      {/* Tree trunks */}
      <instancedMesh
        ref={trunkRef}
        args={[undefined, undefined, treePositions.length]}
        castShadow
      >
        <cylinderGeometry args={[0.08, 0.15, 2.5, 6]} />
        <meshStandardMaterial color="#1a0a00" roughness={1} />
      </instancedMesh>

      {/* Tree branch tops */}
      <instancedMesh
        ref={branchRef}
        args={[undefined, undefined, treePositions.length]}
        castShadow
      >
        <coneGeometry args={[0.8, 2, 6]} />
        <meshStandardMaterial color="#0d0505" roughness={1} />
      </instancedMesh>

      {/* Rocks */}
      <instancedMesh
        ref={rockRef}
        args={[undefined, undefined, rockPositions.length]}
        castShadow
        receiveShadow
      >
        <sphereGeometry args={[1, 6, 4]} />
        <meshStandardMaterial color="#150808" roughness={0.9} metalness={0.1} />
      </instancedMesh>
    </group>
  )
}
