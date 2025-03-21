import * as THREE from 'three';
import { FaEarlybirds, FaPlane, FaSpaghettiMonsterFlying } from "react-icons/fa6";
import React from 'react';

// This is our single source of truth for all games in the application
export interface GameDefinition {
  id: string;
  title: string;
  description: string;
  url: string;
  icon: React.ReactNode;
  enabled: boolean;  // Whether the game is currently available
  
  // 3D world properties
  position: THREE.Vector3;
  radius: number;
  color: number;
  glowColor: number;
  coreColor: number;
  collisionRadius: number;
}

// All games in the system
export const GAME_DEFINITIONS: GameDefinition[] = [
  {
    id: 'monster-hunter',
    title: 'Monster Hunter',
    description: 'Hunt monsters with friends in an epic 2D sidescrolling fantasy world',
    url: 'https://monsterhunter.io/',
    icon: React.createElement(FaSpaghettiMonsterFlying, { size: 36, className: "mb-4" }),
    enabled: true,
    
    // 3D world properties
    position: new THREE.Vector3(200, 50, -300),
    radius: 20,
    color: 0xffffaa,
    glowColor: 0xffffcc,
    coreColor: 0xffffff,
    collisionRadius: 20
  },
  {
    id: 'fly-pieter',
    title: 'Fly Pieter',
    description: 'Fly planes, command tanks, and buy ads in the OG vibecoded MMO flight simulator',
    url: 'https://fly.pieter.com/',
    icon: React.createElement(FaPlane, { size: 36, className: "mb-4" }),
    enabled: true,
    
    // 3D world properties
    position: new THREE.Vector3(-100, -80, 200),
    radius: 40,
    color: 0x9F2B68,
    glowColor: 0xBF40BF,
    coreColor: 0x9F2B68,
    collisionRadius: 40
  },
  {
    id: '1p-flappy-bird',
    title: 'First-person Flappy Bird',
    description: 'First-person Flappy Bird, from @HolyCoward, who always wondered',
    url: 'https://firstpersonflappy.com/',
    icon: React.createElement(FaEarlybirds, { size: 36, className: "mb-4" }),
    enabled: true,
    
    // 3D world properties
    position: new THREE.Vector3(150, 50, -120),
    radius: 20,
    color: 0x399d4d,
    glowColor: 0x35db1f,
    coreColor: 0xffffff,
    collisionRadius: 20
  },
  // Add more games here as needed
];

// Helper function to get enabled games only
export const getEnabledGames = (): GameDefinition[] => {
  return GAME_DEFINITIONS.filter(game => game.enabled);
}; 
