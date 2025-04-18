
import React, { useEffect, useRef } from 'react';

interface PortalAnimationProps {
  onLoad?: () => void;
  pulseGlow?: boolean;
}

const PortalAnimation: React.FC<PortalAnimationProps> = ({ onLoad, pulseGlow = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationFrameId: number;
    const rings: { radius: number; speed: number; width: number; opacity: number }[] = [];
    
    const resizeCanvas = () => {
      const size = Math.min(400, Math.min(window.innerWidth, window.innerHeight) * 0.5);
      canvas.width = size;
      canvas.height = size;
      generateRings();
    };
    
    const generateRings = () => {
      rings.length = 0;
      const ringCount = 5;
      
      for (let i = 0; i < ringCount; i++) {
        rings.push({
          radius: (canvas.width / 2) * (0.3 + 0.7 * (i / ringCount)),
          speed: 0.2 + Math.random() * 0.3,
          width: 1 + Math.random() * 2,
          opacity: 0.3 + Math.random() * 0.4
        });
      }
    };
    
    const drawPortal = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const baseRadius = canvas.width * 0.4;
      
      // Pulsing glow effect
      let glowIntensity = 0.2;
      if (pulseGlow) {
        // Make the center glow pulse if pulseGlow is true
        glowIntensity = 0.2 + Math.abs(Math.sin(time * 1.5)) * 0.3;
      }
      
      // Draw background glow
      const gradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, baseRadius
      );
      gradient.addColorStop(0, `rgba(255, 255, 255, ${glowIntensity})`);
      gradient.addColorStop(0.5, `rgba(255, 255, 255, ${glowIntensity * 0.25})`);
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
      
      // Draw portal rim with pulsing brightness
      const rimOpacity = pulseGlow ? 0.7 + Math.abs(Math.sin(time * 1.2)) * 0.3 : 0.7;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
      ctx.lineWidth = 2;
      ctx.strokeStyle = `rgba(255, 255, 255, ${rimOpacity})`;
      ctx.stroke();
      
      // Draw animated rings
      rings.forEach((ring, index) => {
        const pulseRadius = ring.radius + Math.sin(time * ring.speed) * 5;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
        ctx.lineWidth = ring.width;
        ctx.strokeStyle = `rgba(255, 255, 255, ${ring.opacity})`;
        ctx.stroke();
      });
      
      // Draw inner portal effect with enhanced glow when pulseGlow is true
      const waveCount = 3;
      for (let i = 0; i < waveCount; i++) {
        const t = (time * 0.5 + i * (Math.PI * 2 / waveCount)) % (Math.PI * 2);
        const waveRadius = baseRadius * 0.8 * (0.5 + 0.5 * Math.sin(t));
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, waveRadius, 0, Math.PI * 2);
        let opacity = 0.1 + 0.1 * Math.sin(t);
        
        // Enhance the inner glow when pulseGlow is enabled
        if (pulseGlow) {
          opacity = 0.15 + 0.15 * Math.sin(time * 2 + i);
        }
        
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.fill();
      }
      
      // Add an extra central glow when pulseGlow is enabled
      if (pulseGlow) {
        const centerGlowRadius = baseRadius * 0.3;
        const centerGlowOpacity = 0.15 + 0.15 * Math.sin(time * 3);
        
        // Draw the center bright spot
        const centerGlow = ctx.createRadialGradient(
          centerX, centerY, 0,
          centerX, centerY, centerGlowRadius
        );
        
        centerGlow.addColorStop(0, `rgba(255, 255, 255, ${centerGlowOpacity + 0.1})`);
        centerGlow.addColorStop(0.8, `rgba(255, 255, 255, ${centerGlowOpacity * 0.5})`);
        centerGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, centerGlowRadius, 0, Math.PI * 2);
        ctx.fillStyle = centerGlow;
        ctx.fill();
      }
    };
    
    const animate = (time: number) => {
      drawPortal(time / 1000);
      animationFrameId = requestAnimationFrame(animate);
    };
    
    window.addEventListener('resize', resizeCanvas);
    
    resizeCanvas();
    animationFrameId = requestAnimationFrame(animate);
    
    // Call onLoad callback after a short delay to ensure animation is visible
    if (onLoad) {
      setTimeout(onLoad, 500);
    }
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [onLoad]);
  
  return (
    <div className="portal-container">
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-full"
      />
    </div>
  );
};

export default PortalAnimation;
