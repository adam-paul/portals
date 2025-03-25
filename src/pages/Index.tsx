import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import StarField from '@/components/StarField';
import PortalAnimation from '@/components/PortalAnimation';
import Navbar from '@/components/Navbar';
import CreatePortalModal from '@/components/CreatePortalModal';
import { getEnabledGames } from '@/data/games';

const Index: React.FC = () => {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCollapsing, setIsCollapsing] = useState(false);
  const createPortalRef = React.useRef<HTMLButtonElement>(null);
  
  // Listen for popstate events (browser back/forward buttons) and visibility changes
  useEffect(() => {
    const resetState = () => {
      // Reset the states when user navigates back to this page
      setIsCollapsing(false);
      setIsLoaded(false);
      
      // Re-trigger the loading sequence
      setTimeout(() => {
        setIsLoaded(true);
      }, 800);
    };
    
    // Handle browser back button and history navigation
    window.addEventListener('popstate', resetState);
    
    // Create a named handler for visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        resetState();
      }
    };
    
    // Handle when user returns to the page after visiting another page or tab
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Handle when a user returns to the tab
    window.addEventListener('focus', resetState);
    
    return () => {
      window.removeEventListener('popstate', resetState);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', resetState);
    };
  }, []);
  
  // Reset states and set loaded state after a short delay to ensure animations are ready
  useEffect(() => {
    // Reset the collapsing state whenever the component mounts
    setIsCollapsing(false);
    
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handlePortalClick = () => {
    setIsCollapsing(true);
    
    // Navigate after collapse animation completes (1 second)
    setTimeout(() => {
      navigate('/games?gameMode=true');
    }, 1000);
  };

  const handleRandomGame = () => {
    setIsCollapsing(true);
    
    // Get a random enabled game
    const enabledGames = getEnabledGames();
    const randomGame = enabledGames[Math.floor(Math.random() * enabledGames.length)];
    
    // Navigate after collapse animation completes
    setTimeout(() => {
      window.location.href = randomGame.url;
    }, 1000);
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
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold tracking-wider text-space-light/20">
                  ENTER
                </span>
              </div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ 
                  opacity: isCollapsing ? 0 : 1, 
                  scale: isCollapsing ? 0 : 1,
                  y: isCollapsing ? 300 : 0
                }}
                transition={{ 
                  duration: isCollapsing ? 1 : 1,
                  ease: isCollapsing ? "easeIn" : "easeOut"
                }}
                className="absolute inset-0 cursor-pointer"
                onClick={handlePortalClick}
              >
                <PortalAnimation onLoad={() => setIsLoaded(true)} pulseGlow={true} />
              </motion.div>
            </div>
            
            {/* Buttons that only appear after portal is loaded */}
            <AnimatePresence>
              {isLoaded && !isCollapsing && (
                <motion.div
                  className="mt-16 relative z-10 flex flex-col items-center gap-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  <Link to="/games">
                    <button className="text-2xl font-bold tracking-wider text-space-light hover:text-space-light/80 transition-all duration-300">
                      ○ ALL GAMES
                    </button>
                  </Link>
                  <button 
                    onClick={handleRandomGame}
                    className="text-2xl font-bold tracking-wider text-space-light hover:text-space-light/80 transition-all duration-300"
                  >
                    ○ I'M FEELING LUCKY
                  </button>
                  <button 
                    onClick={() => createPortalRef.current?.click()}
                    className="text-2xl font-bold tracking-wider text-space-light hover:text-space-light/80 transition-all duration-300"
                  >
                    ○ CREATE A PORTAL TO YOUR WORLD
                  </button>
                  <div className="hidden">
                    <CreatePortalModal triggerRef={createPortalRef} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <AnimatePresence>
              {isLoaded && !isCollapsing && (
                <motion.p
                  className="mt-12 text-white/50 max-w-md text-center text-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: 0.3, duration: 1 }}
                >
                  Explore the game universe that you yourself have created. Go anywhere. Discover anything.
                  Click the portal to enter the Vibe-Cosmos directly.
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </>
    </div>
  );
};

export default Index;
