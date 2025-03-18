
import React, { useEffect, useRef } from 'react';

const GameMode: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationFrameId: number;
    let particles: { x: number; y: number; size: number; speed: number; angle: number; spin: number; color: string }[] = [];
    
    // Game state
    let score = 0;
    let playerX = 0;
    let playerY = 0;
    const isGameActive = true;
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    const createParticles = () => {
      particles = [];
      const particleCount = 30;
      
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 10 + 5,
          speed: Math.random() * 1 + 0.5,
          angle: Math.random() * Math.PI * 2,
          spin: (Math.random() - 0.5) * 0.1,
          color: `rgba(${Math.floor(Math.random() * 155 + 100)}, ${Math.floor(Math.random() * 155 + 100)}, ${Math.floor(Math.random() * 155 + 100)}, 0.7)`
        });
      }
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      playerX = e.clientX;
      playerY = e.clientY;
    };
    
    const handleClick = () => {
      // Add game click logic
      score += 10;
    };
    
    const draw = () => {
      // Clear canvas
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw particles
      particles.forEach(particle => {
        particle.x += Math.cos(particle.angle) * particle.speed;
        particle.y += Math.sin(particle.angle) * particle.speed;
        particle.angle += particle.spin;
        
        // Wrap around edges
        if (particle.x < -particle.size) particle.x = canvas.width + particle.size;
        if (particle.x > canvas.width + particle.size) particle.x = -particle.size;
        if (particle.y < -particle.size) particle.y = canvas.height + particle.size;
        if (particle.y > canvas.height + particle.size) particle.y = -particle.size;
        
        // Check player collision for gameplay
        const dx = particle.x - playerX;
        const dy = particle.y - playerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < particle.size + 20) {
          particle.angle = Math.atan2(dy, dx);
          score++;
        }
        
        // Draw the particle
        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.angle);
        ctx.fillStyle = particle.color;
        
        // Draw a diamond shape
        ctx.beginPath();
        ctx.moveTo(0, -particle.size);
        ctx.lineTo(particle.size * 0.7, 0);
        ctx.lineTo(0, particle.size);
        ctx.lineTo(-particle.size * 0.7, 0);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
      });
      
      // Draw player cursor
      ctx.beginPath();
      ctx.arc(playerX, playerY, 15, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(playerX, playerY, 18, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw score
      ctx.font = '18px monospace';
      ctx.fillStyle = 'white';
      ctx.textAlign = 'right';
      ctx.fillText(`SCORE: ${score}`, canvas.width - 20, 30);
      
      // Draw game instructions
      ctx.font = '16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('NAVIGATE SPACE - COLLECT COSMIC CRYSTALS', canvas.width / 2, 30);
      ctx.font = '14px monospace';
      ctx.fillText('USE YOUR MOUSE TO PLAY', canvas.width / 2, 60);
    };
    
    const animate = () => {
      if (isGameActive) {
        draw();
      }
      animationFrameId = requestAnimationFrame(animate);
    };
    
    window.addEventListener('resize', resizeCanvas);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);
    
    resizeCanvas();
    createParticles();
    animationFrameId = requestAnimationFrame(animate);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);
  
  return (
    <div className="fixed inset-0 z-0">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-none"
      />
    </div>
  );
};

export default GameMode;
