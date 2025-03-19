import * as THREE from 'three';
import React, { useRef, useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

// Explicitly extend THREE to the global scope
if (typeof window !== 'undefined') {
  (window as any).THREE = THREE;
}

interface GameModeProps {
  onExit: () => void;
}

// Particle component for Three.js
const Particle = ({ position, color }: { position: [number, number, number]; color: string }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  return (
    <mesh ref={meshRef} position={position}>
      <octahedronGeometry args={[0.5]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
};

// Scene component to manage 3D content
const Scene = () => {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <Particle position={[0, 0, 0]} color="white" />
      <OrbitControls enableZoom={true} enablePan={true} enableRotate={true} />
    </>
  );
};

const GameMode: React.FC<GameModeProps> = ({ onExit }) => {
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Handle exit button click
  const handleExitClick = () => {
    setShowExitDialog(true);
  };
  
  // Handle dialog confirm
  const handleConfirmExit = () => {
    setShowExitDialog(false);
    onExit();
  };

  return (
    <div className="fixed inset-0 z-0">
      <Suspense fallback={
        <div className="fixed inset-0 bg-black flex items-center justify-center">
          <div className="text-white text-xl">Initializing 3D Environment...</div>
        </div>
      }>
        <Canvas
          gl={{ antialias: true }}
          camera={{ position: [0, 0, 10], fov: 75 }}
          style={{ background: 'black' }}
          onCreated={() => setIsLoaded(true)}
        >
          <Scene />
        </Canvas>
      </Suspense>
      
      {/* Only show UI elements after Three.js is initialized */}
      {isLoaded && (
        <>
          {/* Exit Button */}
          <button 
            onClick={handleExitClick}
            className="fixed bottom-6 right-6 z-50 text-white/70 hover:text-white text-lg font-bold tracking-wider transition-colors"
            aria-label="Exit game mode"
          >
            EXIT
          </button>
          
          {/* Custom Exit Dialog */}
          {showExitDialog && (
            <div 
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              onClick={() => setShowExitDialog(false)}
            >
              <div 
                className="bg-space-gray/50 border border-white/20 p-10 shadow-none w-96 rounded-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-8 text-center">
                  <h2 className="text-xl font-bold tracking-wider text-white/70">Return to Game Menu?</h2>
                </div>
                
                <div className="flex justify-center space-x-10">
                  <button 
                    onClick={handleConfirmExit}
                    className="text-white/70 hover:text-white text-lg font-bold tracking-widest uppercase transition-colors"
                  >
                    YES
                  </button>
                  <button 
                    onClick={() => setShowExitDialog(false)}
                    className="text-white/70 hover:text-white text-lg font-bold tracking-widest uppercase transition-colors"
                  >
                    NO
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default GameMode;
