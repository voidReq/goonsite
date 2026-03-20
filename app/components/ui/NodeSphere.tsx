"use client";

import { useRef, useMemo, useState, useCallback, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useRouter } from 'next/navigation';
import * as THREE from 'three';

// ─── Site node type ─────────────────────────────────────────────────────────

export interface SiteNode {
  href: string;
  label: string;
  color: string;
}

// ─── Generate points in a spherical cloud ───────────────────────────────────

function generateCloud(count: number, radius: number): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const radiusAtY = Math.sqrt(1 - y * y);
    const theta = goldenAngle * i;
    const jitter = 0.7 + Math.random() * 0.6;
    const r = radius * jitter;

    points.push(new THREE.Vector3(
      Math.cos(theta) * radiusAtY * r + (Math.random() - 0.5) * 0.8,
      y * r + (Math.random() - 0.5) * 0.8,
      Math.sin(theta) * radiusAtY * r + (Math.random() - 0.5) * 0.8,
    ));
  }
  return points;
}

// ─── Generate edges ─────────────────────────────────────────────────────────

function generateEdges(points: THREE.Vector3[], maxDist: number): [number, number][] {
  const edges: [number, number][] = [];
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      if (points[i].distanceTo(points[j]) < maxDist) {
        edges.push([i, j]);
      }
    }
  }
  return edges;
}

// ─── Colors ─────────────────────────────────────────────────────────────────

const DIM_COLOR = new THREE.Color('#565f89');
const BASE_EDGE = new THREE.Color('#222233');

// ─── Edges ──────────────────────────────────────────────────────────────────

function Edges({
  points,
  edges,
  nodeColors,
  activeNode,
  pulseNodes,
}: {
  points: THREE.Vector3[];
  edges: [number, number][];
  nodeColors: THREE.Color[];
  activeNode: number | null;
  pulseNodes: Set<number>;
}) {
  const colorArray = useRef<Float32Array | null>(null);
  const prevActive = useRef<number | null>(null);
  const prevPulseSize = useRef(0);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(edges.length * 6);
    const colors = new Float32Array(edges.length * 6);

    edges.forEach(([a, b], i) => {
      positions[i * 6] = points[a].x; positions[i * 6 + 1] = points[a].y; positions[i * 6 + 2] = points[a].z;
      positions[i * 6 + 3] = points[b].x; positions[i * 6 + 4] = points[b].y; positions[i * 6 + 5] = points[b].z;
      colors[i * 6] = BASE_EDGE.r; colors[i * 6 + 1] = BASE_EDGE.g; colors[i * 6 + 2] = BASE_EDGE.b;
      colors[i * 6 + 3] = BASE_EDGE.r; colors[i * 6 + 4] = BASE_EDGE.g; colors[i * 6 + 5] = BASE_EDGE.b;
    });

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    colorArray.current = colors;
    return geo;
  }, [points, edges]);

  // Reusable color object to avoid allocations
  const tmpColor = useMemo(() => new THREE.Color(), []);

  useFrame(() => {
    if (!colorArray.current) return;
    if (activeNode === prevActive.current && pulseNodes.size === prevPulseSize.current) return;
    prevActive.current = activeNode;
    prevPulseSize.current = pulseNodes.size;
    const colors = colorArray.current;

    for (let i = 0; i < edges.length; i++) {
      const [a, b] = edges[i];
      const aActive = a === activeNode || pulseNodes.has(a);
      const bActive = b === activeNode || pulseNodes.has(b);

      if (aActive && bActive) {
        tmpColor.copy(nodeColors[a]).lerp(nodeColors[b], 0.5);
      } else if (aActive || bActive) {
        tmpColor.copy(nodeColors[aActive ? a : b]).lerp(BASE_EDGE, 0.4);
      } else {
        tmpColor.copy(BASE_EDGE);
      }

      colors[i * 6] = tmpColor.r; colors[i * 6 + 1] = tmpColor.g; colors[i * 6 + 2] = tmpColor.b;
      colors[i * 6 + 3] = tmpColor.r; colors[i * 6 + 4] = tmpColor.g; colors[i * 6 + 5] = tmpColor.b;
    }
    geometry.attributes.color.needsUpdate = true;
  });

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial vertexColors transparent opacity={0.25} />
    </lineSegments>
  );
}

// ─── Nodes ──────────────────────────────────────────────────────────────────

