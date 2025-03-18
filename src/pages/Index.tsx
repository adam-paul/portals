
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import StarField from '@/components/StarField';
import PortalAnimation from '@/components/PortalAnimation';
import Navbar from '@/components/Navbar';

const Index: React.FC = () => {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Set loaded state after a short delay to ensure animations are ready
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handlePortalClick = () => {
    navigate('/games?gameMode=true');
  };
  
  return (
    <div className="space-container">
      <Navbar />
      
      <>
          <StarField />
          
          <div className="relative min-h-screen flex flex-col items-center justify-center px-4">
            <motion.h1 
              className="text-4xl md:text-6xl font-bold mb-8 tracking-wider text-center"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              PORTALS
            </motion.h1>
            
            {/* Portal container with fixed dimensions to prevent layout shifting */}
            <div className="w-60 h-60 md:w-80 md:h-80 relative flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 1 }}
                className="absolute inset-0 cursor-pointer"
                onClick={handlePortalClick}
              >
                <PortalAnimation onLoad={() => setIsLoaded(true)} />
              </motion.div>
            </div>
            
            {/* Enter button that only appears after portal is loaded */}
            <AnimatePresence>
              {isLoaded && (
                <motion.div
                  className="mt-16 relative z-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8 }}
                >
                  <Link to="/games">
                    <button className="text-2xl font-bold tracking-wider text-space-light hover:text-space-light/80 transition-all duration-300">
                      ENTER
                    </button>
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
            
            <AnimatePresence>
              {isLoaded && (
                <motion.p
                  className="mt-12 text-white/50 max-w-md text-center text-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 1 }}
                >
                  Journey through the cosmos to discover a universe of gaming experiences.
                  Click the portal to enter the game universe directly.
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </>
    </div>
  );
};

export default Index;
