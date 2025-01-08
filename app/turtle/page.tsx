"use client";
import { MantineProvider } from '@mantine/core';
import { useEffect } from 'react';
import Script from 'next/script';

declare global {
  interface Window {
    CanvasSwirl: any;
  }
}

export default function Turtle() { 
  useEffect(() => {
    // Initialize swirl after the script has loaded
    const initializeSwirl = () => {
      if (typeof window !== 'undefined' && window.CanvasSwirl) {
        const swirl1 = new window.CanvasSwirl(
          document.getElementById('swirl1_surface'),
          {
"count": 400,
				"shape": "random",
				"radiusInnerMax": "0%",
				"radiusInnerMin": "0%",
				"radiusOuterMax": "50%",
				"radiusOuterMin": "50%",
				"thicknessMin": 1,
				"thicknessMax": 1,
				"fadeTime": 0.25,
				"rotationVelMin": 0.2,
				"rotationVelMax": 0.4,
				"originX": "center",
				"originY": "center",
				"originXOffsetMin": 0,
				"originXOffsetMax": 0,
				"originYOffsetMin": 0,
				"originYOffsetMax": 0,
				"distanceVelMin": 0.25,
				"distanceVelMax": 0.6,
				"saturationMin": 35,
				"saturationMax": 75,
				"lightnessMin": 30,
				"lightnessMax": 70,
				"hueMin": 0,
				"hueMax": 360,
				"hueIncrement": 1,
				"opacityMin": 1,
				"opacityMax": 1,
				"opacityScaleAtCenter": 1,
				"opacityScaleAtEdge": 1,
				"opacityScaleIsRelative": true,
				"lightnessScaleAtCenter": 1,
				"lightnessScaleAtEdge": 1,
				"lightnessScaleIsRelative": true,
				"saturationScaleAtCenter": 1,
				"saturationScaleAtEdge": 1,
				"saturationScaleIsRelative": true,
				"distanceJitterMin": 0,
				"distanceJitterMax": 0,
				"rotationJitterMin": 0,
				"rotationJitterMax": 0
          }
        );
      }
    };

    setTimeout(initializeSwirl, 100);
  }, []);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', position: 'absolute', bottom: 0, width: '100%' }}>
      <Script 
        src="/swirl_0.8_min.js"  // Assuming this is in your public folder
        onLoad={() => {
          console.log('Swirl script loaded');
        }}
      />
      <MantineProvider forceColorScheme='dark'>
        <canvas width='200' height='200' id='swirl1_surface' style={{ display: 'flex', justifyContent: 'center', position: 'absolute', bottom: 50 }}></canvas>
      </MantineProvider>
    </div>
  );
}