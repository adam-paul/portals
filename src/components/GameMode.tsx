
import React, { useEffect, useRef, useState } from 'react';

interface GameModeProps {
  onExit: () => void;
}

const GameMode: React.FC<GameModeProps> = ({ onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showExitDialog, setShowExitDialog] = useState(false);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationFrameId: number;
    let particles: { x: number; y: number; size: number; speed: number; angle: number; spin: number; color: string }[] = [];
    
    // Game state
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
      
      // No text or score display
    };
    
    const animate = () => {
      if (isGameActive) {
        draw();
      }
      animationFrameId = requestAnimationFrame(animate);
    };
    
    // Handle ESC key to show exit dialog
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowExitDialog(true);
      }
    };
    
    window.addEventListener('resize', resizeCanvas);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);
    window.addEventListener('keydown', handleKeyDown);
    
    resizeCanvas();
    createParticles();
    animationFrameId = requestAnimationFrame(animate);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleKeyDown);
      cancelAnimationFrame(animationFrameId);
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
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-none"
      />
      
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
