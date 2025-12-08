import React from 'react';
import { PlanetData, PlanetName } from '../types';

interface SolarSystemProps {
  planets: PlanetData[];
  onSelectPlanet: (planet: PlanetName) => void;
}

export const SolarSystem: React.FC<SolarSystemProps> = ({ planets, onSelectPlanet }) => {
  return (
    <div className="relative w-full h-full min-h-screen flex items-center justify-center overflow-hidden bg-slate-900 perspective-1000">
      {/* Background Stars */}
      <div className="absolute inset-0 z-0">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="star opacity-60 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 3}px`,
              height: `${Math.random() * 3}px`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
      </div>

      {/* Sun */}
      <div className="absolute z-10 w-24 h-24 bg-yellow-400 rounded-full shadow-[0_0_60px_rgba(253,224,71,0.6)] animate-pulse flex items-center justify-center">
         <span className="text-yellow-900 font-bold opacity-0 hover:opacity-100 transition-opacity">Sun</span>
      </div>

      {/* Orbits & Planets */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {planets.map((planet) => (
          <div
            key={planet.name}
            className="absolute rounded-full border border-slate-700/30"
            style={{
              width: `calc(var(--orbit-radius) * 2)`,
              height: `calc(var(--orbit-radius) * 2)`,
              '--orbit-radius': planet.orbitRadius,
              '--orbit-duration': planet.orbitDuration,
            } as React.CSSProperties}
          >
            <div 
              className="absolute top-0 left-0 w-full h-full animate-orbit"
            >
              {/* The Planet Click Target */}
              <div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-pointer group hover:scale-125 transition-transform"
                onClick={() => onSelectPlanet(planet.name)}
              >
                <div 
                  className={`rounded-full shadow-lg ${planet.size} ${planet.color}`}
                ></div>
                {/* Tooltip */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap border border-slate-600 transition-opacity z-50 pointer-events-none">
                  {planet.name}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="absolute bottom-8 left-0 w-full text-center z-20 pointer-events-none">
        <h1 className="text-4xl md:text-6xl font-display text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-400 drop-shadow-lg">
          COSMIC EXPLORER
        </h1>
        <p className="text-slate-400 text-sm mt-2 font-display tracking-widest uppercase">Select a planet to begin mission</p>
      </div>
    </div>
  );
};
