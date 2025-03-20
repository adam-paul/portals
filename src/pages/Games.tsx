import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import StarField from '@/components/StarField';
import Navbar from '@/components/Navbar';
import GameGrid from '@/components/GameGrid';
import GameMode from '@/components/GameMode';
import CreatePortalModal from '@/components/CreatePortalModal';

const Games: React.FC = () => {
  const location = useLocation();
  const [gameMode, setGameMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [directGameMode, setDirectGameMode] = useState(false);
  
  useEffect(() => {
    // Check if URL has gameMode=true query parameter
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('gameMode') === 'true') {
      setDirectGameMode(true);
      setIsLoading(true);
      
      // Add a small delay to allow loading screen to render before showing game mode
      const timer = setTimeout(() => {
        setGameMode(true);
        setIsLoading(false);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [location]);
  
  const toggleGameMode = () => {
    if (gameMode) {
      setGameMode(false);
    } else {
      setIsLoading(true);
      // Brief loading before showing game mode
      setTimeout(() => {
        setGameMode(true);
        setIsLoading(false);
      }, 1000);
    }
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
  
  // Loading screen component
  const LoadingScreen = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="text-center">
        <div className="mb-6">
          <div className="inline-block w-16 h-16 border-4 border-t-white/80 border-r-white/30 border-b-white/10 border-l-white/60 rounded-full animate-spin"></div>
        </div>
        <h2 className="text-2xl font-bold tracking-wider text-white/90">Loading Game World...</h2>
      </div>
    </div>
  );
  
  // Don't render normal content (not even Navbar) when direct game mode is used
  if (directGameMode && (isLoading || gameMode)) {
    return (
      <div className="space-container">
        {isLoading ? <LoadingScreen /> : <GameMode onExit={toggleGameMode} />}
      </div>
    );
  }
  
  return (
    <div className="space-container">
      {!gameMode && <Navbar gameMode={gameMode} toggleGameMode={toggleGameMode} />}
      
      {isLoading ? (
        <LoadingScreen />
      ) : gameMode ? (
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
              <h1 className="text-3xl md:text-4xl font-bold mb-4 tracking-wider">PORTALS</h1>
              <p className="text-white/70 max-w-2xl mx-auto">
                Explore a collection of games from across the metaverse. Each game offers a unique 
                adventure into the mind of its creator.
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
            
            {/* Create Portal Button */}
            <motion.div
              className="text-center mt-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 1 }}
            >
              <CreatePortalModal />
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
};

export default Games;
