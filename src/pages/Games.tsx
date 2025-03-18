
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import StarField from '@/components/StarField';
import Navbar from '@/components/Navbar';
import GameGrid from '@/components/GameGrid';
import GameMode from '@/components/GameMode';

const Games: React.FC = () => {
  const location = useLocation();
  const [gameMode, setGameMode] = useState(false);
  
  useEffect(() => {
    // Check if URL has gameMode=true query parameter
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('gameMode') === 'true') {
      setGameMode(true);
    }
  }, [location]);
  
  const toggleGameMode = () => {
    setGameMode(!gameMode);
  };
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const childVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };
  
  return (
    <div className="space-container">
      {!gameMode && <Navbar gameMode={gameMode} toggleGameMode={toggleGameMode} />}
      
      {gameMode ? (
        <GameMode onExit={toggleGameMode} />
      ) : (
        <>
          <StarField />
          
          <div className="pt-24 pb-16 px-6 md:px-8 relative">
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-3xl md:text-4xl font-bold mb-4 tracking-wider">COSMIC GAMES</h1>
              <p className="text-white/70 max-w-2xl mx-auto">
                Explore our collection of space-themed games. Each game offers a unique 
                adventure into the mysteries of the cosmos.
              </p>
            </motion.div>
            
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="mt-8"
            >
              <GameGrid />
            </motion.div>
            
            <motion.div
              className="text-center mt-16 text-white/50 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 1 }}
            >
              More games coming soon to Portals...
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
};

export default Games;
