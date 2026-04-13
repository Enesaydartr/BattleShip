export type GameMode = 'menu' | 'class' | 'leaderboard' | 'select_friend' | 'select_bot' | 'tournament_setup' | 'tournament_bracket' | 'placement' | 'playing' | 'game_over';

export interface Student {
  id: string;
  name: string;
  wins: number;
  losses: number;
  shipsDestroyed: number;
  powerupsUsed: number;
}

export type ShipType = 'carrier' | 'battleship' | 'cruiser1' | 'cruiser2' | 'destroyer';

export interface ShipDef {
  id: ShipType;
  size: number;
  color: string;
  name: string;
}

export interface PlacedShip {
  id: ShipType;
  x: number;
  y: number;
  vertical: boolean;
  isShielded: boolean;
}

export interface PlacedMine {
  x: number;
  y: number;
}

export interface Cell {
  x: number;
  y: number;
  hasShip: ShipType | null;
  hasMine: boolean;
  isHit: boolean;
  isMiss: boolean;
  hasPowerupBox: boolean;
  isRevealed: boolean;
}

export type PowerupType = 'random_5' | 'radar' | 'bomb_3x3' | 'bomb_5x5' | 'heal' | 'shield';

export interface PowerupDef {
  id: PowerupType;
  name: string;
  icon: any;
  desc: string;
}

export type Weather = 'normal' | 'storm' | 'fog';

export interface PlayerState {
  id: string;
  name: string;
  isBot: boolean;
  difficulty?: 'easy' | 'medium' | 'hard' | 'impossible';
  board: Cell[][];
  ships: PlacedShip[];
  mines: PlacedMine[];
  powerups: PowerupType[];
  timer: number;
}

export interface TournamentMatch {
  id: number;
  player1: Student | null;
  player2: Student | null;
  winner: Student | null;
  nextMatchId: number | null;
}
