import React from 'react';
import { getEnabledGames } from '@/data/games';

const GameGrid: React.FC = () => {
  const games = getEnabledGames();
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mx-auto max-w-6xl">
      {games.map((game) => (
        <div key={game.id} className="aspect-square">
          <a href={game.enabled ? game.url : "#"} className="game-card h-full">
            <div className="animate-float">{game.icon}</div>
            <h3 className="text-xl font-bold mb-2">{game.title}</h3>
            <p className="text-sm text-white/70">{game.description}</p>
            {!game.enabled && (
              <div className="mt-4 text-xs uppercase tracking-widest text-white/50 animate-pulse-slow">
                Coming Soon
              </div>
            )}
          </a>
        </div>
      ))}
    </div>
  );
};

export default GameGrid;
