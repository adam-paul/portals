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
  const positionIndicatorRef = useRef<THREE.Group | null>(null);

  const hexToThreeColor = (hex: string): number => parseInt(hex.replace('#', ''), 16);

  // Helper function to create cubic grid
  const createCubicGrid = () => {
    const size = 1000;
    const halfSize = size / 2;
    const divisions = 10;
    const spacing = size / divisions;
    const gridGroup = new THREE.Group();
    
    // Grid line material
    const gridMaterial = new THREE.LineBasicMaterial({
      color: 0x444499,
      transparent: true,
      opacity: 0.2
    });
    
    // Function to create a grid on a specific plane
    const createGridOnPlane = (plane: string) => {
      const vertices = [];
      
      // Create lines in both directions
      for (let i = -halfSize; i <= halfSize; i += spacing) {
        if (plane === 'xy') {
          // Lines along X axis on XY plane
          vertices.push(
            -halfSize, i, 0,
            halfSize, i, 0
          );
          
          // Lines along Y axis on XY plane
          vertices.push(
            i, -halfSize, 0,
            i, halfSize, 0
          );
        } else if (plane === 'xz') {
          // Lines along X axis on XZ plane
          vertices.push(
            -halfSize, 0, i,
            halfSize, 0, i
          );
          
          // Lines along Z axis on XZ plane
          vertices.push(
            i, 0, -halfSize,
            i, 0, halfSize
          );
        } else if (plane === 'yz') {
          // Lines along Y axis on YZ plane
          vertices.push(
            0, -halfSize, i,
            0, halfSize, i
          );
          
          // Lines along Z axis on YZ plane
          vertices.push(
            0, i, -halfSize,
            0, i, halfSize
          );
        }
      }
      
      // Create geometry from vertices
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      
      return new THREE.LineSegments(geometry, gridMaterial);
    };
    
    // Create grid at each major intersection plane
    const mainPlaneGrid = createGridOnPlane('xy');
    const sidePlaneGrid1 = createGridOnPlane('xz');
    const sidePlaneGrid2 = createGridOnPlane('yz');
    
    // Position grids at various depths to create the cubic grid effect
    for (let i = -halfSize; i <= halfSize; i += spacing) {
      // Skip center planes as they'll be handled by main planes
      if (i === 0) continue;
      
      // XY planes at different Z
      const xyGrid = mainPlaneGrid.clone();
      xyGrid.position.z = i;
      gridGroup.add(xyGrid);
      
      // XZ planes at different Y
      const xzGrid = sidePlaneGrid1.clone();
      xzGrid.position.y = i;
      gridGroup.add(xzGrid);
      
      // YZ planes at different X
      const yzGrid = sidePlaneGrid2.clone();
      yzGrid.position.x = i;
      gridGroup.add(yzGrid);
    }
    
    // Add the main center planes with different color
    const centerMaterial = new THREE.LineBasicMaterial({
      color: 0x4444bb,
      transparent: true,
      opacity: 0.4
    });
    
    const centerXYGrid = createGridOnPlane('xy');
    centerXYGrid.material = centerMaterial;
    gridGroup.add(centerXYGrid);
    
    const centerXZGrid = createGridOnPlane('xz');
    centerXZGrid.material = centerMaterial;
    gridGroup.add(centerXZGrid);
    
    const centerYZGrid = createGridOnPlane('yz');
    centerYZGrid.material = centerMaterial;
    gridGroup.add(centerYZGrid);
    
    // Add cube edges for clarity
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: 0x6666dd,
      linewidth: 1.5
    });
    
    const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(size, size, size));
    const cubeEdges = new THREE.LineSegments(edges, edgeMaterial);
    gridGroup.add(cubeEdges);
    
    // Add coordinate axes
    const axisLength = size * 0.55;
    
    // X-axis (red)
    const xAxisGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(axisLength, 0, 0)
    ]);
    const xAxis = new THREE.Line(xAxisGeo, new THREE.LineBasicMaterial({ color: 0xff2222, linewidth: 2 }));
    gridGroup.add(xAxis);
    
    // Y-axis (green)
    const yAxisGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, axisLength, 0)
    ]);
    const yAxis = new THREE.Line(yAxisGeo, new THREE.LineBasicMaterial({ color: 0x22ff22, linewidth: 2 }));
    gridGroup.add(yAxis);
    
    // Z-axis (blue)
    const zAxisGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, axisLength)
    ]);
    const zAxis = new THREE.Line(zAxisGeo, new THREE.LineBasicMaterial({ color: 0x2222ff, linewidth: 2 }));
    gridGroup.add(zAxis);
    
    return gridGroup;
  };

  // Create position indicator
  const addPositionIndicator = (scene: THREE.Scene) => {
    const group = new THREE.Group();
    
    // Main sphere
    const indicatorGeometry = new THREE.SphereGeometry(5, 16, 16);
    const indicatorMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.7
    });
    
    const indicatorSphere = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
    group.add(indicatorSphere);
    
    // Add coordinate axes to show position clearly
    const axisLength = 15;
    const axisWidth = 1;
    
    // X axis (red)
    const xAxisGeometry = new THREE.BoxGeometry(axisLength, axisWidth, axisWidth);
    const xAxisMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const xAxis = new THREE.Mesh(xAxisGeometry, xAxisMaterial);
    xAxis.position.x = axisLength / 2;
    group.add(xAxis);
    
    // Y axis (green)
    const yAxisGeometry = new THREE.BoxGeometry(axisWidth, axisLength, axisWidth);
    const yAxisMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const yAxis = new THREE.Mesh(yAxisGeometry, yAxisMaterial);
    yAxis.position.y = axisLength / 2;
    group.add(yAxis);
    
    // Z axis (blue)
    const zAxisGeometry = new THREE.BoxGeometry(axisWidth, axisWidth, axisLength);
    const zAxisMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    const zAxis = new THREE.Mesh(zAxisGeometry, zAxisMaterial);
    zAxis.position.z = axisLength / 2;
    group.add(zAxis);
    
    group.visible = false;
    scene.add(group);
    
    return group;
  };

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

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000008);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 2000); // Aspect ratio set later
    camera.position.set(400, 300, 600);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
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

    // Lights
    scene.add(new THREE.AmbientLight(0x303040, 1.2));
    
    const directionalLight = new THREE.DirectionalLight(0xeef0ff, 1.2);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    
    // Add cubic grid
    const gridHelper = createCubicGrid();
    scene.add(gridHelper);

    // Create invisible volume for raycasting
    const cubeSize = 500;
    const invisibleCube = new THREE.Mesh(
      new THREE.BoxGeometry(cubeSize * 2, cubeSize * 2, cubeSize * 2),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    invisibleCube.visible = false;
    scene.add(invisibleCube);

    // Position indicator
    const positionIndicator = addPositionIndicator(scene);
    positionIndicatorRef.current = positionIndicator;

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
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.rotateSpeed = 0.7;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;
    controls.screenSpacePanning = true;
    controls.target.set(0, 0, 0);
    controls.update();
    controlsRef.current = controls;

    // Raycaster for clicking in the scene
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // Handle click to place the portal
    const handleSceneClick = (event: MouseEvent) => {
      if (!mountRef.current) return;

      // If position indicator is visible, use it
      if (positionIndicator.visible) {
        const position = positionIndicator.position.clone();
        
        // Check if the position is valid
        if (isValidPortalPosition(position, radius)) {
          // Update the marker position
          if (selectedPositionRef.current) {
            selectedPositionRef.current.position.copy(position);
            
            // Update form data via callback
            onPositionChange({
              x: Math.round(position.x),
              y: Math.round(position.y),
              z: Math.round(position.z)
            });
            
            // Provide visual feedback - flash the marker
            const mainSphere = positionIndicator.children[0] as THREE.Mesh;
            if (mainSphere && mainSphere.material instanceof THREE.MeshBasicMaterial) {
              // Store original color
              const originalColor = mainSphere.material.color.clone();
              
              // Flash bright white
              mainSphere.material.color.set(0xffffff);
              
              // Restore after a short delay
              setTimeout(() => {
                if (mainSphere && mainSphere.material instanceof THREE.MeshBasicMaterial) {
                  mainSphere.material.color.copy(originalColor);
                }
              }, 200);
            }
          }
        } else {
          // Provide feedback for invalid position - flash red
          const mainSphere = positionIndicator.children[0] as THREE.Mesh;
          if (mainSphere && mainSphere.material instanceof THREE.MeshBasicMaterial) {
            // Store original color
            const originalColor = mainSphere.material.color.clone();
            
            // Flash bright red
            mainSphere.material.color.set(0xff0000);
            
            // Restore after a short delay
            setTimeout(() => {
              if (mainSphere && mainSphere.material instanceof THREE.MeshBasicMaterial) {
                mainSphere.material.color.copy(originalColor);
              }
            }, 200);
          }
        }
      }
    };

    // Handle mouse move for position indicator
    const handleMouseMove = (event: MouseEvent) => {
      if (!mountRef.current) return;
      
      // Calculate mouse position in normalized device coordinates
      const rect = mountRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      // Update the picking ray with the camera and mouse position
      raycaster.setFromCamera(mouse, camera);
      
      // Try to intersect with the invisible cube
      const boxIntersects = raycaster.intersectObject(invisibleCube);
      
      let bestPosition = null;
      
      // If we hit the box, use that intersection point
      if (boxIntersects.length > 0) {
        bestPosition = boxIntersects[0].point.clone();
      }
      // If no intersection with the box, use a plane intersection approach
      else {
        // Determine which plane to use based on camera direction
        const cameraDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        
        // Find which axis the camera is most aligned with
        const absX = Math.abs(cameraDirection.x);
        const absY = Math.abs(cameraDirection.y);
        const absZ = Math.abs(cameraDirection.z);
        
        // Create an invisible plane perpendicular to the dominant camera direction
        const planeNormal = new THREE.Vector3();
        if (absX >= absY && absX >= absZ) {
          // Camera looking mostly along X-axis
          planeNormal.set(Math.sign(cameraDirection.x), 0, 0);
        } else if (absY >= absX && absY >= absZ) {
          // Camera looking mostly along Y-axis
          planeNormal.set(0, Math.sign(cameraDirection.y), 0);
        } else {
          // Camera looking mostly along Z-axis
          planeNormal.set(0, 0, Math.sign(cameraDirection.z));
        }
        
        // Position the plane at the far side of the cube relative to the camera
        const planeDist = cubeSize;
        const planePosition = new THREE.Vector3().copy(planeNormal).multiplyScalar(planeDist);
        const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(planeNormal, planePosition);
        
        // Intersect ray with the plane
        const intersection = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(plane, intersection)) {
          // Clamp to cube boundaries
          intersection.x = Math.max(-cubeSize, Math.min(cubeSize, intersection.x));
          intersection.y = Math.max(-cubeSize, Math.min(cubeSize, intersection.y));
          intersection.z = Math.max(-cubeSize, Math.min(cubeSize, intersection.z));
          
          bestPosition = intersection;
        }
        
        // If still no intersection, use the center of the cube as fallback
        if (!bestPosition) {
          // Project the ray to the center of the cube
          const cubeCenter = new THREE.Vector3(0, 0, 0);
          const directionToCenter = cubeCenter.clone().sub(camera.position).normalize();
          
          // Scale direction vector to reach into the cube
          const scaledDirection = directionToCenter.clone().multiplyScalar(1000);
          bestPosition = camera.position.clone().add(scaledDirection);
          
          // Clamp to cube boundaries
          bestPosition.x = Math.max(-cubeSize, Math.min(cubeSize, bestPosition.x));
          bestPosition.y = Math.max(-cubeSize, Math.min(cubeSize, bestPosition.y));
          bestPosition.z = Math.max(-cubeSize, Math.min(cubeSize, bestPosition.z));
        }
      }
      
      // If we found a position in the cube
      if (bestPosition) {
        // Round to grid units
        const gridSize = 10;
        bestPosition.x = Math.round(bestPosition.x / gridSize) * gridSize;
        bestPosition.y = Math.round(bestPosition.y / gridSize) * gridSize;
        bestPosition.z = Math.round(bestPosition.z / gridSize) * gridSize;
        
        // Update the position indicator
        positionIndicator.position.copy(bestPosition);
        positionIndicator.visible = true;
        
        // Change color based on validity
        const isValid = isValidPortalPosition(bestPosition, radius);
        const indicatorColor = isValid ? 0x00ff00 : 0xff0000;
        
        // Update the color of the main sphere (first child)
        const mainSphere = positionIndicator.children[0] as THREE.Mesh;
        if (mainSphere && mainSphere.material instanceof THREE.MeshBasicMaterial) {
          mainSphere.material.color.set(indicatorColor);
        }
      } else {
        positionIndicator.visible = false;
      }
    };

    // Add event listeners
    renderer.domElement.addEventListener('click', handleSceneClick);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);

    // Add help button and panel
    const helpButton = document.createElement('button');
    helpButton.className = 'absolute bottom-4 left-4 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm transition-all';
    helpButton.innerHTML = '?';
    helpButton.title = 'Show Controls';
    helpButton.style.zIndex = '10';
    mountRef.current.appendChild(helpButton);
    
    // Create help panel (initially hidden)
    const helpPanel = document.createElement('div');
    helpPanel.className = 'absolute bottom-4 left-4 p-4 bg-black/70 rounded text-xs text-white/70 w-64 transition-all transform scale-0 origin-bottom-left';
    helpPanel.style.zIndex = '5';
    helpPanel.innerHTML = `
      <div class="flex justify-between items-center mb-2">
        <div class="font-bold">3D Controls</div>
        <button class="text-white/70 hover:text-white">✕</button>
      </div>
      <div>• Drag - Rotate the view</div>
      <div>• Scroll - Zoom in/out</div>
      <div>• Middle Mouse/Shift+Drag - Pan the view</div>
      <div>• Move mouse - Position portal anywhere</div>
      <div>• Click - Place at highlighted position</div>
      <div class="mt-2">Red spheres show existing portals which you cannot overlap.</div>
    `;
    mountRef.current.appendChild(helpPanel);
    
    // Add toggle functionality
    let helpVisible = false;
    const toggleHelp = () => {
      helpVisible = !helpVisible;
      
      if (helpVisible) {
        helpPanel.style.transform = 'scale(1)';
        helpButton.style.opacity = '0.5';
      } else {
        helpPanel.style.transform = 'scale(0)';
        helpButton.style.opacity = '1';
      }
    };
    
    helpButton.addEventListener('click', toggleHelp);
    
    // Close button in panel
    const closeButton = helpPanel.querySelector('button');
    if (closeButton) {
      closeButton.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleHelp();
      });
    }

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
      // Remove event listeners
      renderer.domElement.removeEventListener('click', handleSceneClick);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      
      // Remove UI elements
      if (helpButton && mountRef.current.contains(helpButton)) {
        mountRef.current.removeChild(helpButton);
      }
      
      if (helpPanel && mountRef.current.contains(helpPanel)) {
        mountRef.current.removeChild(helpPanel);
      }
      
      // Clean up event listeners
      helpButton.removeEventListener('click', toggleHelp);
      if (closeButton) {
        closeButton.removeEventListener('click', (e) => e.stopPropagation());
      }
      
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

  // Update visualization when colors change
  useEffect(() => {
    if (selectedPositionRef.current) {
      // Update main sphere color
      if (selectedPositionRef.current.material instanceof THREE.MeshBasicMaterial) {
        selectedPositionRef.current.material.color.set(hexToThreeColor(color));
      }
      
      // Update glow and core
      selectedPositionRef.current.children.forEach(child => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshBasicMaterial) {
          if (child.userData.type === 'glow' || child.userData.type === 'outerGlow') {
            child.material.color.set(hexToThreeColor(glowColor));
          } else if (child.userData.type === 'core') {
            child.material.color.set(hexToThreeColor(coreColor));
          }
        }
      });
    }
  }, [color, glowColor, coreColor]);

  return <div ref={mountRef} className="w-full h-full" />;
};

export default WorldVisualizer;