function Nodes({
  points,
  nodeColors,
  activeNode,
  pulseNodes,
}: {
  points: THREE.Vector3[];
  nodeColors: THREE.Color[];
  activeNode: number | null;
  pulseNodes: Set<number>;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colorArr = useMemo(() => new Float32Array(points.length * 3), [points.length]);
  const scaleArr = useRef(new Float32Array(points.length).fill(1));
  const prevActive = useRef<number | null>(null);
  const prevPulseSize = useRef(0);
  const needsUpdate = useRef(true);
  const tmpColor = useMemo(() => new THREE.Color(), []);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    const stateChanged = activeNode !== prevActive.current || pulseNodes.size !== prevPulseSize.current;
    if (stateChanged) {
      prevActive.current = activeNode;
      prevPulseSize.current = pulseNodes.size;
      needsUpdate.current = true;
    }

    // Only update matrices/colors when animating
    if (!needsUpdate.current) return;

    let stillAnimating = false;
    for (let i = 0; i < points.length; i++) {
      const isActive = i === activeNode;
      const isPulsing = pulseNodes.has(i);
      const targetScale = isActive ? 2.2 : isPulsing ? 1.5 : 1;
      const diff = targetScale - scaleArr.current[i];
      scaleArr.current[i] += diff * Math.min(delta * 10, 1);

      if (Math.abs(diff) > 0.01) stillAnimating = true;

      const intensity = isActive ? 1.0 : isPulsing ? 0.6 : 0.25;
      tmpColor.copy(nodeColors[i]).lerp(DIM_COLOR, 1 - intensity);
      colorArr[i * 3] = tmpColor.r; colorArr[i * 3 + 1] = tmpColor.g; colorArr[i * 3 + 2] = tmpColor.b;

      dummy.position.copy(points[i]);
      dummy.scale.setScalar(scaleArr.current[i]);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.geometry.attributes.color.needsUpdate = true;
    if (!stillAnimating && !stateChanged) needsUpdate.current = false;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, points.length]}>
      <sphereGeometry args={[0.04, 6, 6]}>
        <instancedBufferAttribute attach="attributes-color" args={[colorArr, 3]} />
      </sphereGeometry>
      <meshBasicMaterial vertexColors transparent opacity={0.85} />
    </instancedMesh>
  );
}

// ─── Find closest node to cursor (screen-space) ────────────────────────────

function findClosestNode(
  camera: THREE.Camera,
  mouse: THREE.Vector2,
  points: THREE.Vector3[],
  maxScreenDist: number,
): number | null {
  let closest: number | null = null;
  let closestDist = maxScreenDist;
  const projected = new THREE.Vector3();

  for (let i = 0; i < points.length; i++) {
    projected.copy(points[i]).project(camera);
    const dx = projected.x - mouse.x;
    const dy = projected.y - mouse.y;
    const dist = dx * dx + dy * dy; // skip sqrt — compare squared
    if (dist < closestDist && projected.z < 1) {
      closestDist = dist;
      closest = i;
    }
  }
  return closest;
}

// ─── Orbit scene ────────────────────────────────────────────────────────────

