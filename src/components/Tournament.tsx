import React, { useState, useEffect } from 'react';
import { GameMode, Student, TournamentMatch } from '../types';
import { getStudents } from '../utils';
import { ArrowLeft, Trophy, Play, Users } from 'lucide-react';

interface Props {
  setMode: (m: GameMode) => void;
  onStartMatch?: (p1: Student, p2: Student, matchId: number) => void;
  tournamentMatches?: TournamentMatch[];
  setTournamentMatches?: (matches: TournamentMatch[]) => void;
}

export const TournamentSetup = ({ setMode, setTournamentMatches }: Props) => {
  const students = getStudents();
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);

  const toggleStudent = (s: Student) => {
    if (selectedStudents.find(x => x.id === s.id)) {
      setSelectedStudents(selectedStudents.filter(x => x.id !== s.id));
    } else {
      if (selectedStudents.length < 16) {
        setSelectedStudents([...selectedStudents, s]);
      }
    }
  };

  const startTournament = () => {
    if (selectedStudents.length < 3 || selectedStudents.length > 16) return;
    
    // Shuffle
    const shuffled = [...selectedStudents].sort(() => Math.random() - 0.5);
    const matches: TournamentMatch[] = [];
    
    // Calculate bracket size (next power of 2)
    let bracketSize = 4;
    if (shuffled.length > 8) bracketSize = 16;
    else if (shuffled.length > 4) bracketSize = 8;

    const byes = bracketSize - shuffled.length;
    
    // Generate Round 1 matches
    let matchId = 1;
    let playerIndex = 0;
    const round1Matches = [];
    
    for (let i = 0; i < bracketSize / 2; i++) {
      let p1 = null;
      let p2 = null;
      
      if (playerIndex < shuffled.length) {
        p1 = shuffled[playerIndex++];
      }
      
      // If we have byes left, this player gets a bye (no p2)
      if (i >= (bracketSize / 2) - byes) {
         // Bye
      } else if (playerIndex < shuffled.length) {
        p2 = shuffled[playerIndex++];
      }

      const match: TournamentMatch = {
        id: matchId++,
        player1: p1,
        player2: p2,
        winner: p2 ? null : p1, // Auto-win if bye
        nextMatchId: null // Will set later
      };
      round1Matches.push(match);
      matches.push(match);
    }

    // Generate subsequent rounds
    let currentRoundMatches = round1Matches;
    while (currentRoundMatches.length > 1) {
      const nextRoundMatches = [];
      for (let i = 0; i < currentRoundMatches.length; i += 2) {
        const nextMatch: TournamentMatch = {
          id: matchId++,
          player1: currentRoundMatches[i].winner, // Might be null if previous match not played
          player2: currentRoundMatches[i+1]?.winner || null,
          winner: null,
          nextMatchId: null
        };
        
        currentRoundMatches[i].nextMatchId = nextMatch.id;
        if (currentRoundMatches[i+1]) {
          currentRoundMatches[i+1].nextMatchId = nextMatch.id;
        }
        
        nextRoundMatches.push(nextMatch);
        matches.push(nextMatch);
      }
      currentRoundMatches = nextRoundMatches;
    }
    
    if (setTournamentMatches) setTournamentMatches(matches);
    setMode('tournament_bracket');
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-gray-900">
      <div className="w-full max-w-4xl flex items-center mb-8">
        <button onClick={() => setMode('menu')} className="p-4 bg-white hover:bg-gray-100 rounded-full shadow-md transition-all border border-gray-200"><ArrowLeft size={32} className="text-gray-700" /></button>
        <h2 className="text-5xl font-bold ml-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Turnuva Kurulumu</h2>
      </div>
      
      <div className="bg-white p-8 rounded-3xl w-full max-w-4xl flex flex-col shadow-xl border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800">Öğrencileri Seçin (3-16 Kişi)</h3>
          <span className={`text-2xl font-black ${selectedStudents.length >= 3 && selectedStudents.length <= 16 ? 'text-green-600' : 'text-red-500'}`}>
            {selectedStudents.length} / 16
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-8 max-h-[40vh] overflow-y-auto p-2">
          {students.map(s => {
            const isSelected = selectedStudents.find(x => x.id === s.id);
            return (
              <button
                key={s.id}
                onClick={() => toggleStudent(s)}
                className={`p-4 rounded-2xl font-bold text-lg transition-all border ${isSelected ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-md scale-105' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
              >
                {s.name}
              </button>
            )
          })}
        </div>

        <button 
          onClick={startTournament}
          disabled={selectedStudents.length < 3 || selectedStudents.length > 16}
          className="p-6 bg-green-500 hover:bg-green-600 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl font-black text-3xl flex items-center justify-center shadow-lg transition-all"
        >
          <Trophy className="mr-4" size={32} /> TURNUVAYI BAŞLAT
        </button>
      </div>
    </div>
  );
};

export const TournamentBracket = ({ setMode, tournamentMatches = [], onStartMatch }: Props) => {
  const nextPlayableMatch = tournamentMatches.find(m => m.player1 && m.player2 && !m.winner);
  const finalMatch = tournamentMatches[tournamentMatches.length - 1];
  const isTournamentOver = finalMatch && finalMatch.winner;

  // Group matches by round for rendering
  const rounds: TournamentMatch[][] = [];
  let currentRoundIds = tournamentMatches.filter(m => !tournamentMatches.some(other => other.nextMatchId === m.id)).map(m => m.id);
  
  while (currentRoundIds.length > 0) {
    const roundMatches = tournamentMatches.filter(m => currentRoundIds.includes(m.id));
    rounds.push(roundMatches);
    currentRoundIds = [...new Set(roundMatches.map(m => m.nextMatchId).filter(id => id !== null) as number[])];
  }

  return (
    <div className="flex flex-col items-center h-full p-8 overflow-y-auto text-gray-900">
      <div className="w-full max-w-6xl flex items-center justify-between mb-8">
        <div className="flex items-center">
          <button onClick={() => setMode('menu')} className="p-4 bg-white hover:bg-gray-100 rounded-full shadow-md transition-all border border-gray-200"><ArrowLeft size={32} className="text-gray-700" /></button>
          <h2 className="text-5xl font-bold ml-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Eşleşme Tablosu</h2>
        </div>
        
        {isTournamentOver ? (
          <div className="flex items-center gap-4 bg-yellow-100 px-6 py-3 rounded-full border border-yellow-300 shadow-md">
            <Trophy className="text-yellow-500" size={32} />
            <span className="text-3xl font-black text-yellow-600">ŞAMPİYON: {finalMatch.winner?.name}</span>
          </div>
        ) : nextPlayableMatch ? (
          <button 
            onClick={() => onStartMatch && onStartMatch(nextPlayableMatch.player1!, nextPlayableMatch.player2!, nextPlayableMatch.id)}
            className="px-8 py-4 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-black text-2xl flex items-center shadow-lg transition-all animate-pulse"
          >
            <Play className="mr-3" /> SIRADAKİ MAÇI OYNA
          </button>
        ) : null}
      </div>

      <div className="flex-1 w-full max-w-6xl bg-white rounded-3xl p-8 shadow-xl border border-gray-200 flex items-center justify-center overflow-x-auto">
        <div className="flex gap-16 items-center min-w-max">
          {rounds.map((round, roundIndex) => (
            <React.Fragment key={roundIndex}>
              <div className="flex flex-col justify-around h-full" style={{ gap: `${Math.pow(2, roundIndex) * 2}rem` }}>
                {round.map(match => (
                  <MatchBox key={match.id} match={match} isFinal={roundIndex === rounds.length - 1} />
                ))}
              </div>
              {roundIndex < rounds.length - 1 && (
                <div className="w-12 h-px bg-gray-300"></div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

const MatchBox = ({ match, isFinal = false }: { match: TournamentMatch, isFinal?: boolean, key?: any }) => {
  return (
    <div className={`flex flex-col w-64 rounded-xl overflow-hidden border bg-white ${isFinal ? 'border-yellow-400 shadow-lg' : 'border-gray-200 shadow-sm'}`}>
      {isFinal && <div className="bg-yellow-400 text-yellow-900 text-center font-black py-1 text-sm">FİNAL</div>}
      <div className={`p-4 flex justify-between items-center border-b border-gray-100 ${match.winner?.id === match.player1?.id ? 'bg-green-50 text-green-800' : 'text-gray-700'}`}>
        <span className="font-bold truncate">{match.player1 ? match.player1.name : '---'}</span>
        {match.winner?.id === match.player1?.id && <Trophy size={16} className="text-yellow-500" />}
      </div>
      <div className={`p-4 flex justify-between items-center ${match.winner?.id === match.player2?.id ? 'bg-green-50 text-green-800' : 'text-gray-700'}`}>
        <span className="font-bold truncate">{match.player2 ? match.player2.name : '---'}</span>
        {match.winner?.id === match.player2?.id && <Trophy size={16} className="text-yellow-500" />}
      </div>
    </div>
  );
};
