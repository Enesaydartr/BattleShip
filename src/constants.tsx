import { ShipDef, PowerupDef } from './types';
import { Crosshair, Radar, Bomb, Flame, Wrench, Shield } from 'lucide-react';

export const SHIPS: ShipDef[] = [
  { id: 'carrier', size: 5, color: 'bg-red-500', name: 'Uçak Gemisi' },
  { id: 'battleship', size: 4, color: 'bg-purple-500', name: 'Savaş Gemisi' },
  { id: 'cruiser1', size: 3, color: 'bg-blue-500', name: 'Kruvazör 1' },
  { id: 'cruiser2', size: 3, color: 'bg-blue-500', name: 'Kruvazör 2' },
  { id: 'destroyer', size: 2, color: 'bg-teal-500', name: 'Muhrip' },
];

export const POWERUPS: Record<string, PowerupDef> = {
  random_5: { id: 'random_5', name: '5x Rastgele', icon: Crosshair, desc: 'Rastgele 5 atış yapar.' },
  radar: { id: 'radar', name: 'Radar', icon: Radar, desc: 'Rakibin bir gemi parçasını gösterir.' },
  bomb_3x3: { id: 'bomb_3x3', name: '3x3 Bomba', icon: Bomb, desc: '3x3 alana hasar verir.' },
  bomb_5x5: { id: 'bomb_5x5', name: '5x5 Bomba', icon: Flame, desc: '5x5 alana hasar verir.' },
  heal: { id: 'heal', name: 'Tamir Kiti', icon: Wrench, desc: 'Vurulan bir gemi parçasını tamir eder.' },
  shield: { id: 'shield', name: 'Kalkan', icon: Shield, desc: 'Rastgele bir gemiyi bir vuruştan korur.' },
};

export const EMOJIS = ['😂', '😡', '😭', '🤯', '🥳'];
