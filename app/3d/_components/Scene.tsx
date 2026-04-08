'use client'

import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { useControls, folder } from 'leva'
import Terrain from './Terrain'
import StarField from './StarField'
import Vegetation from './Vegetation'
import Particles from './Particles'
import CameraRig from './CameraRig'
import PostProcessing from './PostProcessing'
import PointsOfInterest from './PointsOfInterest'

interface SceneProps {
  scrollProgress: number
}

function SceneInner({ scrollProgress }: SceneProps) {
  const { fogColor, fogDensity } = useControls('Atmosphere', {
    Fog: folder({
      fogColor:   { value: '#1a0005', label: 'Fog Color' },
      fogDensity: { value: 0.018, min: 0, max: 0.06, step: 0.001, label: 'Fog Density' },
    }),
  })

  const { dirColor, dirIntensity, ambColor, ambIntensity, hemiIntensity } = useControls('Lighting', {
    Directional: folder({
      dirColor:     { value: '#ff8866', label: 'Color' },
      dirIntensity: { value: 2, min: 0, max: 6, step: 0.1, label: 'Intensity' },
    }),
    Ambient: folder({
      ambColor:     { value: '#220011', label: 'Color' },
      ambIntensity: { value: 0.5, min: 0, max: 2, step: 0.05, label: 'Intensity' },
    }),
    Hemisphere: folder({
      hemiIntensity: { value: 0.3, min: 0, max: 2, step: 0.05, label: 'Intensity' },
    }),
  })

  return (
    <>
      <fogExp2 args={[fogColor, fogDensity]} />
      <directionalLight
        color={dirColor}
        intensity={dirIntensity}
        position={[10, 20, 10]}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.1}
        shadow-camera-far={100}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
      />
      <ambientLight color={ambColor} intensity={ambIntensity} />
      <hemisphereLight args={['#110022', '#000000', hemiIntensity]} />

      <Suspense fallback={null}>
        <CameraRig scrollProgress={scrollProgress} />
        <Terrain />
        <StarField />
        <Vegetation />
        <Particles />
        <PointsOfInterest />
        <PostProcessing />
      </Suspense>
    </>
  )
}

export default function Scene({ scrollProgress }: SceneProps) {
  return (
    <Canvas
      shadows
      gl={{ antialias: true }}
      camera={{ fov: 50, near: 0.1, far: 200 }}
    >
      <SceneInner scrollProgress={scrollProgress} />
    </Canvas>
  )
}
