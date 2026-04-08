import { Stars } from '@react-three/drei'
import * as THREE from 'three'

export default function StarField() {
  return (
    <group>
      <Stars
        radius={80}
        depth={60}
        count={5000}
        factor={4}
        saturation={0}
        fade
        speed={0.5}
      />

      {/* Deep dark background sphere */}
      <mesh>
        <sphereGeometry args={[95, 32, 32]} />
        <meshBasicMaterial color="#03000a" side={THREE.BackSide} />
      </mesh>
    </group>
  )
}
