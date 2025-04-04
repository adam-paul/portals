
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Rocket, ListIcon, Gamepad2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface NavbarProps {
  gameMode?: boolean;
  toggleGameMode?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ gameMode = false, toggleGameMode }) => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  
  return (
    <nav className="fixed top-0 left-0 w-full flex justify-between items-center px-4 md:px-8 py-4 z-50 bg-space-dark/80 backdrop-blur-sm">
      <Link to="/" className="flex items-center space-x-2 text-space-light hover:opacity-80 transition-opacity">
        <Rocket size={24} />
        <span className="text-lg font-bold tracking-wider hidden sm:inline">PORTALS</span>
      </Link>
      
      <div className="flex items-center space-x-6">
        {!isHomePage && (
          <Link 
            to="/games" 
            className="text-space-light hover:opacity-80 transition-opacity"
          >
            GAMES
          </Link>
        )}
        
        {toggleGameMode && (
          <div className="flex items-center space-x-2">
            <ListIcon size={18} className={`${gameMode ? 'opacity-50' : 'opacity-100'}`} />
            <Switch
              checked={gameMode}
              onCheckedChange={toggleGameMode}
            />
            <Gamepad2 size={18} className={`${gameMode ? 'opacity-100' : 'opacity-50'}`} />
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
