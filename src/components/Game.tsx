import React, { useState, useEffect } from 'react';
import { PlayerState, PowerupType, Cell, GameMode, Weather } from '../types';
import { POWERUPS, EMOJIS, SHIPS } from '../constants';
import { isShipSunk, checkWin, getShipRemainingParts } from '../utils';
import { oyunSesiCal, playBeep } from '../audio';
import { motion, AnimatePresence } from 'motion/react';
import { Gift, Shield as ShieldIcon, CloudLightning, CloudFog, Sun, X } from 'lucide-react';

interface Props {
  player1: PlayerState;
  player2: PlayerState;
  setPlayer1: React.Dispatch<React.SetStateAction<PlayerState | null>>;
  setPlayer2: React.Dispatch<React.SetStateAction<PlayerState | null>>;
  activePlayer: 1 | 2;
  setActivePlayer: React.Dispatch<React.SetStateAction<1 | 2>>;
  onGameOver: (winner: 1 | 2) => void;
  onQuit: () => void;
  mode: GameMode;
}

export const Game = ({ player1, player2, setPlayer1, setPlayer2, activePlayer, setActivePlayer, onGameOver, onQuit, mode }: Props) => {
  const [selectedPowerup, setSelectedPowerup] = useState<PowerupType | null>(null);
  const [activeEmojis, setActiveEmojis] = useState<{id: number, emoji: string, x: number, y: number}[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [screenShake, setScreenShake] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(3);
  const [animatingShots, setAnimatingShots] = useState<{x: number, y: number, boardOwner: 1 | 2, type?: 'shoot' | 'radar'}[]>([]);
  
  const [turnCount, setTurnCount] = useState(0);
  const [extraTurns, setExtraTurns] = useState(0);
  const [weather, setWeather] = useState<Weather>('normal');

  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      playBeep(800, 0.1); // Normal beep for 3, 2, 1
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      oyunSesiCal('start.mp3', true);
      const timer = setTimeout(() => setCountdown(null), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 2500);
  };

  const handleEmoji = (emoji: string) => {
    const newEmoji = { id: Date.now(), emoji, x: Math.random() * 80 + 10, y: 100 };
    setActiveEmojis(prev => [...prev, newEmoji]);
    setTimeout(() => {
      setActiveEmojis(prev => prev.filter(e => e.id !== newEmoji.id));
    }, 2000);
  };

  const spawnPowerup = (player: PlayerState, setPlayer: any) => {
    // Sadece tahtada hiç hediye yoksa yeni bir tane çıkar
    let hasPowerup = false;
    for(let y=0; y<10; y++) {
      for(let x=0; x<10; x++) {
        if(player.board[y][x].hasPowerupBox) hasPowerup = true;
      }
    }
    if (hasPowerup) return;

    const newBoard = [...player.board.map(row => [...row])];
    const emptyCells = [];
    for(let y=0; y<10; y++) {
      for(let x=0; x<10; x++) {
        if(!newBoard[y][x].hasShip && !newBoard[y][x].hasMine && !newBoard[y][x].hasPowerupBox && !newBoard[y][x].isHit && !newBoard[y][x].isMiss) {
          emptyCells.push({x,y});
        }
      }
    }
    if(emptyCells.length > 0) {
      const target = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      newBoard[target.y][target.x].hasPowerupBox = true;
      setPlayer({...player, board: newBoard});
    }
  };

  const switchTurn = (mineHit = false) => {
    setSelectedPowerup(null);
    if (mineHit) {
      setExtraTurns(1);
      setActivePlayer(activePlayer === 1 ? 2 : 1);
    } else if (extraTurns > 0) {
      setExtraTurns(prev => prev - 1);
    } else {
      setActivePlayer(activePlayer === 1 ? 2 : 1);
    }
    setTurnCount(prev => prev + 1);
  };

  // Inactivity Timer
  useEffect(() => {
    if (countdown !== null) return;
    if (mode === 'playing' && player2.isBot && activePlayer === 2) return;
    if (checkWin(player1.board) || checkWin(player2.board)) return;

    const timeout = setTimeout(() => {
      const sound = Math.random() > 0.5 ? 'oynasana.mp3' : 'oynasana1.mp3';
      oyunSesiCal(sound, true);
    }, 10000);

    return () => clearTimeout(timeout);
  }, [activePlayer, turnCount, countdown, mode, player1.board, player2.board, player2.isBot]);

  // Weather & Powerup Spawn System
  useEffect(() => {
    if (turnCount > 0) {
      // Spawn powerup every 6 turns (3 full rounds)
      if (turnCount % 6 === 0) {
        spawnPowerup(player1, setPlayer1);
        spawnPowerup(player2, setPlayer2);
      }

      // Weather every 10 turns
      if (turnCount % 10 === 0) {
        const r = Math.random();
        let newWeather: Weather = 'normal';
        if (r < 0.33) newWeather = 'storm';
        else if (r < 0.66) newWeather = 'fog';
        
        setWeather(newWeather);
        
        if (newWeather === 'storm') {
          oyunSesiCal('storm.mp3', true);
          showMessage("FIRTINA ÇIKTI! Atışlar sapabilir.");
        } else if (newWeather === 'fog') {
          oyunSesiCal('fog.mp3', true);
          showMessage("SİS ÇÖKTÜ! Radarlar çalışmıyor.");
        } else {
          showMessage("Deniz sakinleşti.");
        }
      }
    }
  }, [turnCount]);

  const processHit = (targetBoard: Cell[][], x: number, y: number, attacker: PlayerState, defender: PlayerState, isBotMove: boolean = false): { hit: boolean, powerup: PowerupType | null } => {
    const cell = targetBoard[y][x];
    if (cell.isHit || cell.isMiss) return { hit: false, powerup: null };

    let hit = false;
    let powerup: PowerupType | null = null;

    if (cell.hasShip) {
      const ship = defender.ships.find(s => s.id === cell.hasShip);
      if (ship?.isShielded) {
        ship.isShielded = false;
        if (!isBotMove) showMessage("Kalkan Kırıldı!");
        if (!isBotMove) oyunSesiCal('miss.mp3');
      } else {
        cell.isHit = true;
        hit = true;
        const remaining = getShipRemainingParts(targetBoard, cell.hasShip);
        const shipDef = SHIPS.find(s => s.id === cell.hasShip);
        
        if (shipDef && remaining === shipDef.size - 1) {
          if (!isBotMove) {
            const sounds = ['guzelatıs.mp3', 'guzelatıs1.mp3', 'guzelatıs2.mp3'];
            const randomSound = sounds[Math.floor(Math.random() * sounds.length)];
            oyunSesiCal(randomSound);
          }
        } else if (remaining === 1) {
          if (!isBotMove) oyunSesiCal('hit.mp3');
        }

        if (remaining === 0) {
          if (!isBotMove) showMessage("Gemi Battı!");
          
          let remainingShips = 0;
          for (const s of defender.ships) {
            if (!isShipSunk(targetBoard, s.id)) {
              remainingShips++;
            }
          }

          if (remainingShips === 1) {
            if (!isBotMove) oyunSesiCal('songemi.mp3', true);
          } else {
            if (!isBotMove) oyunSesiCal('sink.mp3', true);
          }
        }
      }
    } else {
      cell.isMiss = true;
      if (!isBotMove) oyunSesiCal('miss.mp3');
      if (cell.hasPowerupBox) {
        cell.hasPowerupBox = false;
        const r = Math.random();
        if (r < 0.2) powerup = 'random_5';
        else if (r < 0.45) powerup = 'radar';
        else if (r < 0.65) powerup = 'bomb_3x3';
        else if (r < 0.7) powerup = 'bomb_5x5';
        else if (r < 0.85) powerup = 'heal';
        else powerup = 'shield';
        if (!isBotMove) showMessage("Güçlendirici Bulundu!");
      }
    }
    return { hit, powerup };
  };

  const handleCellClick = (boardOwner: 1 | 2, originalX: number, originalY: number, isBotMove: boolean = false) => {
    if (countdown !== null || animatingShots.length > 0) return; // Prevent interaction during countdown or animation

    if (activePlayer === boardOwner) {
      if (selectedPowerup === 'heal') {
        const player = activePlayer === 1 ? player1 : player2;
        const setPlayer = activePlayer === 1 ? setPlayer1 : setPlayer2;
        const newBoard = [...player.board.map(row => [...row])];
        if (newBoard[originalY][originalX].hasShip && newBoard[originalY][originalX].isHit) {
          newBoard[originalY][originalX].isHit = false;
          setPlayer({ ...player, board: newBoard, powerups: player.powerups.filter((_, i) => i !== player.powerups.indexOf('heal')) });
          if (!isBotMove) showMessage("Tamir Edildi!");
          switchTurn();
        }
      }
      return;
    }

    // Start animation
    if (!isBotMove) {
      oyunSesiCal('shoot.mp3', true);
    }
    setAnimatingShots([{ x: originalX, y: originalY, boardOwner, type: 'shoot' }]);

    setTimeout(() => {
      setAnimatingShots([]);
      
      const attacker = activePlayer === 1 ? player1 : player2;
      const defender = activePlayer === 1 ? player2 : player1;
      const setAttacker = activePlayer === 1 ? setPlayer1 : setPlayer2;
      const setDefender = activePlayer === 1 ? setPlayer2 : setPlayer1;
      
      const newDefBoard = [...defender.board.map(row => [...row])];
      let newAttackerPowerups = [...attacker.powerups];

      // Apply Storm Deviation
      let x = originalX;
      let y = originalY;
      if (weather === 'storm' && selectedPowerup !== 'bomb_3x3' && selectedPowerup !== 'bomb_5x5') {
        x = Math.max(0, Math.min(9, x + Math.floor(Math.random() * 3) - 1));
        y = Math.max(0, Math.min(9, y + Math.floor(Math.random() * 3) - 1));
      }

      // Check Mine Hit
      if (newDefBoard[y][x].hasMine && !newDefBoard[y][x].isHit && !newDefBoard[y][x].isMiss) {
        if (!isBotMove) {
          oyunSesiCal('mine.mp3', true);
          setScreenShake(true);
          setTimeout(() => setScreenShake(false), 500);
          showMessage("MAYINA BASTIN! Rakip 2 hamle yapacak.");
        }
        newDefBoard[y][x].isHit = true; // Mark mine as exploded
        setDefender({ ...defender, board: newDefBoard });
        switchTurn(true);
        return;
      }

      if (selectedPowerup === 'bomb_3x3' || selectedPowerup === 'bomb_5x5') {
        const size = selectedPowerup === 'bomb_3x3' ? 1 : 2;
        for (let dy = -size; dy <= size; dy++) {
          for (let dx = -size; dx <= size; dx++) {
            const ny = y + dy, nx = x + dx;
            if (ny >= 0 && ny < 10 && nx >= 0 && nx < 10) {
               processHit(newDefBoard, nx, ny, attacker, defender, isBotMove);
            }
          }
        }
        newAttackerPowerups.splice(newAttackerPowerups.indexOf(selectedPowerup), 1);
      } else {
        const { powerup } = processHit(newDefBoard, x, y, attacker, defender, isBotMove);
        if (powerup) newAttackerPowerups.push(powerup);
      }

      setDefender({ ...defender, board: newDefBoard });
      setAttacker({ ...attacker, powerups: newAttackerPowerups });

      if (checkWin(newDefBoard)) {
        if (!isBotMove) oyunSesiCal('win.mp3', true);
        onGameOver(activePlayer);
        return;
      }

      switchTurn();
    }, 400); // 400ms animation delay
  };

  const useInstantPowerup = (type: PowerupType) => {
    if (countdown !== null || animatingShots.length > 0) return;

    if (type === 'radar' && weather === 'fog') {
      showMessage("Siste radar kullanılamaz!");
      return;
    }

    const attacker = activePlayer === 1 ? player1 : player2;
    const defender = activePlayer === 1 ? player2 : player1;
    const setAttacker = activePlayer === 1 ? setPlayer1 : setPlayer2;
    const setDefender = activePlayer === 1 ? setPlayer2 : setPlayer1;

    let newAttackerPowerups = [...attacker.powerups];
    newAttackerPowerups.splice(newAttackerPowerups.indexOf(type), 1);

    if (type === 'random_5') {
      const newDefBoard = [...defender.board.map(row => [...row])];
      const targets: {x: number, y: number}[] = [];
      let attempts = 0;
      while (targets.length < 5 && attempts < 100) {
        const x = Math.floor(Math.random() * 10);
        const y = Math.floor(Math.random() * 10);
        if (!newDefBoard[y][x].isHit && !newDefBoard[y][x].isMiss && !newDefBoard[y][x].hasMine && !targets.find(t => t.x === x && t.y === y)) {
          targets.push({x, y});
        }
        attempts++;
      }
      
      oyunSesiCal('shoot.mp3', true);
      setAnimatingShots(targets.map(t => ({ ...t, boardOwner: activePlayer === 1 ? 2 : 1, type: 'shoot' })));
      
      setTimeout(() => {
        setAnimatingShots([]);
        for (const target of targets) {
          processHit(newDefBoard, target.x, target.y, attacker, defender, false);
        }
        setDefender({ ...defender, board: newDefBoard });
        setAttacker({ ...attacker, powerups: newAttackerPowerups });
        if (checkWin(newDefBoard)) {
          oyunSesiCal('win.mp3', true);
          onGameOver(activePlayer);
        }
      }, 500);
      return; // Return early to avoid setting state twice
    } else if (type === 'radar') {
      const newDefBoard = [...defender.board.map(row => [...row])];
      const unhitShipCells = [];
      for(let y=0; y<10; y++) {
        for(let x=0; x<10; x++) {
          if(newDefBoard[y][x].hasShip && !newDefBoard[y][x].isHit) unhitShipCells.push({x, y});
        }
      }
      if (unhitShipCells.length > 0) {
        const target = unhitShipCells[Math.floor(Math.random() * unhitShipCells.length)];
        oyunSesiCal('radar.mp3', true);
        setAnimatingShots([{ x: target.x, y: target.y, boardOwner: activePlayer === 1 ? 2 : 1, type: 'radar' }]);
        
        setTimeout(() => {
          setAnimatingShots([]);
          newDefBoard[target.y][target.x].isRevealed = true;
          setDefender({ ...defender, board: newDefBoard });
          setAttacker({ ...attacker, powerups: newAttackerPowerups });
        }, 500);
        return; // Return early
      }
    } else if (type === 'shield') {
      const newAttackerShips = [...attacker.ships];
      const unsunkShips = newAttackerShips.filter(s => !isShipSunk(attacker.board, s.id));
      if (unsunkShips.length > 0) {
        const target = unsunkShips[Math.floor(Math.random() * unsunkShips.length)];
        target.isShielded = true;
      }
    }

    setAttacker({ ...attacker, powerups: newAttackerPowerups });
  };

  const handlePowerupClick = (type: PowerupType) => {
    if (type === 'random_5' || type === 'radar' || type === 'shield') {
      useInstantPowerup(type);
    } else {
      setSelectedPowerup(selectedPowerup === type ? null : type);
    }
  };

  // Bot Logic
  useEffect(() => {
    if (countdown !== null) return;
    if (activePlayer === 2 && player2.isBot) {
      const makeBotMove = async () => {
        const validTargets: {x: number, y: number}[] = [];
        for(let y=0; y<10; y++) {
          for(let x=0; x<10; x++) {
            if(!player1.board[y][x].isHit && !player1.board[y][x].isMiss) validTargets.push({x, y});
          }
        }
        
        let target = validTargets[Math.floor(Math.random() * validTargets.length)];
        
        if (player2.difficulty === 'impossible') {
          try {
            const res = await fetch('/api/bot-move', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ board: player1.board, difficulty: player2.difficulty })
            });
            if (res.ok) {
              const move = await res.json();
              if (move.x !== undefined && move.y !== undefined && !player1.board[move.y][move.x].isHit && !player1.board[move.y][move.x].isMiss) {
                target = { x: move.x, y: move.y };
              }
            }
          } catch (e) {
            console.error("Gemini bot failed, falling back to random", e);
          }
        } else if (player2.difficulty === 'medium' || player2.difficulty === 'hard') {
          const hitCells: {x: number, y: number}[] = [];
          for(let y=0; y<10; y++) {
            for(let x=0; x<10; x++) {
              if(player1.board[y][x].isHit && player1.board[y][x].hasShip) {
                 const shipId = player1.board[y][x].hasShip!;
                 if (!isShipSunk(player1.board, shipId)) {
                   hitCells.push({x, y});
                 }
              }
            }
          }

          if (hitCells.length > 0) {
            let possibleTargets: {x: number, y: number}[] = [];
            
            if (player2.difficulty === 'hard' && hitCells.length > 1) {
              for (let i = 0; i < hitCells.length; i++) {
                for (let j = i + 1; j < hitCells.length; j++) {
                  const c1 = hitCells[i];
                  const c2 = hitCells[j];
                  if (c1.x === c2.x && Math.abs(c1.y - c2.y) === 1) {
                    const minY = Math.min(c1.y, c2.y);
                    const maxY = Math.max(c1.y, c2.y);
                    if (minY - 1 >= 0 && !player1.board[minY - 1][c1.x].isHit && !player1.board[minY - 1][c1.x].isMiss) possibleTargets.push({x: c1.x, y: minY - 1});
                    if (maxY + 1 < 10 && !player1.board[maxY + 1][c1.x].isHit && !player1.board[maxY + 1][c1.x].isMiss) possibleTargets.push({x: c1.x, y: maxY + 1});
                  } else if (c1.y === c2.y && Math.abs(c1.x - c2.x) === 1) {
                    const minX = Math.min(c1.x, c2.x);
                    const maxX = Math.max(c1.x, c2.x);
                    if (minX - 1 >= 0 && !player1.board[c1.y][minX - 1].isHit && !player1.board[c1.y][minX - 1].isMiss) possibleTargets.push({x: minX - 1, y: c1.y});
                    if (maxX + 1 < 10 && !player1.board[c1.y][maxX + 1].isHit && !player1.board[c1.y][maxX + 1].isMiss) possibleTargets.push({x: maxX + 1, y: c1.y});
                  }
                }
              }
            }

            if (possibleTargets.length === 0) {
              for (const hc of hitCells) {
                const neighbors = [
                  {x: hc.x+1, y: hc.y}, {x: hc.x-1, y: hc.y},
                  {x: hc.x, y: hc.y+1}, {x: hc.x, y: hc.y-1}
                ].filter(n => n.x>=0 && n.x<10 && n.y>=0 && n.y<10 && !player1.board[n.y][n.x].isHit && !player1.board[n.y][n.x].isMiss);
                possibleTargets.push(...neighbors);
              }
            }

            if (possibleTargets.length > 0) {
              target = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];
            } else if (player2.difficulty === 'hard') {
               const parityTargets = validTargets.filter(t => (t.x + t.y) % 2 === 0);
               if (parityTargets.length > 0) {
                 target = parityTargets[Math.floor(Math.random() * parityTargets.length)];
               }
            }
          } else if (player2.difficulty === 'hard') {
             const parityTargets = validTargets.filter(t => (t.x + t.y) % 2 === 0);
             if (parityTargets.length > 0) {
               target = parityTargets[Math.floor(Math.random() * parityTargets.length)];
             }
          }
        }

        if (target) {
          handleCellClick(1, target.x, target.y, true);
        }
      };

      const timer = setTimeout(makeBotMove, 1500);
      return () => clearTimeout(timer);
    }
  }, [activePlayer, countdown, turnCount]);

  // Timers
  useEffect(() => {
    if (countdown !== null) return;
    const interval = setInterval(() => {
      if (activePlayer === 1) {
        setPlayer1(p => p ? { ...p, timer: Math.max(0, p.timer - 1) } : null);
      } else {
        setPlayer2(p => p ? { ...p, timer: Math.max(0, p.timer - 1) } : null);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activePlayer, countdown]);

  useEffect(() => {
    if (player1?.timer === 0) onGameOver(2);
    if (player2?.timer === 0) onGameOver(1);
  }, [player1?.timer, player2?.timer, onGameOver]);

  const formatTime = (s: number) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2, '0')}`;

  const renderBoard = (owner: 1 | 2, player: PlayerState) => {
    const isOwnBoard = owner === activePlayer;
    const canSeeShips = mode === 'select_bot' && owner === 1;

    return (
      <div className="flex flex-col items-center w-full max-w-[40vh] sm:max-w-[45vh] lg:max-w-[50vh]">
        <div className="flex justify-between w-full px-4 mb-4">
          <span className="font-bold text-xl sm:text-2xl text-blue-600 truncate">{player.name}</span>
          <span className={`font-mono text-xl sm:text-2xl font-bold ${player.timer < 30 ? 'text-red-500 animate-pulse' : 'text-gray-700'}`}>{formatTime(player.timer)}</span>
        </div>
        <div className={`grid grid-cols-10 grid-rows-10 gap-0 border-4 bg-white rounded-xl overflow-hidden w-full aspect-square touch-none ${activePlayer !== owner ? 'border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.4)]' : 'border-gray-300 opacity-80'}`}>
          {player.board.map((row, y) => row.map((cell, x) => {
            let bg = 'bg-gray-50 hover:bg-gray-100 border border-gray-200';
            let content = null;
            const isSunk = cell.hasShip && isShipSunk(player.board, cell.hasShip);

            if (cell.isHit) {
              if (cell.hasMine) {
                bg = 'bg-red-200 border border-red-300';
                content = <div className="w-full h-full bg-orange-500" />;
              } else {
                bg = 'bg-red-200 border border-red-300';
                content = <div className="w-full h-full bg-red-500 animate-pulse shadow-inner" />;
              }
            } else if (cell.isMiss) {
              bg = 'bg-blue-50 border border-blue-100';
              content = <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-400 rounded-full" />;
            } else if (cell.isRevealed) {
              bg = 'bg-yellow-100 border border-yellow-200';
            } else if (cell.hasShip && canSeeShips) {
              const shipDef = SHIPS.find(s => s.id === cell.hasShip);
              bg = shipDef ? `${shipDef.color} border border-black/10` : 'bg-gray-500 border border-gray-600';
              const ship = player.ships.find(s => s.id === cell.hasShip);
              if (ship?.isShielded) content = <ShieldIcon className="text-white/80 w-1/2 h-1/2" />;
            } else if (cell.hasPowerupBox && !isOwnBoard) {
              content = <Gift className="text-yellow-500 animate-bounce drop-shadow-md w-3/4 h-3/4" />;
            } else if (cell.hasMine && canSeeShips) {
              bg = 'bg-orange-200 border border-orange-300';
            }

            if (isSunk) {
              content = <X strokeWidth={3} className="text-black/80 absolute z-10 drop-shadow-md w-full h-full p-1" />;
            }

            const animatingShot = animatingShots.find(s => s.x === x && s.y === y && s.boardOwner === owner);

            return (
              <div 
                key={`${x}-${y}`} 
                onClick={() => handleCellClick(owner, x, y)}
                className={`w-full h-full flex items-center justify-center cursor-pointer transition-colors relative overflow-hidden ${bg}`}
              >
                {content}
                {animatingShot && (
                  <motion.div
                    initial={{ scale: 3, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 flex items-center justify-center z-20"
                  >
                    <div className={`w-4 h-4 rounded-full ${animatingShot.type === 'radar' ? 'bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,1)]' : 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,1)]'}`}></div>
                  </motion.div>
                )}
              </div>
            );
          }))}
        </div>
      </div>
    );
  };

  const currentPlayer = activePlayer === 1 ? player1 : player2;

  return (
    <div className={`flex flex-col h-full w-full relative text-gray-900 ${screenShake ? 'animate-shake' : ''}`}>
      {/* Countdown Overlay */}
      <AnimatePresence>
        {countdown !== null && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 2 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm"
          >
            <h1 className="text-[15rem] font-black text-transparent bg-clip-text bg-gradient-to-b from-blue-500 to-indigo-700 drop-shadow-xl">
              {countdown === 0 ? 'BAŞLA!' : countdown}
            </h1>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Bar */}
      <div className="flex justify-between items-center p-4 sm:p-6 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="p-2 sm:p-3 bg-gray-100 rounded-xl border border-gray-200">
            {weather === 'normal' && <Sun className="text-yellow-500" size={24} />}
            {weather === 'storm' && <CloudLightning className="text-blue-600" size={24} />}
            {weather === 'fog' && <CloudFog className="text-gray-500" size={24} />}
          </div>
          <span className="text-sm sm:text-xl font-bold text-gray-600 uppercase tracking-widest hidden sm:block">
            {weather === 'normal' ? 'Sakin Deniz' : weather === 'storm' ? 'Fırtına' : 'Yoğun Sis'}
          </span>
        </div>
        
        <h2 className="text-2xl sm:text-4xl font-black tracking-wider">
          SIRA: <span className="text-blue-600">{currentPlayer.name.toUpperCase()}</span>
        </h2>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={onQuit}
            className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-xl transition-colors flex items-center gap-2"
          >
            <X size={20} />
            <span className="hidden sm:inline">Maçtan Çık</span>
          </button>
        </div>
      </div>

      {/* Message Overlay */}
      <AnimatePresence>
        {message && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: -50 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 1.2 }}
            className="absolute top-24 sm:top-32 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 sm:px-10 sm:py-4 rounded-full font-black text-xl sm:text-3xl z-40 shadow-2xl border border-blue-400 whitespace-nowrap"
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Boards */}
      <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 lg:gap-24 p-4 sm:p-8 overflow-y-auto">
        {renderBoard(1, player1)}
        {renderBoard(2, player2)}
      </div>

      {/* Bottom Bar: Powerups & Emojis */}
      <div className="flex flex-col sm:flex-row justify-between items-center sm:items-end p-4 sm:p-8 bg-white/80 backdrop-blur-md border-t border-gray-200 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] gap-4">
        {/* Powerups */}
        <div className="flex gap-2 sm:gap-4 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          {currentPlayer.powerups.map((p, i) => {
            const def = POWERUPS[p];
            const Icon = def.icon;
            const isSelected = selectedPowerup === p;
            const isDisabled = p === 'radar' && weather === 'fog';
            
            return (
              <button 
                key={i} 
                onClick={() => !isDisabled && handlePowerupClick(p)}
                className={`p-3 sm:p-4 rounded-2xl flex flex-col items-center justify-center transition-all border min-w-[70px] sm:min-w-[90px]
                  ${isDisabled ? 'opacity-30 cursor-not-allowed grayscale border-gray-300 bg-gray-100' : 
                    isSelected ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white scale-110 shadow-lg border-transparent' : 
                    'bg-white hover:bg-gray-50 text-gray-700 border-gray-200 shadow-sm'}`}
                title={def.desc}
              >
                <Icon size={24} className="mb-1 sm:mb-2" />
                <span className="text-xs sm:text-sm font-bold text-center leading-tight">{def.name}</span>
              </button>
            )
          })}
          {currentPlayer.powerups.length === 0 && (
            <div className="text-gray-400 italic text-sm sm:text-lg p-4 font-medium whitespace-nowrap">Güçlendirici yok</div>
          )}
        </div>

        {/* Emojis */}
        <div className="flex gap-2 sm:gap-3 bg-gray-100 p-2 sm:p-3 rounded-3xl border border-gray-200">
          {EMOJIS.map(e => (
            <button key={e} onClick={() => handleEmoji(e)} className="text-2xl sm:text-4xl hover:scale-125 transition-transform p-1 sm:p-2">
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Floating Emojis */}
      {activeEmojis.map(e => (
        <motion.div
          key={e.id}
          initial={{ opacity: 1, y: '100vh', x: `${e.x}vw`, scale: 0.5 }}
          animate={{ opacity: 0, y: '-10vh', scale: 2 }}
          transition={{ duration: 2.5, ease: 'easeOut' }}
          className="absolute text-5xl sm:text-7xl pointer-events-none z-50 drop-shadow-2xl"
        >
          {e.emoji}
        </motion.div>
      ))}
    </div>
  );
};

