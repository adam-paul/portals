import * as THREE from 'three';
import { FaBugSlash,
         FaCircleQuestion,
         FaEarlybirds,
         FaHouseLaptop,
         FaPersonRunning,
         FaPlane, 
         FaRobot, 
         FaSpaghettiMonsterFlying } from "react-icons/fa6";
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
    position: new THREE.Vector3(10, 50, -200),
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
    radius: 20,
    color: 0x9F2B68,
    glowColor: 0xBF40BF,
    coreColor: 0x9F2B68,
    collisionRadius: 20
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
  {
    id: 'hackerhouse-ai',
    title: 'HackerHouse AI',
    description: 'Talk to your friends in a virtual hacker house',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    icon: React.createElement(FaHouseLaptop, { size: 36, className: "mb-4" }),
    enabled: true,
    
    // 3D world properties
    position: new THREE.Vector3(-90, 110, -30),
    radius: 20,
    color: 0xbe38f3,
    glowColor: 0x0061ff,
    coreColor: 0xffffff,
    collisionRadius: 20
  },
  {
    id: 'prkr',
    title: 'PRKR',
    description: 'Infinite, satisfying parkour shooter',
    url: 'https://prkr.run',
    icon: React.createElement(FaPersonRunning, { size: 36, className: "mb-4" }),
    enabled: true,
    
    // 3D world properties
    position: new THREE.Vector3(69, 69, 69),
    radius: 20,
    color: 0x584578,
    glowColor: 0x584578,
    coreColor: 0x584578,
    collisionRadius: 20
  },
  {
    id: 'dingbotics',
    title: 'Dingbotics',
    description: 'Abandon All Hope, Ye Who Enter Here',
    url: 'https://dingbotics.com/',
    icon: React.createElement(FaRobot, { size: 36, className: "mb-4" }),
    enabled: true,
    
    // 3D world properties
    position: new THREE.Vector3(-100, -100, -100),
    radius: 20,
    color: 0x2e2e29,
    glowColor: 0xf3fdce,
    coreColor: 0x584578,
    collisionRadius: 20
  },
  {
    id: 'you-the-mantis',
    title: 'You The Mantis',
    description: 'Catch flies! Against the clock! And beat your mantis friends and family. Made by mira.ly (7yo) and hybridherbst',
    url: 'https://fang-die-fliege-z23hmxbz1f9iur.needle.run/',
    icon: React.createElement(FaBugSlash, { size: 36, className: "mb-4" }),
    enabled: true,
    
    // 3D world properties
    position: new THREE.Vector3(-20, 80, 40),
    radius: 20,
    color: 0x48e246,
    glowColor: 0xf3fdce,
    coreColor: 0xebfd5d,
    collisionRadius: 20
  },
  {
    id: 'vibeverse',
    title: 'Vibeverse',
    description: 'A portal into a random vibegame from the Pieterverse of the @levelsio game jam',
    url: 'http://portal.pieter.com?ref=https%3A%2F%2Fgame-portals.com%2Fgames%3FgameMode%3Dtrue',
    icon: React.createElement(FaCircleQuestion, { size: 36, className: "mb-4" }),
    enabled: true,
    
    // 3D world properties
    position: new THREE.Vector3(0, -120, -40),
    radius: 20,
    color: 0xcc0000,
    glowColor: 0xf218ea,
    coreColor: 0xebfd5d,
    collisionRadius: 20
  },
  // Add more games here as needed
];

// Helper function to get enabled games only
export const getEnabledGames = (): GameDefinition[] => {
  return GAME_DEFINITIONS.filter(game => game.enabled);
}; 
