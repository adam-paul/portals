import * as THREE from 'three';
import { PlayerData } from '../types/player';

// Cache of multiplayer ships by player ID
const multiplayerShips: Map<string, THREE.Group> = new Map();

// Create a simplified spaceship for other players
export const createMultiplayerShip = (): THREE.Group => {
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

  // Set initial position and orientation
  ship.castShadow = true;
  ship.receiveShadow = true;
  
  return ship;
};

// Update or create multiplayer ships based on player data
export const updateMultiplayerShips = (
  playerDataList: PlayerData[],
  scene: THREE.Scene,
  localPlayerId: string
): void => {
  // Track which player IDs are seen in this update
  const currentPlayers = new Set<string>();
  
  // Update each player
  playerDataList.forEach(playerData => {
    // Skip local player
    if (playerData.id === localPlayerId) return;
    
    // Mark this player as current
    currentPlayers.add(playerData.id);
    
    // Get or create ship for this player
    let ship = multiplayerShips.get(playerData.id);
    if (!ship) {
      ship = createMultiplayerShip();
      scene.add(ship);
      multiplayerShips.set(playerData.id, ship);
    }
    
    // Update ship position and rotation
    ship.position.fromArray(playerData.position);
    ship.quaternion.fromArray(playerData.quaternion);
  });
  
  // Remove ships for players who are no longer connected
  multiplayerShips.forEach((ship, id) => {
    if (!currentPlayers.has(id)) {
      scene.remove(ship);
      multiplayerShips.delete(id);
    }
  });
};

// Clear all multiplayer ships
export const clearMultiplayerShips = (scene: THREE.Scene): void => {
  multiplayerShips.forEach(ship => {
    scene.remove(ship);
  });
  multiplayerShips.clear();
};