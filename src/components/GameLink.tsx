import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface GameLinkProps {
  position: THREE.Vector3;
  radius: number;
  color: number;
  glowColor?: number;
  coreColor?: number;
  url: string;
  title: string;
  collisionRadius?: number;
  onCollision?: () => void;
}

class GameLinkObject {
  mesh: THREE.Mesh;
  glow: THREE.Mesh;
  outerGlow: THREE.Mesh;
  core: THREE.Mesh;
  light: THREE.PointLight;
  userData: {
    type: string;
    collisionRadius: number;
    url: string;
    title: string;
  };

  constructor(
    scene: THREE.Scene,
    position: THREE.Vector3,
    radius: number,
    color: number,
    glowColor: number = 0xffffcc,
    coreColor: number = 0xffffff,
    url: string,
    title: string,
    collisionRadius?: number
  ) {
    // Create the main sphere
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color: color,
    });
    
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(position);
    
    // Store metadata for collision detection
    this.userData = {
      type: 'portal',
      collisionRadius: collisionRadius || radius,
      url: url,
      title: title
    };
    
    // Apply user data to the mesh
    this.mesh.userData = this.userData;
    
    scene.add(this.mesh);
    
    // Add a glow effect
    const glowGeometry = new THREE.SphereGeometry(radius * 1.25, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: glowColor,
      transparent: true,
      opacity: 0.6,
      side: THREE.BackSide
    });
    
    this.glow = new THREE.Mesh(glowGeometry, glowMaterial);
    this.mesh.add(this.glow);
    
    // Outer glow for more effect
    const outerGlowGeometry = new THREE.SphereGeometry(radius * 1.6, 32, 32);
    const outerGlowMaterial = new THREE.MeshBasicMaterial({
      color: glowColor,
      transparent: true,
      opacity: 0.3,
      side: THREE.BackSide
    });
    
    this.outerGlow = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
    this.mesh.add(this.outerGlow);
    
    // Inner bright core
    const coreGeometry = new THREE.SphereGeometry(radius * 0.9, 32, 32);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: coreColor,
      transparent: true,
      opacity: 0.7
    });
    this.core = new THREE.Mesh(coreGeometry, coreMaterial);
    this.mesh.add(this.core);
    
    // Add a point light
    this.light = new THREE.PointLight(glowColor, 2, radius * 25);
    this.light.position.copy(position);
    scene.add(this.light);
  }

  update(time: number, playerPosition: THREE.Vector3) {
    // Make the orb pulse
    const pulseFactor = 1 + Math.sin(time * 1.5) * 0.1;
    
    this.glow.scale.set(pulseFactor, pulseFactor, pulseFactor);
    this.outerGlow.scale.set(pulseFactor * 1.1, pulseFactor * 1.1, pulseFactor * 1.1);
    this.core.scale.set(pulseFactor * 0.95, pulseFactor * 0.95, pulseFactor * 0.95);
    
    // Make the core color pulse
    const coreBrightness = 0.7 + Math.sin(time * 2) * 0.2;
    if (this.core.material instanceof THREE.MeshBasicMaterial) {
      this.core.material.color.setRGB(1, 1, coreBrightness);
    }
    
    // Adjust lighting based on distance to the player
    const distance = playerPosition.distanceTo(this.mesh.position);
    const proximityThreshold = this.userData.collisionRadius * 10;
    
    if (distance < proximityThreshold) {
      const intensity = 3 - (distance / proximityThreshold) * 2;
      this.light.intensity = intensity;
      
      // Increase bloom/glow effect when very close
      if (distance < proximityThreshold / 4) {
        const glowIntensity = 0.6 + (1 - distance / (proximityThreshold / 4)) * 0.4;
        if (this.glow.material instanceof THREE.MeshBasicMaterial) {
          this.glow.material.opacity = glowIntensity;
        }
        if (this.outerGlow.material instanceof THREE.MeshBasicMaterial) {
          this.outerGlow.material.opacity = glowIntensity * 0.5;
        }
        if (this.core.material instanceof THREE.MeshBasicMaterial) {
          this.core.material.opacity = Math.min(0.9, glowIntensity + 0.2);
        }
      }
    } else {
      this.light.intensity = 1;
    }
  }

  checkCollision(playerPosition: THREE.Vector3, playerRadius: number): boolean {
    const distance = playerPosition.distanceTo(this.mesh.position);
    return distance <= (this.userData.collisionRadius + playerRadius);
  }

  remove(scene: THREE.Scene) {
    scene.remove(this.mesh);
    scene.remove(this.light);
  }
}

export { GameLinkObject };
export type { GameLinkProps }; 