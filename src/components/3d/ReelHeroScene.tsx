'use client';

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Rotating 3D Film Reel Mesh
function FilmReel() {
  const meshRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.4;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.15;
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.15;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z -= delta * 0.6;
    }
  });

  return (
    <group ref={meshRef} position={[0, 0, 0]}>
      {/* Outer Reel Ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[1.7, 0.08, 16, 50]} />
        <meshStandardMaterial
          color="#E50914"
          emissive="#7A0008"
          emissiveIntensity={0.6}
          roughness={0.2}
          metalness={0.9}
        />
      </mesh>

      {/* Center Reel Core */}
      <mesh>
        <cylinderGeometry args={[0.55, 0.55, 0.3, 32]} />
        <meshStandardMaterial
          color="#151515"
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>

      {/* Spoke Spokes (Film Reel cutouts) */}
      {[0, 60, 120, 180, 240, 300].map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        return (
          <group key={i} rotation={[0, 0, rad]}>
            <mesh position={[0.9, 0, 0]}>
              <boxGeometry args={[0.9, 0.06, 0.1]} />
              <meshStandardMaterial
                color="#E50914"
                roughness={0.3}
                metalness={0.8}
              />
            </mesh>
            <mesh position={[1.1, 0, 0.05]}>
              <sphereGeometry args={[0.07, 12, 12]} />
              <meshStandardMaterial
                color="#ffffff"
                emissive="#E50914"
                emissiveIntensity={0.8}
              />
            </mesh>
          </group>
        );
      })}

      {/* Floating accent ring */}
      <mesh rotation={[Math.PI / 4, 0, 0]}>
        <torusGeometry args={[2.3, 0.02, 16, 60]} />
        <meshBasicMaterial color="#E50914" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

// Glowing Red Particles
function RedParticles({ count = 120 }) {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const colorA = new THREE.Color('#E50914');
    const colorB = new THREE.Color('#B00020');

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 8;

      const c = Math.random() > 0.5 ? colorA : colorB;
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return [pos, col];
  }, [count]);

  useFrame((state, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.05;
      pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.08;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        vertexColors
        transparent
        opacity={0.7}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default function ReelHeroScene() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-transparent pointer-events-none">
        <div className="w-48 h-48 rounded-full border border-primary/20 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-85">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.4} />
        <spotLight
          position={[5, 6, 4]}
          angle={0.6}
          penumbra={0.8}
          intensity={2.5}
          color="#ff3344"
        />
        <pointLight position={[-4, -2, -2]} intensity={1.2} color="#E50914" />
        <FilmReel />
        <RedParticles count={150} />
      </Canvas>
    </div>
  );
}
