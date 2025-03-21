import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GameLinkObject } from './GameLink';
import { motion, AnimatePresence } from 'framer-motion';
import { GAME_DEFINITIONS } from '@/data/games';

interface GameModeProps {
  onExit: () => void;
}

const GameMode: React.FC<GameModeProps> = ({ onExit }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [thrust, setThrust] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileControls, setShowMobileControls] = useState(false);
  const [transition, setTransition] = useState<{active: boolean, title: string}>({
    active: false,
    title: ''
  });
  
  // Handle device orientation handlers
  const deviceOrientationHandlerRef = useRef<(event: DeviceOrientationEvent) => void>();
  
  // Request permission for device orientation on iOS
  const requestDeviceOrientationPermission = () => {
    if (typeof DeviceOrientationEvent !== 'undefined' && 
        typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      (DeviceOrientationEvent as any).requestPermission()
        .then((permissionState: string) => {
          if (permissionState === 'granted') {
            if (deviceOrientationHandlerRef.current) {
              window.addEventListener('deviceorientation', deviceOrientationHandlerRef.current);
            }
            setShowMobileControls(true);
          }
        })
        .catch(console.error);
    } else {
      // Handle non-iOS devices
      if (deviceOrientationHandlerRef.current) {
        window.addEventListener('deviceorientation', deviceOrientationHandlerRef.current);
      }
      setShowMobileControls(true);
    }
  };
  
  // Toggle mute/unmute for background music
  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = 0.3;
      } else {
        audioRef.current.volume = 0;
      }
      setIsMuted(!isMuted);
    }
  };

  useEffect(() => {
    // Initialize background music
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : 0.3;
      audioRef.current.loop = true;
      audioRef.current.play().catch(err => {
        console.error("Audio playback failed:", err);
      });
    }
    
    // Detect if user is on mobile
    const checkMobile = () => {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    };
    
    setIsMobile(checkMobile());
    
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
      moveSpeed: 0.05,      // Speed for direct WASD movement
      collisionRadius: 1.5,  // Collision detection radius for the ship
      slowMotion: false     // Flag for transition effect
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
    
    // Mobile orientation controls
    const orientationControls = {
      beta: 0,  // x-axis rotation (front-to-back)
      gamma: 0, // y-axis rotation (left-to-right)
      alpha: 0, // z-axis rotation
      lastBeta: 0,
      lastGamma: 0,
      calibrated: false,
      sensitivity: 0.5,
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
      
      // Add a point light for the engine that activates with thrust
      const thrustLight = new THREE.PointLight(0xff6020, 5, 10);
      thrustLight.position.set(0, 0, 1.5);
      thrustLight.intensity = 0;
      thrustLight.name = "thrustLight";
      ship.add(thrustLight);
      
      // Create enhanced thruster particles system
      const createThrusterParticles = () => {
        const particleCount = 120; // Increased count for better density
        const particleGroup = new THREE.Group();
        particleGroup.name = "thrusterParticles";
        
        // Create a cel-shaded texture for particles
        const createParticleTexture = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 64;
          canvas.height = 64;
          const ctx = canvas.getContext('2d')!;
          
          // Clear with transparent background
          ctx.clearRect(0, 0, 64, 64);
          
          // Draw a cel-shaded circle
          const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
          gradient.addColorStop(0, 'rgba(255, 220, 120, 1)');
          gradient.addColorStop(0.3, 'rgba(255, 140, 50, 0.9)');
          gradient.addColorStop(0.7, 'rgba(255, 60, 20, 0.5)');
          gradient.addColorStop(1, 'rgba(40, 0, 0, 0)');
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(32, 32, 32, 0, Math.PI * 2);
          ctx.fill();
          
          // Add some cel shading steps
          ctx.strokeStyle = 'rgba(255, 200, 50, 0.8)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(32, 32, 24, 0, Math.PI * 2);
          ctx.stroke();
          
          const texture = new THREE.CanvasTexture(canvas);
          return texture;
        };
        
        // Create an additional core flame texture
        const createCoreFlameTexture = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 128;
          canvas.height = 128;
          const ctx = canvas.getContext('2d')!;
          
          ctx.clearRect(0, 0, 128, 128);
          
          // Create a bright, elongated flame shape
          const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
          gradient.addColorStop(0, 'rgba(255, 255, 200, 1)');
          gradient.addColorStop(0.2, 'rgba(255, 180, 50, 0.95)');
          gradient.addColorStop(0.5, 'rgba(255, 80, 10, 0.8)');
          gradient.addColorStop(1, 'rgba(40, 0, 0, 0)');
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(64, 64, 64, 0, Math.PI * 2);
          ctx.fill();
          
          return new THREE.CanvasTexture(canvas);
        };
        
        const particleTexture = createParticleTexture();
        const coreFlameTexture = createCoreFlameTexture();
        
        // Create main flame core particles (large, centered)
        for (let i = 0; i < 8; i++) {
          const coreMaterial = new THREE.SpriteMaterial({
            map: coreFlameTexture,
            color: 0xffcc60,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
          });
          
          const coreParticle = new THREE.Sprite(coreMaterial);
          const size = 0.7 + Math.random() * 0.5;
          coreParticle.scale.set(size, size, size);
          
          coreParticle.userData = {
            type: 'core',
            velocity: new THREE.Vector3(0, 0, 0.1 + Math.random() * 0.1),
            age: 0,
            lifespan: 0.8 + Math.random() * 0.4,
            active: false,
            baseSize: size,
            maxDistance: 2.2 + Math.random() * 1.0, // How far it can travel
            rotationSpeed: (Math.random() - 0.5) * 0.1
          };
          
          particleGroup.add(coreParticle);
        }
        
        // Create regular particles (more and varied)
        for (let i = 0; i < particleCount; i++) {
          const particleMaterial = new THREE.SpriteMaterial({
            map: particleTexture,
            color: i % 3 === 0 ? 0xffcc60 : (i % 3 === 1 ? 0xff8040 : 0xff4020),
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
          });
          
          const particle = new THREE.Sprite(particleMaterial);
          
          // Random initial size between 0.1 and 0.4
          const size = 0.1 + Math.random() * 0.3;
          particle.scale.set(size, size, size);
          
          // Determine if this is an outer or inner particle
          const isOuter = Math.random() > 0.4;
          
          // Store particle properties for animation
          particle.userData = {
            type: isOuter ? 'outer' : 'inner',
            velocity: new THREE.Vector3(
              (Math.random() - 0.5) * (isOuter ? 0.05 : 0.02),
              (Math.random() - 0.5) * (isOuter ? 0.05 : 0.02),
              Math.random() * 0.15 + 0.1
            ),
            age: 0,
            lifespan: 1 + Math.random() * (isOuter ? 0.5 : 1.0),
            active: false,
            baseSize: size,
            rotationSpeed: (Math.random() - 0.5) * 0.1,
            maxDistance: isOuter ? 1.8 + Math.random() * 1.5 : 3 + Math.random() * 2
          };
          
          particleGroup.add(particle);
        }
        
        particleGroup.visible = false;
        return particleGroup;
      };
      
      const thrusterParticles = createThrusterParticles();
      ship.add(thrusterParticles);
      
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
    
    // Create game links/portals
    const gameLinks: GameLinkObject[] = [];
    
    // Create portals for each enabled game
    GAME_DEFINITIONS.filter(game => game.enabled).forEach(game => {
      const portal = new GameLinkObject(
        scene,
        game.position,
        game.radius,
        game.color,
        game.glowColor,
        game.coreColor,
        game.url,
        game.title,
        game.collisionRadius
      );
      gameLinks.push(portal);
    });
    
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
      if (!mouse.isLocked && !isMobile) {
        mountNode.requestPointerLock();
      }
    };
    
    // Mobile device orientation handler
    const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
      if (!isMobile || shipPhysics.slowMotion) return;
      
      // Calibrate on first reading
      if (!orientationControls.calibrated && event.beta !== null && event.gamma !== null) {
        orientationControls.lastBeta = event.beta;
        orientationControls.lastGamma = event.gamma;
        orientationControls.calibrated = true;
        return;
      }
      
      if (event.beta !== null && event.gamma !== null) {
        // Get the current orientation
        orientationControls.beta = event.beta;  // Forward/backward tilt (-180 to 180)
        orientationControls.gamma = event.gamma; // Left/right tilt (-90 to 90)
        orientationControls.alpha = event.alpha || 0; // Compass direction (0-360)
        
        // Calculate changes from last reading
        const betaDiff = orientationControls.beta - orientationControls.lastBeta;
        const gammaDiff = orientationControls.gamma - orientationControls.lastGamma;
        
        // Map device orientation to ship controls
        // Tilt forward (negative beta change) for pitch down
        shipControls.pitchDown = betaDiff < -1 * orientationControls.sensitivity;
        
        // Tilt backward (positive beta change) for pitch up
        shipControls.pitchUp = betaDiff > 1 * orientationControls.sensitivity;
        
        // Tilt left (negative gamma change) to yaw left
        shipControls.left = gammaDiff < -1 * orientationControls.sensitivity;
        
        // Tilt right (positive gamma change) to yaw right
        shipControls.right = gammaDiff > 1 * orientationControls.sensitivity;
        
        // Save current values for next comparison
        orientationControls.lastBeta = orientationControls.beta;
        orientationControls.lastGamma = orientationControls.gamma;
      }
    };
    
    // Store the handler in the ref so it can be accessed outside useEffect
    deviceOrientationHandlerRef.current = handleDeviceOrientation;
    
    // Mobile touch event handlers
    const handleTouchStart = (e: TouchEvent) => {
      if (!isMobile) return;
      
      if (e.target instanceof HTMLButtonElement) {
        // Don't trigger thrust when pressing UI buttons
        return;
      }
      
      // Activate thruster on touch start
      shipControls.thrust = true;
      setThrust(true);
      
      // Prevent default to avoid scrolling, zooming, etc.
      e.preventDefault();
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      if (!isMobile) return;
      
      // Deactivate thruster on touch end
      shipControls.thrust = false;
      setThrust(false);
      
      e.preventDefault();
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (!isMobile) return;
      e.preventDefault(); // Prevent scrolling
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
      // If in slow motion transition, limit controls
      if (shipPhysics.slowMotion) {
        // Only continue forward momentum with reduced speed
        shipPhysics.velocity.multiplyScalar(0.98);
        shipPhysics.position.add(shipPhysics.velocity);
        spaceship.position.copy(shipPhysics.position);
        
        // Slow rotation
        spaceship.rotation.y += 0.002;
        
        return;
      }
      
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
        const thrustLight = spaceship.getObjectByName('thrustLight') as THREE.PointLight;
        const particleGroup = spaceship.getObjectByName('thrusterParticles') as THREE.Group;
        
        if (thrustLight) thrustLight.intensity = 3.5;
        if (particleGroup) particleGroup.visible = true;
        
        // Animate particles to create a rocket jet effect
        if (particleGroup) {
          // Add pulsing effect 
          const time = performance.now() * 0.001;
          const pulseFactor = Math.sin(time * 15) * 0.1 + 0.9;
          
          particleGroup.children.forEach((particle: THREE.Sprite) => {
            const userData = particle.userData;
            
            // Activate some inactive particles
            if (!userData.active && Math.random() > (userData.type === 'core' ? 0.2 : 0.6)) {
              userData.active = true;
              userData.age = 0;
              
              // Reset particle position based on type - all relative to ship's local space
              const spread = userData.type === 'core' ? 0.1 : 
                            (userData.type === 'inner' ? 0.2 : 0.4);
              
              // Local position at engine
              particle.position.set(
                (Math.random() - 0.5) * spread,
                (Math.random() - 0.5) * spread,
                1.3 + Math.random() * 0.1  // Engine is at z=1.3 in ship's local space
              );
              
              // Scale based on type and random size
              let size;
              if (userData.type === 'core') {
                size = 0.6 + Math.random() * 0.4;
                if (particle.material instanceof THREE.SpriteMaterial) {
                  particle.material.color.setRGB(
                    1.0,
                    0.8 + 0.2 * pulseFactor,
                    0.3 + 0.3 * pulseFactor
                  );
                }
              } else {
                size = userData.type === 'inner' ? 
                      (0.2 + Math.random() * 0.2) : 
                      (0.1 + Math.random() * 0.2);
              }
              
              particle.scale.set(size, size, size);
              userData.baseSize = size;
              
              // Velocity is always in local +Z direction (backward from ship's front)
              // with different speeds based on particle type
              const zVelocity = userData.type === 'core' ? 
                             (0.1 + Math.random() * 0.1) : 
                             (userData.type === 'inner' ? 
                              (0.08 + Math.random() * 0.12) : 
                              (0.05 + Math.random() * 0.15));
              
              // Local space velocity
              userData.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * (userData.type === 'core' ? 0.01 : 0.04),
                (Math.random() - 0.5) * (userData.type === 'core' ? 0.01 : 0.04),
                zVelocity
              );
              
              userData.initialPosition = particle.position.clone();
            }
            
            // Update active particles
            if (userData.active) {
              // Move particle along its velocity vector in local space
              particle.position.add(userData.velocity);
              
              // Apply rotation for visual interest
              if (particle.material instanceof THREE.SpriteMaterial) {
                particle.material.rotation += userData.rotationSpeed;
              }
              
              // Add a bit of randomness to velocity for more organic movement
              if (userData.type !== 'core' || Math.random() > 0.7) {
                const wobbleFactor = userData.type === 'core' ? 0.001 : 0.005;
                userData.velocity.x += (Math.random() - 0.5) * wobbleFactor;
                userData.velocity.y += (Math.random() - 0.5) * wobbleFactor;
              }
              
              // Age the particle
              userData.age += 0.05;
              
              // Fade and scale based on age and type
              if (particle.material instanceof THREE.SpriteMaterial) {
                const lifeRatio = userData.age / userData.lifespan;
                
                // Different opacity curves for different particle types
                if (userData.type === 'core') {
                  // Core particles fade out more sharply at the end
                  particle.material.opacity = Math.max(0, 1 - Math.pow(lifeRatio, 2));
                } else {
                  particle.material.opacity = Math.max(0, 1 - lifeRatio);
                }
                
                // Determine scale based on type
                let growFactor;
                if (userData.type === 'core') {
                  // Core expands more
                  growFactor = 1 + lifeRatio * 1.2;
                } else if (userData.type === 'inner') {
                  // Inner particles expand moderately
                  growFactor = 1 + lifeRatio * 1.0;
                } else {
                  // Outer particles expand the most to create conical shape
                  growFactor = 1 + lifeRatio * 1.8;
                }
                
                const baseSize = userData.baseSize || 0.2;
                particle.scale.set(
                  baseSize * growFactor, 
                  baseSize * growFactor, 
                  baseSize * growFactor
                );
              }
              
              // Check if particle has traveled its maximum distance from origin
              if (userData.initialPosition) {
                const distanceTraveled = particle.position.distanceTo(userData.initialPosition);
                if (distanceTraveled >= userData.maxDistance) {
                  userData.active = false;
                  return;
                }
              }
              
              // Deactivate if too old
              if (userData.age >= userData.lifespan) {
                userData.active = false;
              }
            }
          });
        }
      } else {
        // Deactivate thruster effects
        const thrustLight = spaceship.getObjectByName('thrustLight') as THREE.PointLight;
        const particleGroup = spaceship.getObjectByName('thrusterParticles') as THREE.Group;
        
        if (particleGroup) particleGroup.visible = false;
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
      
      // Check for collisions with portal objects
      checkPortalCollisions();
    };
    
    // Function to check for collisions with portal objects
    const checkPortalCollisions = () => {
      // Don't check collisions if we're already in transition
      if (shipPhysics.slowMotion) return;
      
      // Check collision with all game links
      for (const gameLink of gameLinks) {
        if (gameLink.checkCollision(shipPhysics.position, shipPhysics.collisionRadius)) {
          // Activate transition effect
          shipPhysics.slowMotion = true;
          setTransition({ 
            active: true, 
            title: gameLink.userData.title 
          });
          
          // Reduce velocity for slow motion effect
          shipPhysics.velocity.multiplyScalar(0.3);
          
          // Schedule navigation after transition effect
          setTimeout(() => {
            window.location.href = gameLink.userData.url;
          }, 2500); // Give enough time for the transition animation
          
          break;
        }
      }
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
      
      // Update all game links
      for (const gameLink of gameLinks) {
        gameLink.update(time, shipPhysics.position);
      }
      
      renderer.render(scene, camera);
      
      // Apply special effects during transition
      if (shipPhysics.slowMotion) {
        // Slow motion rendering (render at lower FPS)
        setTimeout(() => {
          requestAnimationFrame(animate);
        }, 30); // Introduce delay for slow-motion effect
        
        // Create pulsing/warping visual effect
        spaceship.scale.x = 1 + Math.sin(time * 4) * 0.05;
        spaceship.scale.z = 1 + Math.cos(time * 4) * 0.05;
      } else {
        requestAnimationFrame(animate);
      }
      
      // We'll keep isLoading true until the first frame renders
    };
    
    // Add event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    mountNode.addEventListener('click', handleClick);
    document.addEventListener('pointerlockchange', updatePointerLock);
    
    // Add mobile touch events if on mobile
    if (isMobile) {
      mountNode.addEventListener('touchstart', handleTouchStart as EventListener, { passive: false });
      mountNode.addEventListener('touchend', handleTouchEnd as EventListener, { passive: false });
      mountNode.addEventListener('touchmove', handleTouchMove as EventListener, { passive: false });
      
      // We'll request device orientation permission when user clicks "Enable Motion Controls" button
    }
    
    // Start animation and set loading to false after first render
    requestAnimationFrame(() => {
      animate();
      setIsLoading(false);
    });
    
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
      
      // Remove mobile-specific event listeners
      if (isMobile) {
        mountNode.removeEventListener('touchstart', handleTouchStart as EventListener);
        mountNode.removeEventListener('touchend', handleTouchEnd as EventListener);
        mountNode.removeEventListener('touchmove', handleTouchMove as EventListener);
        if (deviceOrientationHandlerRef.current) {
          window.removeEventListener('deviceorientation', deviceOrientationHandlerRef.current);
        }
      }
      
      // Stop the audio when component unmounts
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      
      // Exit pointer lock if active
      if (document.pointerLockElement === mountNode) {
        document.exitPointerLock();
      }
      
      // Clean up Three.js resources
      for (const gameLink of gameLinks) {
        gameLink.remove(scene);
      }
      
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
      <audio ref={audioRef} src="/audio/dreamsound_gameloop.wav" loop />
      <div 
        ref={mountRef}
        className="w-full h-full"
      />
      
