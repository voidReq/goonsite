"use client";

import React, { Suspense } from "react";
import { MacbookScroll } from "../components/ui/macbook-scroll";
import Link from "next/link";
import { Progress } from '@mantine/core';
import { useEffect, useState, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { useLoader } from "@react-three/fiber";
import * as THREE from "three";

function LeBronModel({ onLoaded }: { onLoaded?: () => void }) {
  const originalObj = useLoader(OBJLoader, "/lebron.obj");
  const ref = useRef<THREE.Group>(null);
  const [clonedObj, setClonedObj] = useState<THREE.Group | null>(null);

  // Clone and set up the model to avoid mutating the cached original
  useEffect(() => {
    if (originalObj) {
      const obj = originalObj.clone(true);

      const box = new THREE.Box3().setFromObject(obj);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 4 / maxDim;
      obj.scale.setScalar(scale);
      obj.position.set(-center.x * scale, -center.y * scale, -center.z * scale);

      // Give it a visible material since there's no .mtl
      obj.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          (child as THREE.Mesh).material = new THREE.MeshStandardMaterial({
            color: "#bb9af7",
            metalness: 0.3,
            roughness: 0.6,
          });
        }
      });

      setClonedObj(obj);
      onLoaded?.();
    }
  }, [originalObj]);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 1.5;
    }
  });

  if (!clonedObj) return null;

  return (
    <group ref={ref}>
      <primitive object={clonedObj} />
    </group>
  );
}

function LoadingScreen({ progress }: { progress: number }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-20 gap-4 px-10" style={{ backgroundColor: 'var(--goon-bg)' }}>
      <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">
        Loading your experience...
      </span>
      <Progress
        value={progress}
        color="grape"
        size="sm"
        radius="xl"
        className="w-full max-w-xs"
        animated
      />
      <span className="text-xs font-mono" style={{ color: 'var(--goon-text-dim)' }}>{Math.round(progress)}%</span>
    </div>
  );
}

function MobileView() {
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (loaded) return;
    // Animate the progress bar while loading
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) return 90; // cap at 90 until actually loaded
        return p + Math.random() * 8;
      });
    }, 200);
    return () => clearInterval(interval);
  }, [loaded]);

  return (
    <div className="h-dvh flex flex-col items-center justify-center relative" style={{ backgroundColor: 'var(--goon-bg)' }}>
      {!loaded && <LoadingScreen progress={progress} />}

      <div className="w-full h-full">
        <Canvas
          camera={{ position: [0, 2, 12], fov: 50 }}
          resize={{ debounce: 0 }}
          onCreated={() => {
            // Force resize recalculation after client-side navigation
            window.dispatchEvent(new Event('resize'));
          }}
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <directionalLight position={[-5, -5, -5]} intensity={0.3} />
          <Suspense fallback={null}>
            <LeBronModel onLoaded={() => { setProgress(100); setTimeout(() => setLoaded(true), 300); }} />
          </Suspense>
        </Canvas>
      </div>

      {/* Overlay text */}
      <span className="absolute top-12 text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500 text-center z-10 pointer-events-none">
        Welcome to Goonsite
      </span>

      <Link
        href="/"
        className="absolute bottom-8 transition-colors text-sm z-10"
        style={{ color: 'var(--goon-text-dim)' }}
      >
        &larr; Back home
      </Link>
    </div>
  );
}

export default function MacbookScrollDemo() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  if (isMobile) {
    return <MobileView />;
  }

  return (
    <div className="overflow-hidden w-full min-h-screen flex items-start justify-center" style={{ backgroundColor: 'var(--goon-bg)' }}>
      <MacbookScroll
        title={
          <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">
            Welcome to Goonsite
          </span>
        }
        badge={
          <Link href="/" className="opacity-70 hover:opacity-100 transition-opacity duration-200">
            <Badge className="h-12 w-12 transform hover:scale-110 transition-transform duration-200" />
          </Link>
        }
        src={`/lebron.png`}
        showGradient={true}
      />
    </div>
  );
}

// Peerlist logo
const Badge = ({ className }: { className?: string }) => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M56 28C56 43.464 43.464 56 28 56C12.536 56 0 43.464 0 28C0 12.536 12.536 0 28 0C43.464 0 56 12.536 56 28Z"
        fill="#00AA45"
      ></path>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M28 54C42.3594 54 54 42.3594 54 28C54 13.6406 42.3594 2 28 2C13.6406 2 2 13.6406 2 28C2 42.3594 13.6406 54 28 54ZM28 56C43.464 56 56 43.464 56 28C56 12.536 43.464 0 28 0C12.536 0 0 12.536 0 28C0 43.464 12.536 56 28 56Z"
        fill="#219653"
      ></path>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M27.0769 12H15V46H24.3846V38.8889H27.0769C34.7305 38.8889 41 32.9048 41 25.4444C41 17.984 34.7305 12 27.0769 12ZM24.3846 29.7778V21.1111H27.0769C29.6194 21.1111 31.6154 23.0864 31.6154 25.4444C31.6154 27.8024 29.6194 29.7778 27.0769 29.7778H24.3846Z"
        fill="#24292E"
      ></path>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M18 11H29.0769C36.2141 11 42 16.5716 42 23.4444C42 30.3173 36.2141 35.8889 29.0769 35.8889H25.3846V43H18V11ZM25.3846 28.7778H29.0769C32.1357 28.7778 34.6154 26.39 34.6154 23.4444C34.6154 20.4989 32.1357 18.1111 29.0769 18.1111H25.3846V28.7778Z"
        fill="white"
      ></path>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M17 10H29.0769C36.7305 10 43 15.984 43 23.4444C43 30.9048 36.7305 36.8889 29.0769 36.8889H26.3846V44H17V10ZM19 12V42H24.3846V34.8889H29.0769C35.6978 34.8889 41 29.7298 41 23.4444C41 17.1591 35.6978 12 29.0769 12H19ZM24.3846 17.1111H29.0769C32.6521 17.1111 35.6154 19.9114 35.6154 23.4444C35.6154 26.9775 32.6521 29.7778 29.0769 29.7778H24.3846V17.1111ZM26.3846 19.1111V27.7778H29.0769C31.6194 27.7778 33.6154 25.8024 33.6154 23.4444C33.6154 21.0864 31.6194 19.1111 29.0769 19.1111H26.3846Z"
        fill="#24292E"
      ></path>
    </svg>
  );
};
