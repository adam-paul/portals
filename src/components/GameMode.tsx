import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface GameModeProps {
  onExit: () => void;
}

const GameMode: React.FC<GameModeProps> = ({ onExit }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [thrust, setThrust] = useState(false);
  
  useEffect(() => {
    if (!mountRef.current) return;
    
    // Store the current value to use in the cleanup function
    const mountNode = mountRef.current;
    
    // Initialize Three.js scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000008); // Slightly brighter space blue
    
    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75, 
      window.innerWidth / window.innerHeight, 
      0.1, 
      2000
    );
    camera.position.z = 10; // Position camera behind the spaceship
    camera.position.y = 3;
    
    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    mountNode.appendChild(renderer.domElement);
    
    // Physics variables
    const shipPhysics = {
      position: new THREE.Vector3(0, 0, 0),
      velocity: new THREE.Vector3(0, 0, 0),
      rotation: new THREE.Euler(0, 0, 0),
      direction: new THREE.Vector3(0, 0, -1), // Initial direction (forward)
      maxSpeed: 0.15,
      acceleration: 0.01,
      drag: 0.99,
      rotationSpeed: 0.03,  // Speed of rotation
      moveSpeed: 0.05       // Speed for direct WASD movement
    };
    
    const shipControls = {
      thrust: false,
      left: false,    // A/Left Arrow - Yaw left
      right: false,   // D/Right Arrow - Yaw right
      up: false,      // R - Move up
      down: false,    // F - Move down
      pitchUp: false, // W - Pitch up
      pitchDown: false, // S - Pitch down
      rollLeft: false,  // Q - Roll left
      rollRight: false, // E - Roll right
      upward: false,
      downward: false
    };
    
    // Create a starfield backdrop
    const createStarfield = () => {
      // Small stars (lots of them)
      const starsGeometry = new THREE.BufferGeometry();
      const starsMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.3,
        sizeAttenuation: true
      });
      
      const starsCount = 15000;
      const starsPositions = new Float32Array(starsCount * 3);
      
      for (let i = 0; i < starsCount * 3; i += 3) {
        starsPositions[i] = (Math.random() - 0.5) * 2000;
        starsPositions[i + 1] = (Math.random() - 0.5) * 2000;
        starsPositions[i + 2] = (Math.random() - 0.5) * 2000;
      }
      
      starsGeometry.setAttribute('position', new THREE.BufferAttribute(starsPositions, 3));
      const stars = new THREE.Points(starsGeometry, starsMaterial);
      scene.add(stars);
      
      // Bright foreground stars (fewer, bigger)
      const brightStarsGeometry = new THREE.BufferGeometry();
      const brightStarsMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.5,
        sizeAttenuation: true
      });
      
      const brightStarsCount = 500;
      const brightStarsPositions = new Float32Array(brightStarsCount * 3);
      
      for (let i = 0; i < brightStarsCount * 3; i += 3) {
        brightStarsPositions[i] = (Math.random() - 0.5) * 1000;
        brightStarsPositions[i + 1] = (Math.random() - 0.5) * 1000;
        brightStarsPositions[i + 2] = (Math.random() - 0.5) * 1000;
      }
      
      brightStarsGeometry.setAttribute('position', new THREE.BufferAttribute(brightStarsPositions, 3));
      const brightStars = new THREE.Points(brightStarsGeometry, brightStarsMaterial);
      scene.add(brightStars);
      
      // Create a milky way effect
      // This creates a disk of stars to simulate the galaxy
      const milkyWayGeometry = new THREE.BufferGeometry();
      const milkyWayMaterial = new THREE.PointsMaterial({
        color: 0xccddff,
        size: 0.3,
        sizeAttenuation: true
      });
      
      const galaxyStarsCount = 10000;
      const galaxyStarsPositions = new Float32Array(galaxyStarsCount * 3);
      const galaxyColors = new Float32Array(galaxyStarsCount * 3);
      
      // Create a disk-like distribution for the galaxy
      for (let i = 0; i < galaxyStarsCount; i++) {
        const radius = 100 + Math.random() * 900; // Distance from center
        const theta = Math.random() * Math.PI * 2; // Angle around disk
        const height = (Math.random() - 0.5) * 100; // Thickness of disk
        
        galaxyStarsPositions[i * 3] = radius * Math.cos(theta);
        galaxyStarsPositions[i * 3 + 1] = height;
        galaxyStarsPositions[i * 3 + 2] = radius * Math.sin(theta);
        
        // Add colors for the milky way (blue-white to yellow-white)
        const mixFactor = Math.random();
        galaxyColors[i * 3] = 0.8 + mixFactor * 0.2; // Red (more in center)
        galaxyColors[i * 3 + 1] = 0.8 + mixFactor * 0.2; // Green
        galaxyColors[i * 3 + 2] = 0.9 + mixFactor * 0.1; // Blue (more on edges)
      }
      
      milkyWayGeometry.setAttribute('position', new THREE.BufferAttribute(galaxyStarsPositions, 3));
      milkyWayGeometry.setAttribute('color', new THREE.BufferAttribute(galaxyColors, 3));
      milkyWayMaterial.vertexColors = true;
      
      const milkyWay = new THREE.Points(milkyWayGeometry, milkyWayMaterial);
      milkyWay.rotation.x = Math.PI / 4; // Tilt the galaxy
      scene.add(milkyWay);
      
      // Create distant colored nebulae
      const createNebula = (position: THREE.Vector3, size: number, color: number) => {
        const nebulaMaterial = new THREE.SpriteMaterial({
          map: createNebulaTexture(color),
          color: color,
          transparent: true,
          opacity: 0.3,
          blending: THREE.AdditiveBlending
        });
        
        const nebula = new THREE.Sprite(nebulaMaterial);
        nebula.position.copy(position);
        nebula.scale.set(size, size, 1);
        scene.add(nebula);
        
        return nebula;
      };
      
      // Create several nebulae with different colors
      const nebulae = [
        createNebula(new THREE.Vector3(500, 200, -1000), 800, 0xff4080), // Pink/purple
        createNebula(new THREE.Vector3(-700, -300, -800), 600, 0x8030ff), // Purple
        createNebula(new THREE.Vector3(-500, 400, -1200), 900, 0x3050ff), // Blue
        createNebula(new THREE.Vector3(800, -200, -600), 500, 0xff3030), // Red
        createNebula(new THREE.Vector3(0, -800, -900), 700, 0x50c0ff)    // Light blue
      ];
      
      return { stars, brightStars, milkyWay, nebulae };
    };
    
    // Create a nebula cloud texture procedurally
    const createNebulaTexture = (tintColor = 0xffffff) => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d')!;
      
      // Fill black
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, 256, 256);
      
      // Extract RGB components from tint color
      const r = (tintColor >> 16) & 255;
      const g = (tintColor >> 8) & 255;
      const b = tintColor & 255;
      
      // Create some noise with color tint
      for (let i = 0; i < 5; i++) {
        ctx.globalAlpha = 0.2;
        const gradient = ctx.createRadialGradient(
          128 + (Math.random() - 0.5) * 80,
          128 + (Math.random() - 0.5) * 80,
          10,
          128,
          128,
          80 + Math.random() * 50
        );
        
        const colorStr = `rgba(${r}, ${g}, ${b}, 1)`;
        const colorTransparentStr = `rgba(${r}, ${g}, ${b}, 0)`;
        
        gradient.addColorStop(0, colorStr);
        gradient.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, 0.5)`);
        gradient.addColorStop(1, colorTransparentStr);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 256, 256);
      }
      
      const texture = new THREE.CanvasTexture(canvas);
      return texture;
    };
    
    // Create the distant sun (yellow sphere)
    const createDistantSun = () => {
      const sunGeometry = new THREE.SphereGeometry(20, 32, 32);
      const sunMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffaa,
      });
      
      const sun = new THREE.Mesh(sunGeometry, sunMaterial);
      sun.position.set(200, 50, -300); // Closer so it's approachable
      scene.add(sun);
      
      // Add a glow effect
      const glowGeometry = new THREE.SphereGeometry(25, 32, 32);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffcc,
        transparent: true,
        opacity: 0.6,
        side: THREE.BackSide
      });
      
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      sun.add(glow);
      
      // Outer glow for more effect
      const outerGlowGeometry = new THREE.SphereGeometry(32, 32, 32);
      const outerGlowMaterial = new THREE.MeshBasicMaterial({
        color: 0xffeeaa,
        transparent: true,
        opacity: 0.3,
        side: THREE.BackSide
      });
      
      const outerGlow = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
      sun.add(outerGlow);
      
      // Inner bright core
      const coreGeometry = new THREE.SphereGeometry(18, 32, 32);
      const coreMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.7
      });
      const core = new THREE.Mesh(coreGeometry, coreMaterial);
      sun.add(core);
      
      // Add a point light
      const sunLight = new THREE.PointLight(0xffffbb, 2, 500);
      sunLight.position.copy(sun.position);
      scene.add(sunLight);
      
      return { sun, glow, outerGlow, core, sunLight };
    };
    
    // Create spaceship based on the pixel art image
    const createSpaceship = () => {
      const ship = new THREE.Group();
      
      // Main body (central part with cream color)
      const bodyGeometry = new THREE.BoxGeometry(1.2, 0.7, 2);
      const bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0xf8f8e8, // Brighter cream color
        metalness: 0.3,
        roughness: 0.5,
        emissive: 0x222218,
        emissiveIntensity: 0.1
      });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      ship.add(body);
      
      // Side wings (cream color with red accents)
      const createWing = (side: number) => {
        const wingGroup = new THREE.Group();
        
        // Main wing part
        const wingGeometry = new THREE.BoxGeometry(1.5, 0.15, 1.2);
        const wingMaterial = new THREE.MeshStandardMaterial({
          color: 0xf8f8e8, // Brighter cream color
          metalness: 0.3,
          roughness: 0.5,
          emissive: 0x222218,
          emissiveIntensity: 0.1
        });
        const wing = new THREE.Mesh(wingGeometry, wingMaterial);
        wing.position.set(side * 0.8, 0, 0);
        wingGroup.add(wing);
        
        // Red accent on wing
        const accentGeometry = new THREE.BoxGeometry(0.15, 0.15, 1.2);
        const accentMaterial = new THREE.MeshStandardMaterial({
          color: 0xff4040, // Brighter red
          metalness: 0.4,
          roughness: 0.3,
          emissive: 0x441010,
          emissiveIntensity: 0.2
        });
        const accent = new THREE.Mesh(accentGeometry, accentMaterial);
        accent.position.set(side * 1.45, 0, 0);
        wingGroup.add(accent);
        
        return wingGroup;
      };
      
      // Add wings
      ship.add(createWing(1)); // right wing
      ship.add(createWing(-1)); // left wing
      
      // Engine part (red circle with thrust hole)
      const engineGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.4, 16);
      const engineMaterial = new THREE.MeshStandardMaterial({
        color: 0xff4040, // Brighter red
        metalness: 0.5,
        roughness: 0.3,
        emissive: 0x441010,
        emissiveIntensity: 0.2
      });
      const engine = new THREE.Mesh(engineGeometry, engineMaterial);
      engine.rotation.x = Math.PI / 2; // align with ship
      engine.position.set(0, 0, 1.1);
      ship.add(engine);
      
      // Engine interior (dark hole)
      const engineInteriorGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 16);
      const engineInteriorMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a0505, // very dark red
        emissive: 0x660000,
        emissiveIntensity: 0.3,
        metalness: 0.2,
        roughness: 1.0
      });
      const engineInterior = new THREE.Mesh(engineInteriorGeometry, engineInteriorMaterial);
      engineInterior.rotation.x = Math.PI / 2;
      engineInterior.position.set(0, 0, 1.3);
      ship.add(engineInterior);
      
      // Cockpit dome (green viewport)
      const cockpitGeometry = new THREE.SphereGeometry(0.4, 16, 16);
      const cockpitMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x40c060, // Brighter green
        metalness: 0.3,
        roughness: 0.4,
        emissive: 0x206020,
        emissiveIntensity: 0.6,
        transmission: 0.3, // glass-like
        transparent: true,
        opacity: 0.9
      });
      const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
      cockpit.scale.set(1, 0.7, 0.8);
      cockpit.position.set(0, 0.35, -0.5);
      ship.add(cockpit);
      
      // Second viewport
      const viewport2Geometry = new THREE.SphereGeometry(0.25, 16, 16);
      const viewport2 = new THREE.Mesh(viewport2Geometry, cockpitMaterial);
      viewport2.scale.set(0.5, 0.5, 0.8);
      viewport2.position.set(0, 0, -0.8);
      ship.add(viewport2);
      
      // Red stripes on the main body
      const stripeMaterial = new THREE.MeshStandardMaterial({
        color: 0xff4040, // Brighter red
        metalness: 0.4,
        roughness: 0.3,
        emissive: 0x441010,
        emissiveIntensity: 0.2
      });
      
      // Top stripe
      const topStripeGeometry = new THREE.BoxGeometry(0.05, 0.1, 2);
      const topStripe = new THREE.Mesh(topStripeGeometry, stripeMaterial);
      topStripe.position.set(0.6, 0.35, 0);
      ship.add(topStripe);
      
      // Bottom stripe
      const bottomStripeGeometry = new THREE.BoxGeometry(0.05, 0.1, 2);
      const bottomStripe = new THREE.Mesh(bottomStripeGeometry, stripeMaterial);
      bottomStripe.position.set(-0.6, 0.35, 0);
      ship.add(bottomStripe);
      
      // Antenna
      const antennaGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.4, 8);
      const antennaMaterial = new THREE.MeshStandardMaterial({
        color: 0xcccccc,
        metalness: 0.9,
        roughness: 0.1,
        emissive: 0x333333,
        emissiveIntensity: 0.2
      });
      const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
      antenna.position.set(0, 0.6, -0.5);
      ship.add(antenna);
      
      // Antenna ball
      const antennaBallGeometry = new THREE.SphereGeometry(0.04, 8, 8);
      const antennaBall = new THREE.Mesh(antennaBallGeometry, antennaMaterial);
      antennaBall.position.set(0, 0.8, -0.5);
      ship.add(antennaBall);
      
      // Create the thruster flame (initially hidden)
      const flameGeometry = new THREE.ConeGeometry(0.3, 1.5, 16);
      const flameMaterial = new THREE.MeshBasicMaterial({
        color: 0xff8040,
        transparent: true,
        opacity: 0.7
      });
      const flame = new THREE.Mesh(flameGeometry, flameMaterial);
      flame.rotation.x = Math.PI; // Point backward
      flame.position.set(0, 0, 1.8);
      flame.visible = false;
      flame.name = "thrusterFlame";
      ship.add(flame);
      
      // Inner flame (brighter)
      const innerFlameGeometry = new THREE.ConeGeometry(0.15, 1, 16);
      const innerFlameMaterial = new THREE.MeshBasicMaterial({
        color: 0xffcc60,
        transparent: true,
        opacity: 0.9
      });
      const innerFlame = new THREE.Mesh(innerFlameGeometry, innerFlameMaterial);
      innerFlame.rotation.x = Math.PI;
      innerFlame.position.set(0, 0, 1.6);
      innerFlame.visible = false;
      innerFlame.name = "innerThrusterFlame";
      ship.add(innerFlame);
      
      // Add a point light for the engine that activates with thrust
      const thrustLight = new THREE.PointLight(0xff6020, 3, 6);
      thrustLight.position.set(0, 0, 1.5);
      thrustLight.intensity = 0;
      thrustLight.name = "thrustLight";
      ship.add(thrustLight);
      
      // Set initial position and orientation
      ship.position.set(0, 0, 0);
      ship.castShadow = true;
      ship.receiveShadow = true;
      
      return ship;
    };
    
    // Create spaceship instance
    const spaceship = createSpaceship();
    scene.add(spaceship);
    
    // Create a grid for reference
    const createGrid = () => {
      const gridSize = 100;
      const gridDivisions = 10;
      const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x444444, 0x222222);
      scene.add(gridHelper);
      
      // Add a grid on vertical planes as well to create a "cube" effect
      const verticalGridXZ = new THREE.GridHelper(gridSize, gridDivisions, 0x444444, 0x222222);
      verticalGridXZ.rotation.x = Math.PI / 2;
      verticalGridXZ.position.y = gridSize / 2;
      scene.add(verticalGridXZ);
      
      const verticalGridXZ2 = new THREE.GridHelper(gridSize, gridDivisions, 0x444444, 0x222222);
      verticalGridXZ2.rotation.x = Math.PI / 2;
      verticalGridXZ2.position.y = -gridSize / 2;
      scene.add(verticalGridXZ2);
      
      const verticalGridYZ = new THREE.GridHelper(gridSize, gridDivisions, 0x444444, 0x222222);
      verticalGridYZ.rotation.z = Math.PI / 2;
      verticalGridYZ.position.x = gridSize / 2;
      scene.add(verticalGridYZ);
      
      const verticalGridYZ2 = new THREE.GridHelper(gridSize, gridDivisions, 0x444444, 0x222222);
      verticalGridYZ2.rotation.z = Math.PI / 2;
      verticalGridYZ2.position.x = -gridSize / 2;
      scene.add(verticalGridYZ2);
      
      // Add some coordinate axes
      const axesHelper = new THREE.AxesHelper(5);
      scene.add(axesHelper);
      
      return {
        gridHelper,
        verticalGridXZ,
        verticalGridXZ2,
        verticalGridYZ,
        verticalGridYZ2,
        axesHelper
      };
    };
    
    // Create grid for reference
    const grid = createGrid();
    
    // Create starfield and distant sun
    const { stars, brightStars, milkyWay, nebulae } = createStarfield();
    const { sun, glow, outerGlow, core, sunLight } = createDistantSun();
    
    // Add ambient light for overall illumination
    const ambientLight = new THREE.AmbientLight(0x303040, 1.2);
    scene.add(ambientLight);
    
    // Add directional light for more definition
    const directionalLight = new THREE.DirectionalLight(0xeef0ff, 1.2);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    
    // Mouse control variables
    const mouse = {
      x: 0,
      y: 0,
      sensitivity: 0.003,
      isLocked: false
    };
    
    // Track if pointer is locked
    const updatePointerLock = () => {
      mouse.isLocked = document.pointerLockElement === mountNode;
    };
    
    // Handle mouse movement
    const handleMouseMove = (e: MouseEvent) => {
      if (mouse.isLocked) {
        // Update mouse position
        mouse.x += e.movementX;
        mouse.y += e.movementY;
        
        // Create rotation quaternions for local ship rotation
        const yawQuat = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 1, 0), // Y-axis in local space
          -e.movementX * mouse.sensitivity
        );
        
        const rightAxis = new THREE.Vector3(1, 0, 0).applyQuaternion(spaceship.quaternion);
        const pitchQuat = new THREE.Quaternion().setFromAxisAngle(
          rightAxis, // Local right axis for pitch
          -e.movementY * mouse.sensitivity
        );
        
        // Apply rotations in local space
        spaceship.quaternion.premultiply(yawQuat);
        spaceship.quaternion.premultiply(pitchQuat);
      }
    };
    
    // Handle clicks to request pointer lock
    const handleClick = () => {
      if (!mouse.isLocked) {
        mountNode.requestPointerLock();
      }
    };
    
    // Handle key down
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowExitDialog(true);
        return;
      }
      
      switch (e.key.toLowerCase()) {
        case ' ': // Space bar - Thrust forward
          shipControls.thrust = true;
          setThrust(true);
          break;
        case 'a': case 'arrowleft': // Yaw left
          shipControls.left = true;
          break;
        case 'd': case 'arrowright': // Yaw right
          shipControls.right = true;
          break;
        case 'r': // Move up
          shipControls.up = true;
          break;
        case 'f': // Move down
          shipControls.down = true;
          break;
        case 'w': case 'arrowup': // Pitch up
          shipControls.pitchUp = true;
          break;
        case 's': case 'arrowdown': // Pitch down
          shipControls.pitchDown = true;
          break;
        case 'q': // Roll left
          shipControls.rollLeft = true;
          break;
        case 'e': // Roll right
          shipControls.rollRight = true;
          break;
      }
    };
    
    // Handle key up
    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case ' ': // Space bar
          shipControls.thrust = false;
          setThrust(false);
          break;
        case 'a': case 'arrowleft':
          shipControls.left = false;
          break;
        case 'd': case 'arrowright':
          shipControls.right = false;
          break;
        case 'r':
          shipControls.up = false;
          break;
        case 'f':
          shipControls.down = false;
          break;
        case 'w': case 'arrowup':
          shipControls.pitchUp = false;
          break;
        case 's': case 'arrowdown':
          shipControls.pitchDown = false;
          break;
        case 'q':
          shipControls.rollLeft = false;
          break;
        case 'e':
          shipControls.rollRight = false;
          break;
      }
    };
    
    // Handle window resize
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    
    // Update spaceship physics
    const updateShipPhysics = () => {
      // Get local ship axes
      const localYAxis = new THREE.Vector3(0, 1, 0).applyQuaternion(spaceship.quaternion);
      const localXAxis = new THREE.Vector3(1, 0, 0).applyQuaternion(spaceship.quaternion);
      const localZAxis = new THREE.Vector3(0, 0, 1).applyQuaternion(spaceship.quaternion);
      
      // Create rotation quaternions for each control direction
      if (shipControls.left) {
        // Yaw left around local Y axis
        const yawLeftQuat = new THREE.Quaternion().setFromAxisAngle(
          localYAxis, 
          shipPhysics.rotationSpeed
        );
        spaceship.quaternion.premultiply(yawLeftQuat);
      }
      
      if (shipControls.right) {
        // Yaw right around local Y axis
        const yawRightQuat = new THREE.Quaternion().setFromAxisAngle(
          localYAxis, 
          -shipPhysics.rotationSpeed
        );
        spaceship.quaternion.premultiply(yawRightQuat);
      }
      
      if (shipControls.pitchUp) {
        // Pitch up around local X axis
        const pitchUpQuat = new THREE.Quaternion().setFromAxisAngle(
          localXAxis, 
          shipPhysics.rotationSpeed
        );
        spaceship.quaternion.premultiply(pitchUpQuat);
      }
      
      if (shipControls.pitchDown) {
        // Pitch down around local X axis
        const pitchDownQuat = new THREE.Quaternion().setFromAxisAngle(
          localXAxis, 
          -shipPhysics.rotationSpeed
        );
        spaceship.quaternion.premultiply(pitchDownQuat);
      }
      
      if (shipControls.rollLeft) {
        // Roll left around local Z axis
        const rollLeftQuat = new THREE.Quaternion().setFromAxisAngle(
          localZAxis, 
          shipPhysics.rotationSpeed
        );
        spaceship.quaternion.premultiply(rollLeftQuat);
      }
      
      if (shipControls.rollRight) {
        // Roll right around local Z axis
        const rollRightQuat = new THREE.Quaternion().setFromAxisAngle(
          localZAxis, 
          -shipPhysics.rotationSpeed
        );
        spaceship.quaternion.premultiply(rollRightQuat);
      }
      
      // Direct up/down movement in world space (independent of ship orientation)
      if (shipControls.up) {
        shipPhysics.velocity.y += shipPhysics.moveSpeed;
      }
      if (shipControls.down) {
        shipPhysics.velocity.y -= shipPhysics.moveSpeed;
      }
      
      // Apply thrust - move forward in the direction the ship is facing
      if (shipControls.thrust) {
        // Calculate forward direction based on ship's current rotation
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(spaceship.quaternion);
        
        // Apply acceleration in that direction
        shipPhysics.velocity.addScaledVector(forward, shipPhysics.acceleration);
        
        // Activate thruster effects
        const flame = spaceship.getObjectByName('thrusterFlame') as THREE.Mesh;
        const innerFlame = spaceship.getObjectByName('innerThrusterFlame') as THREE.Mesh;
        const thrustLight = spaceship.getObjectByName('thrustLight') as THREE.PointLight;
        
        if (flame) flame.visible = true;
        if (innerFlame) innerFlame.visible = true;
        if (thrustLight) thrustLight.intensity = 2;
        
        // Animate the flames
        if (flame && innerFlame) {
          const flameScale = 0.9 + Math.random() * 0.2;
          flame.scale.set(flameScale, flameScale, flameScale);
          innerFlame.scale.set(flameScale * 0.8, flameScale * 1.1, flameScale * 0.8);
        }
      } else {
        // Deactivate thruster effects
        const flame = spaceship.getObjectByName('thrusterFlame') as THREE.Mesh;
        const innerFlame = spaceship.getObjectByName('innerThrusterFlame') as THREE.Mesh;
        const thrustLight = spaceship.getObjectByName('thrustLight') as THREE.PointLight;
        
        if (flame) flame.visible = false;
        if (innerFlame) innerFlame.visible = false;
        if (thrustLight) {
          thrustLight.intensity *= 0.8; // Fade out
        }
      }
      
      // Limit maximum speed
      if (shipPhysics.velocity.length() > shipPhysics.maxSpeed) {
        shipPhysics.velocity.normalize().multiplyScalar(shipPhysics.maxSpeed);
      }
      
      // Apply drag (space has less drag)
      shipPhysics.velocity.multiplyScalar(shipPhysics.drag);
      
      // Update position
      shipPhysics.position.add(shipPhysics.velocity);
      spaceship.position.copy(shipPhysics.position);
    };
    
    // Update camera position to follow the spaceship
    const updateCamera = () => {
      // Calculate camera position based on ship's orientation
      const cameraOffset = new THREE.Vector3(0, 2, 10);
      cameraOffset.applyQuaternion(spaceship.quaternion);
      
      const targetCameraPos = new THREE.Vector3().copy(spaceship.position).add(cameraOffset);
      
      // Smooth camera movement
      camera.position.lerp(targetCameraPos, 0.05);
      
      // Make camera look at the ship
      camera.lookAt(spaceship.position);
    };
    
    // Animation loop
    const animate = () => {
      updateShipPhysics();
      updateCamera();
      
      const time = performance.now() * 0.001; // Convert to seconds
      
      // Animate nebulae with subtle pulsing
      if (nebulae) {
        nebulae.forEach((nebula, index) => {
          const pulseSpeed = 0.2 + index * 0.05;
          const pulseFactor = 1 + Math.sin(time * pulseSpeed) * 0.1;
          nebula.scale.set(nebula.scale.x * 0.995, nebula.scale.y * 0.995, 1); // Slow growth
          
          if (nebula.material instanceof THREE.SpriteMaterial) {
            nebula.material.opacity = 0.25 + Math.sin(time * pulseSpeed) * 0.15;
          }
        });
      }
      
      // Make the sun pulse
      const pulseFactor = 1 + Math.sin(time * 1.5) * 0.1; // Pulsing effect
      
      if (glow) {
        glow.scale.set(pulseFactor, pulseFactor, pulseFactor);
      }
      
      if (outerGlow) {
        outerGlow.scale.set(pulseFactor * 1.1, pulseFactor * 1.1, pulseFactor * 1.1);
      }
      
      if (core) {
        core.scale.set(pulseFactor * 0.95, pulseFactor * 0.95, pulseFactor * 0.95);
        // Make the core color pulse between white and yellow
        const coreBrightness = 0.7 + Math.sin(time * 2) * 0.2;
        if (core.material instanceof THREE.MeshBasicMaterial) {
          core.material.color.setRGB(1, 1, coreBrightness);
        }
      }
      
      // Make sure the distant sun remains visible from anywhere
      const distanceToSun = shipPhysics.position.distanceTo(sun.position);
      
      // Adjust lighting based on distance to the sun
      if (distanceToSun < 200) {
        const intensity = 3 - (distanceToSun / 200) * 2;
        sunLight.intensity = intensity;
        
        // Increase bloom/glow effect when very close
        if (distanceToSun < 50) {
          const glowIntensity = 0.6 + (1 - distanceToSun / 50) * 0.4;
          if (glow.material instanceof THREE.MeshBasicMaterial) {
            glow.material.opacity = glowIntensity;
          }
          if (outerGlow.material instanceof THREE.MeshBasicMaterial) {
            outerGlow.material.opacity = glowIntensity * 0.5;
          }
          if (core.material instanceof THREE.MeshBasicMaterial) {
            core.material.opacity = Math.min(0.9, glowIntensity + 0.2);
          }
        }
      } else {
        sunLight.intensity = 1;
      }
      
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
      
      // Update loading state
      if (isLoading) {
        setIsLoading(false);
      }
    };
    
    // Add event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    mountNode.addEventListener('click', handleClick);
    document.addEventListener('pointerlockchange', updatePointerLock);
    
    // Start animation
    requestAnimationFrame(animate);
    
    // Cleanup function
    return () => {
      if (mountNode && mountNode.contains(renderer.domElement)) {
        mountNode.removeChild(renderer.domElement);
      }
      
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      mountNode.removeEventListener('click', handleClick);
      document.removeEventListener('pointerlockchange', updatePointerLock);
      
      // Exit pointer lock if active
      if (document.pointerLockElement === mountNode) {
        document.exitPointerLock();
      }
      
      // Clean up Three.js resources
      renderer.dispose();
      scene.clear();
    };
  }, []);
  
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
      <div 
        ref={mountRef}
        className="w-full h-full"
      />
      
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-10">
          <div className="text-white text-lg">Initializing space environment...</div>
        </div>
      )}
      
      {/* Controls hint */}
      <div className="fixed top-6 left-6 z-20 text-white/70 text-sm">
        <p>W/S - Pitch up/down</p>
        <p>A/D - Rotate left/right</p>
        <p>Q/E - Roll left/right</p>
        <p>R/F - Move up/down</p>
        <p>SPACE - Engine thrust (forward)</p>
        <p>LMOUSE - Mouse Control</p>
        <p>ESC - Menu</p>
      </div>
      
      {/* Thrust indicator */}
      <div className={`fixed bottom-20 left-6 z-20 text-white/70 text-sm ${thrust ? 'text-orange-400' : ''}`}>
        {thrust ? 'THRUST ENGAGED' : 'THRUST IDLE'}
      </div>
      
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
    </div>
  );
};

export default GameMode;