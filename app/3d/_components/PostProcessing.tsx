'use client'

import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { useControls, folder } from 'leva'

export default function PostProcessing() {
  const { bloomIntensity, bloomThreshold, bloomSmoothing,
          vigDarkness, vigOffset } = useControls('Post FX', {
    Bloom: folder({
      bloomIntensity: { value: 1.5, min: 0, max: 5,   step: 0.1,  label: 'Intensity' },
      bloomThreshold: { value: 0.4, min: 0, max: 1,   step: 0.01, label: 'Threshold' },
      bloomSmoothing: { value: 0.9, min: 0, max: 1,   step: 0.01, label: 'Smoothing' },
    }),
    Vignette: folder({
      vigDarkness: { value: 0.8, min: 0, max: 1.5, step: 0.05, label: 'Darkness' },
      vigOffset:   { value: 0.3, min: 0, max: 1,   step: 0.05, label: 'Offset' },
    }),
  })

  return (
    <EffectComposer>
      <Bloom
        intensity={bloomIntensity}
        luminanceThreshold={bloomThreshold}
        luminanceSmoothing={bloomSmoothing}
        mipmapBlur
      />
      <Vignette
        offset={vigOffset}
        darkness={vigDarkness}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  )
}
