import React, { useState } from 'react';
import { GameMode, PlayerState, Student, PlacedShip, Cell, PlacedMine, TournamentMatch } from './types';
import { createEmptyBoard, updateStudentStats, recordDailyWin } from './utils';
import { oyunSesiCal } from './audio';
import { MainMenu, ClassManager, PlayerSelect, Leaderboard } from './components/MenuComponents';
import { TournamentSetup, TournamentBracket } from './components/Tournament';
import { ShipPlacement } from './components/ShipPlacement';
import { Game } from './components/Game';
import { SHIPS } from './constants';
import { Trophy, Ship } from 'lucide-react';
import { motion } from 'motion/react';

const Background = () => {
  const ships = React.useMemo(() => {
    return [...Array(5)].map((_, i) => ({
      id: i,
      y: `${20 + i * 15}vh`,
      duration: 20 + Math.random() * 20,
      delay: Math.random() * 10,
      size: 100 + Math.random() * 100
    }));
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-10">
      {ships.map((ship) => (
        <motion.div
          key={ship.id}
          className="absolute"
          initial={{ x: '-10vw', y: ship.y }}
          animate={{ x: '110vw' }}
          transition={{
            duration: ship.duration,
            repeat: Infinity,
            ease: 'linear',
            delay: ship.delay
          }}
        >
          <Ship size={ship.size} className="text-blue-900" />
        </motion.div>
      ))}
    </div>
  );
};

export default function App() {
  const [theme, setTheme] = useState<'default' | 'bw'>(localStorage.getItem('theme') as any || 'default');
  const [mode, setMode] = useState<GameMode>('menu');
  const [player1, setPlayer1] = useState<PlayerState | null>(null);
  const [player2, setPlayer2] = useState<PlayerState | null>(null);
  const [activePlayer, setActivePlayer] = useState<1 | 2>(1);
  const [winner, setWinner] = useState<1 | 2 | null>(null);
  
  // Tournament State
  const [tournamentMatches, setTournamentMatches] = useState<TournamentMatch[]>([]);
  const [currentMatchId, setCurrentMatchId] = useState<number | null>(null);

  const handleStartSetup = (p1: Student, p2: Student | null, diff?: 'easy'|'medium'|'hard'|'impossible', matchId?: number) => {
    setPlayer1({
      id: p1.id, name: p1.name, isBot: false, board: createEmptyBoard(), ships: [], mines: [], powerups: [], timer: 180
    });
    
    if (p2) {
      setPlayer2({
        id: p2.id, name: p2.name, isBot: false, board: createEmptyBoard(), ships: [], mines: [], powerups: [], timer: 180
      });
    } else {
      setPlayer2({
        id: 'bot', name: 'Bot (' + diff + ')', isBot: true, difficulty: diff, board: createEmptyBoard(), ships: [], mines: [], powerups: [], timer: 180
      });
    }
    
    if (matchId) setCurrentMatchId(matchId);
    setMode('placement');
    setActivePlayer(1);
  };

  const applyShipsAndMinesToBoard = (board: Cell[][], ships: PlacedShip[], mines: PlacedMine[]) => {
    const newBoard = [...board.map(row => [...row])];
    for (const ps of ships) {
      const def = SHIPS.find(s => s.id === ps.id)!;
      for (let i = 0; i < def.size; i++) {
        const cx = ps.vertical ? ps.x : ps.x + i;
        const cy = ps.vertical ? ps.y + i : ps.y;
        newBoard[cy][cx].hasShip = ps.id;
      }
    }
    for (const pm of mines) {
      newBoard[pm.y][pm.x].hasMine = true;
    }
    return newBoard;
  };

  const generateBotPlacement = (): { ships: PlacedShip[], mines: PlacedMine[] } => {
    const ships: PlacedShip[] = [];
    const mines: PlacedMine[] = [];
    const board = createEmptyBoard();
    
    for (const def of SHIPS) {
      let placed = false;
      while (!placed) {
        const vertical = Math.random() > 0.5;
        const x = Math.floor(Math.random() * (vertical ? 10 : 10 - def.size + 1));
        const y = Math.floor(Math.random() * (vertical ? 10 - def.size + 1 : 10));
        
        let overlap = false;
        for (let i = 0; i < def.size; i++) {
          const cx = vertical ? x : x + i;
          const cy = vertical ? y + i : y;
          if (board[cy][cx].hasShip) overlap = true;
        }
        
        if (!overlap) {
          for (let i = 0; i < def.size; i++) {
            const cx = vertical ? x : x + i;
            const cy = vertical ? y + i : y;
            board[cy][cx].hasShip = def.id;
          }
          ships.push({ id: def.id, x, y, vertical, isShielded: false });
          placed = true;
        }
      }
    }

    while(mines.length < 2) {
      const x = Math.floor(Math.random() * 10);
      const y = Math.floor(Math.random() * 10);
      if (!board[y][x].hasShip && !board[y][x].hasMine) {
        board[y][x].hasMine = true;
        mines.push({x, y});
      }
    }

    return { ships, mines };
  };

  const handlePlacementReady = (ships: PlacedShip[], mines: PlacedMine[]) => {
    if (activePlayer === 1) {
      const newBoard = applyShipsAndMinesToBoard(player1!.board, ships, mines);
      setPlayer1({ ...player1!, board: newBoard, ships, mines });
      
      if (player2!.isBot) {
        const botPlacement = generateBotPlacement();
        const botBoard = applyShipsAndMinesToBoard(player2!.board, botPlacement.ships, botPlacement.mines);
        setPlayer2({ ...player2!, board: botBoard, ships: botPlacement.ships, mines: botPlacement.mines });
        setMode('playing');
        setActivePlayer(1);
      } else {
        setActivePlayer(2);
      }
    } else {
      const newBoard = applyShipsAndMinesToBoard(player2!.board, ships, mines);
      setPlayer2({ ...player2!, board: newBoard, ships, mines });
      setMode('playing');
      setActivePlayer(1);
    }
  };

  const handleGameOver = (winnerId: 1 | 2) => {
    setWinner(winnerId);
    
    const p1 = player1!;
    const p2 = player2!;
    
    if (!p1.isBot) {
      updateStudentStats(p1.id, {
        wins: winnerId === 1 ? 1 : 0,
        losses: winnerId === 2 ? 1 : 0,
      });
      if (winnerId === 1) recordDailyWin(p1.name);
    }
    if (!p2.isBot) {
      updateStudentStats(p2.id, {
        wins: winnerId === 2 ? 1 : 0,
        losses: winnerId === 1 ? 1 : 0,
      });
      if (winnerId === 2) recordDailyWin(p2.name);
    }

    if (currentMatchId) {
      // Tournament logic
      const updatedMatches = [...tournamentMatches];
      const currentMatch = updatedMatches.find(m => m.id === currentMatchId)!;
      const winningStudent = winnerId === 1 ? { id: p1.id, name: p1.name } as Student : { id: p2.id, name: p2.name } as Student;
      currentMatch.winner = winningStudent;

      if (currentMatch.nextMatchId) {
        const nextMatch = updatedMatches.find(m => m.id === currentMatch.nextMatchId)!;
        if (!nextMatch.player1) nextMatch.player1 = winningStudent;
        else nextMatch.player2 = winningStudent;
      }
      
      setTournamentMatches(updatedMatches);
      setCurrentMatchId(null);
      setMode('tournament_bracket');
    } else {
      setMode('game_over');
    }
  };

  return (
    <div className={`w-screen h-screen overflow-hidden font-sans select-none transition-colors duration-500 relative ${theme === 'bw' ? 'bg-gray-100 text-gray-900 grayscale' : 'bg-gray-100 text-gray-900'}`}>
      <Background />
      <div className="absolute inset-0 z-10 pointer-events-none"></div>
      <div className="relative z-20 h-full w-full">
        {mode === 'menu' && <MainMenu setMode={setMode} theme={theme} setTheme={setTheme} />}
        {mode === 'class' && <ClassManager setMode={setMode} />}
        {mode === 'leaderboard' && <Leaderboard setMode={setMode} />}
        
        {mode === 'tournament_setup' && <TournamentSetup setMode={setMode} tournamentMatches={tournamentMatches} setTournamentMatches={setTournamentMatches} />}
        {mode === 'tournament_bracket' && <TournamentBracket setMode={setMode} tournamentMatches={tournamentMatches} onStartMatch={(p1, p2, id) => handleStartSetup(p1, p2, undefined, id)} />}

        {(mode === 'select_friend' || mode === 'select_bot') && <PlayerSelect setMode={setMode} mode={mode} onStart={handleStartSetup} />}
        
        {mode === 'placement' && (
          <ShipPlacement 
            key={activePlayer}
            player={activePlayer === 1 ? player1! : player2!} 
            onReady={handlePlacementReady} 
          />
        )}
        
        {mode === 'playing' && player1 && player2 && (
          <Game 
            player1={player1} 
            player2={player2} 
            setPlayer1={setPlayer1} 
            setPlayer2={setPlayer2} 
            activePlayer={activePlayer} 
            setActivePlayer={setActivePlayer}
            onGameOver={handleGameOver}
            onQuit={() => {
              if (currentMatchId) {
                setMode('tournament_bracket');
              } else {
                setMode('menu');
              }
            }}
            mode={player2.isBot ? 'select_bot' : 'select_friend'}
          />
        )}

        {mode === 'game_over' && (
          <div className="flex flex-col items-center justify-center h-full relative bg-white">
            <div className="absolute inset-0 bg-blue-50 animate-pulse mix-blend-overlay"></div>
            <Trophy size={120} className="text-yellow-500 mb-8 drop-shadow-md z-10" />
            <h1 className="text-6xl sm:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-600 mb-12 text-center z-10">
              {winner === 1 ? player1?.name : player2?.name}<br/>KAZANDI!
            </h1>
            <button 
              onClick={() => setMode('menu')}
              className="px-12 py-6 bg-blue-600 hover:bg-blue-700 text-white rounded-3xl font-black text-3xl shadow-xl transition-all z-10 hover:scale-105"
            >
              Ana Menüye Dön
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
