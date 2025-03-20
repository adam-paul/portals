import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GAME_DEFINITIONS } from '@/data/games';

interface WorldVisualizerProps {
  position: { x: number; y: number; z: number };
  radius: number;
  color: string;
  glowColor: string;
  coreColor: string;
  onPositionChange: (pos: { x: number; y: number; z: number }) => void;
}

const WorldVisualizer: React.FC<WorldVisualizerProps> = ({
  position,
  radius,
  color,
  glowColor,
  coreColor,
  onPositionChange,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const selectedPositionRef = useRef<THREE.Mesh | null>(null);
  const existingPortalsRef = useRef<THREE.Mesh[]>([]);

  const hexToThreeColor = (hex: string): number => parseInt(hex.replace('#', ''), 16);

  const createPortalVisualization = (
    x: number, y: number, z: number, r: number, c: string, gc: string, cc: string
  ) => {
    const geometry = new THREE.SphereGeometry(r, 32, 32);
    const material = new THREE.MeshBasicMaterial({ color: hexToThreeColor(c) });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    
    // Add a glow effect
    const glowGeometry = new THREE.SphereGeometry(r * 1.25, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: hexToThreeColor(gc),
      transparent: true,
      opacity: 0.6,
      side: THREE.BackSide
    });
    
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.userData.type = 'glow';
    mesh.add(glow);
    
    // Outer glow for more effect
    const outerGlowGeometry = new THREE.SphereGeometry(r * 1.6, 32, 32);
    const outerGlowMaterial = new THREE.MeshBasicMaterial({
      color: hexToThreeColor(gc),
      transparent: true,
      opacity: 0.3,
      side: THREE.BackSide
    });
    
    const outerGlow = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
    outerGlow.userData.type = 'outerGlow';
    mesh.add(outerGlow);
    
    // Inner bright core
    const coreGeometry = new THREE.SphereGeometry(r * 0.9, 32, 32);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: hexToThreeColor(cc),
      transparent: true,
      opacity: 0.7
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    core.userData.type = 'core';
    mesh.add(core);
    
    return mesh;
  };

  const createExistingPortalMarker = (x: number, y: number, z: number, r: number) => {
    const geometry = new THREE.SphereGeometry(r, 16, 16);
    const material = new THREE.MeshBasicMaterial({ 
      color: 0xff0000, 
      transparent: true, 
      opacity: 0.3, 
      wireframe: true 
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    
    // Add inner sphere for clear visibility
    const innerGeometry = new THREE.SphereGeometry(r * 0.6, 16, 16);
    const innerMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.5
    });
    
    const inner = new THREE.Mesh(innerGeometry, innerMaterial);
    mesh.add(inner);
    
    return mesh;
  };

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000008);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 2000); // Aspect ratio set later
    camera.position.set(0, 50, 200);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    rendererRef.current = renderer;

    // Initial sizing
    const resizeRenderer = () => {
      if (mountRef.current) {
        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }
    };
    resizeRenderer();
    mountRef.current.appendChild(renderer.domElement);

    // Lights, grid, etc.
    scene.add(new THREE.AmbientLight(0x303040, 1.2));
    
    const directionalLight = new THREE.DirectionalLight(0xeef0ff, 1.2);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    
    // Grid for reference
    const gridHelper = new THREE.GridHelper(1000, 10, 0x444444, 0x222222);
    scene.add(gridHelper);
    
    // Vertical grid for reference
    const verticalGridXZ = new THREE.GridHelper(1000, 10, 0x444444, 0x222222);
    verticalGridXZ.rotation.x = Math.PI / 2;
    verticalGridXZ.position.y = 500;
    scene.add(verticalGridXZ);
    
    const verticalGridXZ2 = new THREE.GridHelper(1000, 10, 0x444444, 0x222222);
    verticalGridXZ2.rotation.x = Math.PI / 2;
    verticalGridXZ2.position.y = -500;
    scene.add(verticalGridXZ2);
    
    const verticalGridYZ = new THREE.GridHelper(1000, 10, 0x444444, 0x222222);
    verticalGridYZ.rotation.z = Math.PI / 2;
    verticalGridYZ.position.x = 500;
    scene.add(verticalGridYZ);
    
    const verticalGridYZ2 = new THREE.GridHelper(1000, 10, 0x444444, 0x222222);
    verticalGridYZ2.rotation.z = Math.PI / 2;
    verticalGridYZ2.position.x = -500;
    scene.add(verticalGridYZ2);
    
    // Coordinate axes
    const axesHelper = new THREE.AxesHelper(50);
    scene.add(axesHelper);

    // Portal marker
    const marker = createPortalVisualization(
      position.x, 
      position.y, 
      position.z, 
      radius, 
      color, 
      glowColor, 
      coreColor
    );
    scene.add(marker);
    selectedPositionRef.current = marker;

    // Existing portals
    existingPortalsRef.current = [];
    GAME_DEFINITIONS
      .filter(game => game.enabled)
      .forEach(game => {
        const existingPortal = createExistingPortalMarker(
          game.position.x,
          game.position.y,
          game.position.z,
          game.radius
        );
        scene.add(existingPortal);
        existingPortalsRef.current.push(existingPortal);
      });

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.minDistance = 50;
    controls.maxDistance = 1500;
    controlsRef.current = controls;

    // Click handling
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const onClick = (event: MouseEvent) => {
      const rect = mountRef.current!.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects([gridHelper]);
      if (intersects.length > 0) {
        const point = intersects[0].point;
        marker.position.copy(point);
        onPositionChange({ 
          x: Math.round(point.x), 
          y: Math.round(point.y), 
          z: Math.round(point.z) 
        });
      }
    };
    renderer.domElement.addEventListener('click', onClick);

    // Animation
    const animate = () => {
      const frameId = requestAnimationFrame(animate);
      
      // Add any animations here
      if (selectedPositionRef.current) {
        // Make the portal pulse slightly
        const time = Date.now() * 0.001;
        const pulseFactor = 1 + Math.sin(time * 1.5) * 0.1;
        
        // Animate the glow
        selectedPositionRef.current.children.forEach(child => {
          if (child instanceof THREE.Mesh) {
            if (child.userData.type === 'glow') {
              child.scale.set(pulseFactor, pulseFactor, pulseFactor);
            } else if (child.userData.type === 'outerGlow') {
              child.scale.set(pulseFactor * 1.1, pulseFactor * 1.1, pulseFactor * 1.1);
            } else if (child.userData.type === 'core') {
              child.scale.set(pulseFactor * 0.95, pulseFactor * 0.95, pulseFactor * 0.95);
            }
          }
        });
      }
      
      // Render
      if (controlsRef.current) controlsRef.current.update();
      if (rendererRef.current && cameraRef.current && sceneRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      
      return () => {
        cancelAnimationFrame(frameId);
      };
    };
    animate();

    // Resize observer
    const observer = new ResizeObserver(resizeRenderer);
    observer.observe(mountRef.current);

    return () => {
      renderer.domElement.removeEventListener('click', onClick);
      if (mountRef.current && renderer.domElement.parentElement === mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      observer.disconnect();
      renderer.dispose();
      controls.dispose();
    };
  }, []); // Empty dependency array since props are handled externally

  // Update position when it changes externally
  useEffect(() => {
    if (selectedPositionRef.current) {
      selectedPositionRef.current.position.set(position.x, position.y, position.z);
    }
  }, [position]);

  return <div ref={mountRef} className="w-full h-full" />;
};

export default WorldVisualizer;