export enum PlanetName {
  Mercury = 'Mercury',
  Venus = 'Venus',
  Earth = 'Earth',
  Mars = 'Mars',
  Jupiter = 'Jupiter',
  Saturn = 'Saturn',
  Uranus = 'Uranus',
  Neptune = 'Neptune'
}

export enum GameState {
  MENU = 'MENU',
  BRIEFING = 'BRIEFING',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY'
}

export interface PlanetData {
  name: PlanetName;
  color: string;
  size: string; // Tailwind width/height classes
  orbitRadius: string; // CSS variable value
  orbitDuration: string;
  description: string;
  gameTitle: string;
  gameInstruction: string;
}

export interface BriefingContent {
  title: string;
  mission: string;
}

export interface FactContent {
  fact: string;
}