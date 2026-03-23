import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sphere, MeshDistortMaterial, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { spatialAudio } from '@/lib/spatial_audio_service';

const AgentSwarm = ({ count = 300 }) => {
  const points = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        p[i * 3] = (Math.random() - 0.5) * 10;
        p[i * 3 + 1] = (Math.random() - 0.5) * 10;
        p[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return p;
  }, [count]);

  const swarmRef = useRef<THREE.Points>(null!);

  useFrame((state) => {
    if (!swarmRef.current) return;
    swarmRef.current.rotation.y += 0.001;
    swarmRef.current.rotation.x += 0.0005;
    
    // Pulse effect
    const s = 1 + Math.sin(state.clock.getElapsedTime()) * 0.05;
    swarmRef.current.scale.set(s, s, s);
  });

  return (
    <Points ref={swarmRef} positions={points} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#3b82f6"
        size={0.15}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
};

const ActivityLines = () => {
  const lineRef = useRef<THREE.Group>(null!);
  
  useFrame((state) => {
    if (!lineRef.current) return;
    lineRef.current.children.forEach((child, i) => {
      const material = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
      material.opacity = 0.1 + Math.sin(state.clock.getElapsedTime() * 5 + i) * 0.1;
    });
  });

  return (
    <group ref={lineRef}>
      {[...Array(4)].map((_, i) => (
        <mesh key={i} rotation={[0, 0, (i * Math.PI) / 2]}>
          <boxGeometry args={[8, 0.01, 0.01]} />
          <meshBasicMaterial color="#3b82f6" transparent opacity={0.2} />
        </mesh>
      ))}
    </group>
  );
};

const DepartmentNodes = () => {
  const nodes = [
    { pos: [4, 0, 0], color: "#ef4444", label: "Dev" },
    { pos: [-4, 0, 0], color: "#10b981", label: "Design" },
    { pos: [0, 4, 0], color: "#f59e0b", label: "Growth" },
    { pos: [0, -4, 0], color: "#6366f1", label: "Security" },
  ];

  return (
    <>
      {nodes.map((node, i) => (
        <Float key={i} position={node.pos as [number, number, number]} speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          <Sphere args={[0.8, 32, 32]}>
            <MeshDistortMaterial
              color={node.color}
              speed={3}
              distort={0.4}
              radius={1}
              transparent
              opacity={0.6}
            />
          </Sphere>
        </Float>
      ))}
    </>
  );
};

const AgencySpatialView = () => {
  useEffect(() => {
    spatialAudio.init();
    spatialAudio.playAmbientHum(0.8);
  }, []);

  return (
    <div className="w-full h-full min-h-[500px] relative overflow-hidden rounded-[2.5rem] bg-slate-950 border border-white/10 shadow-2xl">
      <Canvas camera={{ position: [0, 0, 15], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <AgentSwarm />
        <DepartmentNodes />
        <ActivityLines />
      </Canvas>
      <div className="absolute inset-0 pointer-events-none p-8 flex flex-col justify-between">
         <div className="flex justify-between items-start">
            <div className="glass-card bg-white/5 border-white/10 px-4 py-2 rounded-xl">
               <span className="text-[10px] font-black uppercase text-primary tracking-widest">Spatial Hub</span>
               <h3 className="text-white text-lg font-black leading-none">Swarm Visualizer</h3>
            </div>
            <div className="text-right">
                <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">Active nodes</span>
                <div className="text-white text-2xl font-black">342 Agents</div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default AgencySpatialView;
