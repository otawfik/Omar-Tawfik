import React, { useState } from 'react';
import { SolarSystem } from './components/SolarSystem';
import { MiniGame } from './components/MiniGame';
import { PlanetName, GameState, BriefingContent } from './types';
import { generateBriefing, generateFact } from './services/gemini';

// Planet Constants - Orbits significantly slowed down for easier selection
const PLANETS = [
  { name: PlanetName.Mercury, color: 'bg-stone-400', size: 'w-4 h-4', orbitRadius: '60px', orbitDuration: '25s', description: 'The swift planet.', gameTitle: 'Solar Flare Survival', gameInstruction: 'Dodge the incoming solar flares. Don\'t get burned.' },
  { name: PlanetName.Venus, color: 'bg-yellow-600', size: 'w-6 h-6', orbitRadius: '90px', orbitDuration: '40s', description: 'The hot planet.', gameTitle: 'Acid Ascension', gameInstruction: 'Thrust up to escape. Dodge acid clouds.' },
  { name: PlanetName.Earth, color: 'bg-blue-500', size: 'w-7 h-7', orbitRadius: '125px', orbitDuration: '60s', description: 'Our home.', gameTitle: 'Orbital Defense', gameInstruction: 'Rotate shield to block debris. Let ships pass.' },
  { name: PlanetName.Mars, color: 'bg-red-500', size: 'w-5 h-5', orbitRadius: '160px', orbitDuration: '80s', description: 'The red planet.', gameTitle: 'Red Rover Drift', gameInstruction: 'Steer the rover to collect samples. Avoid rocks.' },
  { name: PlanetName.Jupiter, color: 'bg-orange-300', size: 'w-16 h-16', orbitRadius: '220px', orbitDuration: '120s', description: 'The giant.', gameTitle: 'Gravity Well', gameInstruction: 'Hold to thrust outward. Release to fall inward. Orbit!' },
  { name: PlanetName.Saturn, color: 'bg-yellow-200', size: 'w-14 h-14', orbitRadius: '290px', orbitDuration: '160s', description: 'The ringed planet.', gameTitle: 'Ring Racer', gameInstruction: 'Weave through the asteroid gaps at high speed.' },
  { name: PlanetName.Uranus, color: 'bg-cyan-300', size: 'w-10 h-10', orbitRadius: '350px', orbitDuration: '200s', description: 'The tilted planet.', gameTitle: 'Atmosphere Harvester', gameInstruction: 'Catch the blue gas samples. Avoid ice rocks.' },
  { name: PlanetName.Neptune, color: 'bg-blue-700', size: 'w-10 h-10', orbitRadius: '410px', orbitDuration: '260s', description: 'The windy planet.', gameTitle: 'Diamond Rain', gameInstruction: 'Fight the supersonic wind. Catch diamonds.' },
];

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetName | null>(null);
  const [briefing, setBriefing] = useState<BriefingContent | null>(null);
  const [fact, setFact] = useState<string>("");
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectPlanet = async (planet: PlanetName) => {
    setSelectedPlanet(planet);
    setGameState(GameState.BRIEFING);
    setIsLoading(true);
    
    // Fetch briefing from Gemini
    const content = await generateBriefing(planet);
    setBriefing(content);
    setIsLoading(false);
  };

  const handleStartGame = () => {
    setGameState(GameState.PLAYING);
  };

  const handleGameOver = async (won: boolean, finalScore: number) => {
    setGameState(won ? GameState.VICTORY : GameState.GAME_OVER);
    setScore(finalScore);
    setIsLoading(true);

    if (selectedPlanet) {
      const generatedFact = await generateFact(selectedPlanet, won);
      setFact(generatedFact);
    }
    setIsLoading(false);
  };

  const handleBackToMenu = () => {
    setGameState(GameState.MENU);
    setSelectedPlanet(null);
    setBriefing(null);
    setFact("");
  };

  // --- RENDER HELPERS ---

  if (gameState === GameState.MENU) {
    return <SolarSystem planets={PLANETS} onSelectPlanet={handleSelectPlanet} />;
  }

  if (gameState === GameState.BRIEFING) {
    return (
      <div className="w-full h-screen bg-slate-900 flex items-center justify-center p-6 text-white">
        <div className="max-w-2xl w-full bg-slate-800 border border-slate-600 rounded-lg p-8 shadow-2xl relative overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="font-display animate-pulse">Establishing uplink with {selectedPlanet}...</p>
            </div>
          ) : (
            <>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
              <h2 className="text-3xl font-display text-cyan-400 mb-2 uppercase">{briefing?.title}</h2>
              <h3 className="text-xl text-slate-400 mb-6 font-display tracking-widest">MISSION BRIEFING</h3>
              
              <div className="bg-slate-900/50 p-6 rounded border border-slate-700 mb-8 font-mono text-lg leading-relaxed text-green-400">
                <p>{">"} {briefing?.mission}</p>
              </div>

              <div className="flex justify-between items-center">
                <button onClick={handleBackToMenu} className="text-slate-500 hover:text-white transition-colors uppercase font-bold text-sm tracking-wider">
                  Abort Mission
                </button>
                <button 
                  onClick={handleStartGame}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-3 rounded font-display tracking-wider uppercase transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(8,145,178,0.5)]"
                >
                  Engage Thrusters
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  if (gameState === GameState.PLAYING && selectedPlanet) {
    const planetData = PLANETS.find(p => p.name === selectedPlanet);
    return (
      <div className="w-full h-screen bg-slate-900 flex flex-col items-center">
        <div className="w-full p-4 flex justify-between items-center bg-slate-800 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-display text-white">{selectedPlanet} Sector</h2>
            <p className="text-xs text-slate-400 font-mono">{planetData?.gameInstruction}</p>
          </div>
          <button onClick={handleBackToMenu} className="text-red-400 text-sm hover:underline">ABORT</button>
        </div>
        <div className="flex-1 w-full flex items-center justify-center overflow-hidden bg-black">
           <MiniGame planet={selectedPlanet} onGameOver={handleGameOver} />
        </div>
      </div>
    );
  }

  if ((gameState === GameState.VICTORY || gameState === GameState.GAME_OVER) && selectedPlanet) {
    return (
      <div className="w-full h-screen bg-slate-900 flex items-center justify-center p-6 text-white">
        <div className="max-w-2xl w-full bg-slate-800 border border-slate-600 rounded-lg p-8 shadow-2xl text-center">
           {isLoading ? (
             <div className="flex flex-col items-center">
               <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-4"></div>
               <p className="font-display animate-pulse">Analyzing mission data...</p>
             </div>
           ) : (
             <>
                <h2 className={`text-4xl font-display mb-2 ${gameState === GameState.VICTORY ? 'text-green-400' : 'text-red-400'}`}>
                  {gameState === GameState.VICTORY ? 'MISSION ACCOMPLISHED' : 'MISSION FAILED'}
                </h2>
                <div className="text-2xl font-bold mb-6">Score: {Math.floor(score)}</div>
                
                <div className="bg-slate-900 p-6 rounded border border-slate-700 mb-8 text-left">
                  <h4 className="text-yellow-500 font-display text-sm uppercase mb-2">Scientific Log</h4>
                  <p className="text-slate-300 leading-relaxed italic">"{fact}"</p>
                </div>

                <div className="flex justify-center gap-4">
                  <button 
                    onClick={handleBackToMenu}
                    className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded font-display uppercase transition-colors"
                  >
                    Return to Star Map
                  </button>
                  <button 
                    onClick={() => handleSelectPlanet(selectedPlanet)}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded font-display uppercase transition-colors"
                  >
                    Retry Mission
                  </button>
                </div>
             </>
           )}
        </div>
      </div>
    );
  }

  return null;
}