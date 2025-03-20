import React, { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GAME_DEFINITIONS } from '@/data/games';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LockIcon, UnlockIcon } from 'lucide-react';

interface PortalPosition {
  x: number;
  y: number;
  z: number;
}

interface FormData {
  title: string;
  description: string;
  url: string;
  color: string;
  glowColor: string;
  coreColor: string;
  position: PortalPosition;
  radius: number;
}

const CreatePortalModal: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    url: '',
    color: '#ffffaa',
    glowColor: '#ffffcc',
    coreColor: '#ffffff',
    position: { x: 0, y: 0, z: 0 },
    radius: 20
  });
  
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const selectedPositionRef = useRef<THREE.Mesh | null>(null);
  const existingPortalsRef = useRef<THREE.Mesh[]>([]);
  
  // Color conversion helper
  const hexToThreeColor = (hex: string): number => {
    return parseInt(hex.replace('#', ''), 16);
  };

  // Handle form changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('position.')) {
      const posKey = name.split('.')[1] as keyof PortalPosition;
      setFormData({
        ...formData,
        position: {
          ...formData.position,
          [posKey]: parseFloat(value) || 0
        }
      });
      
      // Update the position in 3D space
      if (selectedPositionRef.current) {
        const newPos = { ...formData.position, [posKey]: parseFloat(value) || 0 };
        selectedPositionRef.current.position.set(newPos.x, newPos.y, newPos.z);
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
      
      // Update material colors if they changed
      if (['color', 'glowColor', 'coreColor'].includes(name) && selectedPositionRef.current) {
        updatePortalVisualization();
      }
    }
  };
  
  // Update portal visualization based on current form data
  const updatePortalVisualization = () => {
    if (!selectedPositionRef.current) return;
    
    // Update main sphere color
    if (selectedPositionRef.current.material instanceof THREE.MeshBasicMaterial) {
      selectedPositionRef.current.material.color.set(hexToThreeColor(formData.color));
    }
    
    // Update glow and core if they exist
    selectedPositionRef.current.children.forEach(child => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshBasicMaterial) {
        if (child.userData.type === 'glow') {
          child.material.color.set(hexToThreeColor(formData.glowColor));
        } else if (child.userData.type === 'core') {
          child.material.color.set(hexToThreeColor(formData.coreColor));
        }
      }
    });
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Here you would submit to your backend
    console.log('Submitting portal:', formData);
    
    // For now, just close the modal
    setOpen(false);
  };
  
  // Initialize 3D scene
  useEffect(() => {
    if (!open || !mountRef.current) return;
    
    // Set up the scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000008);
    sceneRef.current = scene;
    
    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      2000
    );
    camera.position.set(0, 50, 200);
    cameraRef.current = camera;
    
    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0x303040, 1.2);
    scene.add(ambientLight);
    
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
    
    // Create a marker for selected position
    const selectedPositionMarker = createPortalVisualization(
      formData.position.x,
      formData.position.y,
      formData.position.z,
      formData.radius,
      formData.color,
      formData.glowColor,
      formData.coreColor
    );
    scene.add(selectedPositionMarker);
    selectedPositionRef.current = selectedPositionMarker;
    
    // Add existing portals as markers
    existingPortalsRef.current = GAME_DEFINITIONS
      .filter(game => game.enabled)
      .map(game => {
        const existingPortal = createExistingPortalMarker(
          game.position.x,
          game.position.y,
          game.position.z,
          game.radius
        );
        scene.add(existingPortal);
        return existingPortal;
      });
    
    // Add orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.minDistance = 50;
    controls.maxDistance = 1500;
    controlsRef.current = controls;
    
    // Setup raycaster for clicking in the scene
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    // Handle click to place the portal
    const handleSceneClick = (event: MouseEvent) => {
      if (!mountRef.current) return;
      
      // Calculate mouse position in normalized device coordinates
      const rect = mountRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / mountRef.current.clientWidth) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / mountRef.current.clientHeight) * 2 + 1;
      
      // Update the picking ray with the camera and mouse position
      raycaster.setFromCamera(mouse, camera);
      
      // Check for intersections with the grid
      const gridIntersects = raycaster.intersectObjects([gridHelper]);
      
      if (gridIntersects.length > 0) {
        const point = gridIntersects[0].point;
        
        // Check if the position is valid (not too close to existing portals)
        if (isValidPortalPosition(point, formData.radius)) {
          // Update the marker position
          if (selectedPositionRef.current) {
            selectedPositionRef.current.position.copy(point);
            
            // Update form data
            setFormData({
              ...formData,
              position: {
                x: Math.round(point.x),
                y: Math.round(point.y),
                z: Math.round(point.z)
              }
            });
          }
        }
      }
    };
    
    // Add click event listener
    renderer.domElement.addEventListener('click', handleSceneClick);
    
    // Animation loop
    const animate = () => {
      if (!open) return;
      
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
    
    // Handle resize
    const handleResize = () => {
      if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;
      
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('click', handleSceneClick);
      
      if (mountRef.current && rendererRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
      
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, [open, formData.color, formData.glowColor, formData.coreColor, formData.radius]);
  
  // Helper function to create portal visualization
  const createPortalVisualization = (
    x: number,
    y: number,
    z: number,
    radius: number,
    color: string,
    glowColor: string,
    coreColor: string
  ): THREE.Mesh => {
    // Create the main sphere
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color: hexToThreeColor(color),
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    
    // Add a glow effect
    const glowGeometry = new THREE.SphereGeometry(radius * 1.25, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: hexToThreeColor(glowColor),
      transparent: true,
      opacity: 0.6,
      side: THREE.BackSide
    });
    
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.userData.type = 'glow';
    mesh.add(glow);
    
    // Outer glow for more effect
    const outerGlowGeometry = new THREE.SphereGeometry(radius * 1.6, 32, 32);
    const outerGlowMaterial = new THREE.MeshBasicMaterial({
      color: hexToThreeColor(glowColor),
      transparent: true,
      opacity: 0.3,
      side: THREE.BackSide
    });
    
    const outerGlow = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
    outerGlow.userData.type = 'outerGlow';
    mesh.add(outerGlow);
    
    // Inner bright core
    const coreGeometry = new THREE.SphereGeometry(radius * 0.9, 32, 32);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: hexToThreeColor(coreColor),
      transparent: true,
      opacity: 0.7
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    core.userData.type = 'core';
    mesh.add(core);
    
    return mesh;
  };
  
  // Helper function to create markers for existing portals
  const createExistingPortalMarker = (
    x: number,
    y: number,
    z: number,
    radius: number
  ): THREE.Mesh => {
    // Create a semi-transparent sphere
    const geometry = new THREE.SphereGeometry(radius, 16, 16);
    const material = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.3,
      wireframe: true
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    
    // Add inner sphere for clear visibility
    const innerGeometry = new THREE.SphereGeometry(radius * 0.6, 16, 16);
    const innerMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.5
    });
    
    const inner = new THREE.Mesh(innerGeometry, innerMaterial);
    mesh.add(inner);
    
    return mesh;
  };
  
  // Helper function to check if a position is valid
  const isValidPortalPosition = (position: THREE.Vector3, radius: number): boolean => {
    // Check against existing portals to prevent overlap
    for (const portal of existingPortalsRef.current) {
      const distance = position.distanceTo(portal.position);
      const minDistance = radius + (portal.geometry as THREE.SphereGeometry).parameters.radius;
      
      // If too close to an existing portal, consider invalid
      if (distance < minDistance) {
        return false;
      }
    }
    
    return true;
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button 
          className="text-white/70 hover:text-white text-lg font-bold tracking-wider transition-all duration-300"
          aria-label="Create a portal to your world"
        >
          Create a Portal to Your World
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl bg-black/90 border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl text-white tracking-wider font-bold">Create a Portal to Your World</DialogTitle>
          <DialogDescription className="text-white/70">
            Submit your game to be featured in the Portals collection
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-8 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-white mb-2">
                  Game Title
                </label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="bg-black/50 border-gray-700 text-white"
                  placeholder="My Amazing Game"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-white mb-2">
                  Game Description
                </label>
                <Input
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="bg-black/50 border-gray-700 text-white"
                  placeholder="A brief description of your game"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="url" className="block text-sm font-medium text-white mb-2">
                  Game URL
                </label>
                <Input
                  id="url"
                  name="url"
                  type="url"
                  value={formData.url}
                  onChange={handleChange}
                  className="bg-black/50 border-gray-700 text-white"
                  placeholder="https://yourgame.com/"
                  required
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="color" className="block text-sm font-medium text-white mb-2">
                    Portal Color
                  </label>
                  <div className="flex">
                    <Input
                      id="color"
                      name="color"
                      type="color"
                      value={formData.color}
                      onChange={handleChange}
                      className="h-10 w-10 p-0 border-0"
                    />
                    <Input
                      type="text"
                      value={formData.color}
                      onChange={handleChange}
                      name="color"
                      className="ml-2 flex-grow bg-black/50 border-gray-700 text-white"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="glowColor" className="block text-sm font-medium text-white mb-2">
                    Glow Color
                  </label>
                  <div className="flex">
                    <Input
                      id="glowColor"
                      name="glowColor"
                      type="color"
                      value={formData.glowColor}
                      onChange={handleChange}
                      className="h-10 w-10 p-0 border-0"
                    />
                    <Input
                      type="text"
                      value={formData.glowColor}
                      onChange={handleChange}
                      name="glowColor"
                      className="ml-2 flex-grow bg-black/50 border-gray-700 text-white"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="coreColor" className="block text-sm font-medium text-white mb-2">
                    Core Color
                  </label>
                  <div className="flex">
                    <Input
                      id="coreColor"
                      name="coreColor"
                      type="color"
                      value={formData.coreColor}
                      onChange={handleChange}
                      className="h-10 w-10 p-0 border-0"
                    />
                    <Input
                      type="text"
                      value={formData.coreColor}
                      onChange={handleChange}
                      name="coreColor"
                      className="ml-2 flex-grow bg-black/50 border-gray-700 text-white"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label htmlFor="radius" className="block text-sm font-medium text-white mb-2">
                  Portal Radius
                </label>
                <div className="flex items-center">
                  <Input
                    id="radius"
                    name="radius"
                    type="range"
                    min="10"
                    max="50"
                    step="1"
                    value={formData.radius}
                    onChange={handleChange}
                    className="w-full bg-black/50 h-2"
                    disabled
                  />
                  <span className="ml-2 w-10 text-center text-white/70">{formData.radius}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="ml-2 bg-black/50 border-gray-700"
                    disabled
                  >
                    <LockIcon className="h-4 w-4 text-yellow-500" />
                  </Button>
                  <div className="ml-2 text-xs text-yellow-500">Premium feature</div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="position.x" className="block text-sm font-medium text-white mb-2">
                    Position X
                  </label>
                  <Input
                    id="position.x"
                    name="position.x"
                    type="number"
                    value={formData.position.x}
                    onChange={handleChange}
                    className="bg-black/50 border-gray-700 text-white"
                  />
                </div>
                
                <div>
                  <label htmlFor="position.y" className="block text-sm font-medium text-white mb-2">
                    Position Y
                  </label>
                  <Input
                    id="position.y"
                    name="position.y"
                    type="number"
                    value={formData.position.y}
                    onChange={handleChange}
                    className="bg-black/50 border-gray-700 text-white"
                  />
                </div>
                
                <div>
                  <label htmlFor="position.z" className="block text-sm font-medium text-white mb-2">
                    Position Z
                  </label>
                  <Input
                    id="position.z"
                    name="position.z"
                    type="number"
                    value={formData.position.z}
                    onChange={handleChange}
                    className="bg-black/50 border-gray-700 text-white"
                  />
                </div>
              </div>
            </div>
            
            <div className="h-[500px] relative rounded-lg overflow-hidden bg-black/30 border border-gray-800">
              <div 
                ref={mountRef}
                className="absolute inset-0"
              />
              <div className="absolute bottom-4 left-4 right-4 p-4 bg-black/70 rounded text-xs text-white/70">
                Click in the grid to position your portal. Red spheres show existing portals.
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Submit for Approval
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePortalModal;