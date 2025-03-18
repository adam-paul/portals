
import React from 'react';
import { Gamepad2, Rocket, Telescope, Brain, Dices, Satellite } from 'lucide-react';

interface Game {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const GameGrid: React.FC = () => {
  const games: Game[] = [
    {
      id: 'space-explorer',
      title: 'Space Explorer',
      description: 'Navigate through the cosmos and discover new planets',
      icon: <Rocket size={36} className="mb-4" />
    },
    {
      id: 'astro-puzzler',
      title: 'Astro Puzzler',
      description: 'Solve cosmic riddles and unlock the secrets of the universe',
      icon: <Brain size={36} className="mb-4" />
    },
    {
      id: 'galaxy-defense',
      title: 'Galaxy Defense',
      description: 'Protect your star system from invading alien forces',
      icon: <Satellite size={36} className="mb-4" />
    },
    {
      id: 'cosmic-chance',
      title: 'Cosmic Chance',
      description: 'Test your luck with space-themed probability games',
      icon: <Dices size={36} className="mb-4" />
    },
    {
      id: 'star-navigator',
      title: 'Star Navigator',
      description: 'Chart courses through asteroid fields and nebulas',
      icon: <Telescope size={36} className="mb-4" />
    },
    {
      id: 'alien-arcade',
      title: 'Alien Arcade',
      description: 'Classic arcade games with an extraterrestrial twist',
      icon: <Gamepad2 size={36} className="mb-4" />
    }
  ];
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mx-auto max-w-6xl">
      {games.map((game) => (
        <div key={game.id} className="aspect-square">
          <a href="#" className="game-card h-full">
            <div className="animate-float">{game.icon}</div>
            <h3 className="text-xl font-bold mb-2">{game.title}</h3>
            <p className="text-sm text-white/70">{game.description}</p>
            <div className="mt-4 text-xs uppercase tracking-widest text-white/50 animate-pulse-slow">
              Coming Soon
            </div>
          </a>
        </div>
      ))}
    </div>
  );
};

export default GameGrid;
