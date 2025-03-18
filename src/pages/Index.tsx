
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import StarField from '@/components/StarField';
import PortalAnimation from '@/components/PortalAnimation';
import Navbar from '@/components/Navbar';
import GameMode from '@/components/GameMode';

const Index: React.FC = () => {
  const [gameMode, setGameMode] = useState(false);
  
  const toggleGameMode = () => {
    setGameMode(!gameMode);
  };
  
  return (
    <div className="space-container">
      <Navbar gameMode={gameMode} toggleGameMode={toggleGameMode} />
      
      {gameMode ? (
        <GameMode />
      ) : (
        <>
          <StarField />
          
          <div className="relative min-h-screen flex flex-col items-center justify-center px-4">
            <motion.h1 
              className="text-4xl md:text-6xl font-bold mb-8 tracking-wider text-center"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              COSMIC PORTAL
            </motion.h1>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
            >
              <PortalAnimation />
            </motion.div>
            
            <motion.div
              className="mt-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.8 }}
            >
              <Link to="/games">
                <button className="enter-button">
                  ENTER
                </button>
              </Link>
            </motion.div>
            
            <motion.p
              className="mt-12 text-white/50 max-w-md text-center text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5, duration: 1 }}
            >
              Journey through the cosmos to discover a universe of gaming experiences.
              Toggle GAME MODE in the top right to play directly.
            </motion.p>
          </div>
        </>
      )}
    </div>
  );
};

export default Index;