function OrbitScene({
  nodeCount,
  nodeColors,
  onHover,
  onClick,
}: {
  nodeCount: number;
  nodeColors: THREE.Color[];
  onHover: (index: number | null) => void;
  onClick: (index: number) => void;
}) {
  const { camera, gl } = useThree();

  const { points, edges, adjacency } = useMemo(() => {
    const pts = generateCloud(nodeCount, 4);
    const edg = generateEdges(pts, 1.6);
    const adj: Map<number, number[]> = new Map();
    edg.forEach(([a, b]) => {
      if (!adj.has(a)) adj.set(a, []);
      if (!adj.has(b)) adj.set(b, []);
      adj.get(a)!.push(b);
      adj.get(b)!.push(a);
    });
    return { points: pts, edges: edg, adjacency: adj };
  }, [nodeCount]);

  const [activeNode, setActiveNode] = useState<number | null>(null);
  const [pulseNodes, setPulseNodes] = useState<Set<number>>(new Set());

  // Quaternion orbit
  const orbiting = useRef(false);
  const prevMouse = useRef({ x: 0, y: 0 });
  const totalDragDist = useRef(0);
  const orbitQuat = useRef(new THREE.Quaternion());
  const velAxis = useRef(new THREE.Vector3(0, 1, 0));
  const velAngle = useRef(0);
  const autoRotateSpeed = useRef(0.12);
  const autoRotateAxis = useRef(new THREE.Vector3(0, 1, 0));
  const ORBIT_RADIUS = 8;

  useEffect(() => {
    camera.position.set(0, 0, ORBIT_RADIUS);
    camera.lookAt(0, 0, 0);
    orbitQuat.current.identity();
    velAngle.current = 0;
  }, [camera]);

  useEffect(() => {
    const canvas = gl.domElement;

    const applyDrag = (dx: number, dy: number) => {
      const sens = 0.003;
      const camRight = new THREE.Vector3();
      const camUp = new THREE.Vector3();
      camera.getWorldDirection(new THREE.Vector3());
      camRight.setFromMatrixColumn(camera.matrixWorld, 0).normalize();
      camUp.setFromMatrixColumn(camera.matrixWorld, 1).normalize();

      const qH = new THREE.Quaternion().setFromAxisAngle(camUp, -dx * sens);
      const qV = new THREE.Quaternion().setFromAxisAngle(camRight, -dy * sens);
      const dragQ = new THREE.Quaternion().multiplyQuaternions(qH, qV);

      orbitQuat.current.premultiply(dragQ);
      orbitQuat.current.normalize();

      const combinedAxis = camUp.clone().multiplyScalar(-dx).add(camRight.clone().multiplyScalar(-dy));
      const len = combinedAxis.length();
      if (len > 0.001) {
        velAxis.current.copy(combinedAxis).normalize();
        velAngle.current = len * sens;
      }
    };

    // Drag handlers go on WINDOW so they work even when pointer
    // crosses over HTML elements above the canvas
    const onWindowMove = (e: PointerEvent) => {
      if (!orbiting.current) return;

      const dx = e.clientX - prevMouse.current.x;
      const dy = e.clientY - prevMouse.current.y;
      totalDragDist.current += Math.abs(dx) + Math.abs(dy);

      applyDrag(dx, dy);
      prevMouse.current = { x: e.clientX, y: e.clientY };
    };

    const onWindowUp = (e: PointerEvent) => {
      if (!orbiting.current) return;
      orbiting.current = false;
      document.body.style.cursor = '';

      // Click threshold: total drag distance < 5px
      if (totalDragDist.current < 5) {
        velAngle.current = 0;
        doClick(e);
      }

      // Sync axes: momentum direction becomes auto-rotate direction
      if (velAngle.current > 0.0001) {
        autoRotateAxis.current.copy(velAxis.current);
      } else {
        // No momentum — use existing auto-rotate axis for velAxis
        velAxis.current.copy(autoRotateAxis.current);
      }
      autoRotateSpeed.current = 0.12;
    };

    // Pointer down on canvas starts drag
    const onCanvasDown = (e: PointerEvent) => {
      orbiting.current = true;
      totalDragDist.current = 0;
      prevMouse.current = { x: e.clientX, y: e.clientY };
      velAngle.current = 0;
      autoRotateSpeed.current = 0;
      document.body.style.cursor = 'grabbing';
    };

    // Hover only on canvas (not during drag)
    let lastHover = 0;
    const onCanvasMove = (e: PointerEvent) => {
      if (orbiting.current) return;
      const now = Date.now();
      if (now - lastHover > 33) {
        lastHover = now;
        doHover(e);
      }
    };

    const doClick = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      const idx = findClosestNode(camera, mouse, points, 0.0064);
      if (idx !== null) {
        triggerPulse(idx);
        onClick(idx);
      }
    };

    const doHover = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      const idx = findClosestNode(camera, mouse, points, 0.0016);
      if (idx !== null) {
        setActiveNode(idx);
        setPulseNodes(new Set(adjacency.get(idx) || []));
        onHover(idx);
        canvas.style.cursor = 'pointer';
      } else {
        setActiveNode(null);
        setPulseNodes(new Set());
        onHover(null);
        canvas.style.cursor = 'grab';
      }
    };

    canvas.style.cursor = 'grab';
    canvas.addEventListener('pointerdown', onCanvasDown);
    canvas.addEventListener('pointermove', onCanvasMove);
    window.addEventListener('pointermove', onWindowMove);
    window.addEventListener('pointerup', onWindowUp);

    return () => {
      canvas.removeEventListener('pointerdown', onCanvasDown);
      canvas.removeEventListener('pointermove', onCanvasMove);
      window.removeEventListener('pointermove', onWindowMove);
      window.removeEventListener('pointerup', onWindowUp);
      document.body.style.cursor = '';
    };
  }, [gl, camera, points, adjacency, onClick, onHover]);

  const triggerPulse = useCallback((index: number) => {
    setActiveNode(index);
    const neighbors = adjacency.get(index) || [];
    setPulseNodes(new Set(neighbors));

    setTimeout(() => {
      const wave2 = new Set<number>();
      neighbors.forEach(n => (adjacency.get(n) || []).forEach(nn => { if (nn !== index) wave2.add(nn); }));
      setPulseNodes(wave2);
    }, 200);

    setTimeout(() => {
      const wave3 = new Set<number>();
      neighbors.forEach(n => (adjacency.get(n) || []).forEach(nn =>
        (adjacency.get(nn) || []).forEach(nnn => { if (nnn !== index) wave3.add(nnn); })
      ));
      setPulseNodes(wave3);
    }, 400);

    setTimeout(() => { setPulseNodes(new Set()); setActiveNode(null); }, 800);
  }, [adjacency]);

  useFrame((_, delta) => {
    if (!orbiting.current) {
      const cruiseSpeed = autoRotateSpeed.current * delta;

      // Decay momentum toward cruise speed
      velAngle.current = cruiseSpeed + (velAngle.current - cruiseSpeed) * 0.94;

      // Clamp: never go below cruise speed
      if (velAngle.current < cruiseSpeed) velAngle.current = cruiseSpeed;

      // Always rotate on the momentum axis (which equals autoRotateAxis after release)
      if (velAngle.current > 0.00001) {
        const q = new THREE.Quaternion().setFromAxisAngle(velAxis.current, velAngle.current);
        orbitQuat.current.premultiply(q);
        orbitQuat.current.normalize();
      }
    }

    const basePos = new THREE.Vector3(0, 0, ORBIT_RADIUS);
    basePos.applyQuaternion(orbitQuat.current);
    camera.position.copy(basePos);
    camera.lookAt(0, 0, 0);
  });

  return (
    <>
      <Edges points={points} edges={edges} nodeColors={nodeColors} activeNode={activeNode} pulseNodes={pulseNodes} />
      <Nodes points={points} nodeColors={nodeColors} activeNode={activeNode} pulseNodes={pulseNodes} />
    </>
  );
}