{/* Loading is handled by the parent Games component */}
      
      {/* Portal Transition Overlay */}
      <AnimatePresence>
        {transition.active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-30 pointer-events-none"
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-center"
            >
              <h2 className="text-4xl font-bold text-white tracking-wider mb-2">
                Entering the world of
              </h2>
              <h1 className="text-6xl font-bold text-blue-300 tracking-widest">
                {transition.title}...
              </h1>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Mobile Controls Prompt */}
      {isMobile && !showMobileControls && !isLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-40">
          <div className="bg-space-gray/70 border border-white/20 p-8 rounded-lg text-center">
            <h2 className="text-2xl font-bold text-white mb-6">Mobile Controls</h2>
            <p className="text-white/80 mb-6">
              Tilt your device to steer the ship.<br/>
              Tap and hold anywhere to engage thrusters.
            </p>
            <button 
              onClick={() => requestDeviceOrientationPermission()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
            >
              Enable Motion Controls
            </button>
          </div>
        </div>
      )}
      
      {/* Controls hint - Different for mobile */}
      {!isMobile && (
        <div className={`fixed top-6 left-6 z-20 text-white/70 text-sm transition-opacity duration-300 ${transition.active ? 'opacity-20' : 'opacity-100'}`}>
          <p>W/S - Pitch up/down</p>
          <p>A/D - Rotate left/right</p>
          <p>Q/E - Roll left/right</p>
          <p>R/F - Move up/down</p>
          <p>SPACE - Engine thrust (forward)</p>
          <p>LMOUSE - Mouse Control</p>
          <p>ESC - Menu</p>
        </div>
      )}
      
      {/* Mobile Controls hint */}
      {isMobile && showMobileControls && (
        <div className={`fixed top-6 left-6 z-20 text-white/70 text-sm transition-opacity duration-300 ${transition.active ? 'opacity-20' : 'opacity-100'}`}>
          <p>Tilt forward/back - Pitch</p>
          <p>Tilt left/right - Turn</p>
          <p>Tap & hold - Thrust</p>
        </div>
      )}
      
      {/* Thrust indicator */}
      <div className={`fixed bottom-20 left-6 z-20 text-white/70 text-sm transition-opacity duration-300 ${transition.active ? 'opacity-0' : ''} ${thrust ? 'text-orange-400' : ''}`}>
        {thrust ? 'THRUST ENGAGED' : 'THRUST IDLE'}
      </div>
      
      {/* Sound Toggle Button */}
      <button 
        onClick={toggleMute}
        className={`fixed bottom-16 right-6 z-50 text-white/70 hover:text-white text-lg font-bold tracking-wider transition-all duration-300 ${transition.active ? 'opacity-0 pointer-events-none' : ''}`}
        aria-label={isMuted ? "Unmute sound" : "Mute sound"}
      >
        {isMuted ? "UNMUTE" : "MUTE"}
      </button>
      
      {/* Exit Button */}
      <button 
        onClick={handleExitClick}
        className={`fixed bottom-6 right-6 z-50 text-white/70 hover:text-white text-lg font-bold tracking-wider transition-all duration-300 ${transition.active ? 'opacity-0 pointer-events-none' : ''}`}
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