// ─── Exported component ─────────────────────────────────────────────────────

interface NodeSphereProps {
  className?: string;
  style?: React.CSSProperties;
  nodes: SiteNode[];
}

export default function NodeSphere({ className = '', style, nodes }: NodeSphereProps) {
  const router = useRouter();
  const [hovered, setHovered] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const totalNodes = nodes.length;

  const nodeColors = useMemo(() => nodes.map(n => new THREE.Color(n.color)), [nodes]);

  const handleHover = useCallback((index: number | null) => {
    setHovered(index);
  }, []);

  const handleClick = useCallback((index: number) => {
    if (index < nodes.length) {
      router.push(nodes[index].href);
    }
  }, [router, nodes]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (hovered !== null) {
        setTooltipPos({ x: e.clientX, y: e.clientY });
      }
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, [hovered]);

  const hoveredNode = hovered !== null && hovered < nodes.length ? nodes[hovered] : null;

  return (
    <div className={`relative ${className}`} style={{ ...style, touchAction: 'pan-y' }}>
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50, near: 0.1 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <OrbitScene
          nodeCount={totalNodes}
          nodeColors={nodeColors}
          onHover={handleHover}
          onClick={handleClick}
        />
      </Canvas>

      {hoveredNode && (
        <div
          className="fixed pointer-events-none z-50"
          style={{ left: tooltipPos.x + 14, top: tooltipPos.y - 10 }}
        >
          <div
            className="font-mono text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap"
            style={{
              backgroundColor: 'rgba(22, 22, 30, 0.95)',
              border: `1px solid ${hoveredNode.color}40`,
              color: hoveredNode.color,
              boxShadow: `0 4px 16px rgba(0,0,0,0.4), 0 0 8px ${hoveredNode.color}15`,
            }}
          >
            {hoveredNode.label}
            <span className="ml-1.5 text-[#565f89]">{hoveredNode.href}</span>
          </div>
        </div>
      )}
    </div>
  );
}
