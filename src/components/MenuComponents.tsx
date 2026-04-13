import React, { useState, useEffect } from 'react';
import { GameMode, Student } from '../types';
import { getStudents, saveStudents, getCaptainOfTheDay } from '../utils';
import { toggleAudio, isAudioEnabled, oyunSesiCal } from '../audio';
import { Users, UserPlus, Trophy, Bot, ArrowLeft, Trash2, Swords, Volume2, VolumeX, Crown, Settings, Palette, Medal, Globe } from 'lucide-react';

export const MainMenu = ({ setMode, theme, setTheme }: { setMode: (m: GameMode) => void, theme: 'default' | 'bw', setTheme: (t: 'default' | 'bw') => void }) => {
  const [audioOn, setAudioOn] = useState(isAudioEnabled());
  const [showSettings, setShowSettings] = useState(false);
  const captain = getCaptainOfTheDay();

  const handleToggleAudio = () => {
    setAudioOn(toggleAudio());
  };

  const handleThemeChange = (newTheme: 'default' | 'bw') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-8 relative text-gray-900">
      <div className="absolute top-8 right-8 flex gap-4">
        <button onClick={() => setShowSettings(true)} className="p-4 bg-white/80 backdrop-blur-md shadow-lg border border-gray-200 rounded-full hover:bg-gray-100 transition-all">
          <Settings size={32} />
        </button>
      </div>

      {showSettings && (
        <div className="absolute inset-0 bg-black/40 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white p-10 rounded-3xl w-full max-w-md flex flex-col gap-8 relative shadow-2xl">
            <button onClick={() => setShowSettings(false)} className="absolute top-4 right-4 p-2 hover:bg-gray-200 rounded-full">
              <ArrowLeft size={24} className="rotate-180" />
            </button>
            <h2 className="text-4xl font-bold text-center mb-4">Ayarlar</h2>
            
            <div className="flex items-center justify-between p-4 bg-gray-100 rounded-2xl border border-gray-200">
              <div className="flex items-center gap-4 text-2xl font-bold">
                {audioOn ? <Volume2 size={32} className="text-blue-600" /> : <VolumeX size={32} className="text-red-500" />}
                Oyun Sesleri
              </div>
              <button onClick={handleToggleAudio} className={`w-16 h-8 rounded-full transition-all relative ${audioOn ? 'bg-green-500' : 'bg-red-500'}`}>
                <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-all ${audioOn ? 'left-9' : 'left-1'}`} />
              </button>
            </div>

            <div className="flex flex-col gap-4 p-4 bg-gray-100 rounded-2xl border border-gray-200">
              <div className="flex items-center gap-4 text-2xl font-bold mb-2">
                <Palette size={32} className="text-purple-600" />
                Tema Seçimi
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => handleThemeChange('default')}
                  className={`p-4 rounded-xl font-bold transition-all ${theme === 'default' ? 'bg-blue-600 text-white shadow-md' : 'bg-white hover:bg-gray-50 border border-gray-200'}`}
                >
                  Renkli
                </button>
                <button 
                  onClick={() => handleThemeChange('bw')}
                  className={`p-4 rounded-xl font-bold transition-all ${theme === 'bw' ? 'bg-gray-800 text-white shadow-md' : 'bg-white hover:bg-gray-50 border border-gray-200'}`}
                >
                  Siyah Beyaz
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <h1 className="text-6xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-800 mb-4 drop-shadow-sm tracking-wider text-center">
        BATTLE SHIP
      </h1>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full max-w-5xl px-4">
        <button onClick={() => setMode('select_friend')} className="group flex flex-col items-center justify-center p-6 sm:p-10 bg-white/80 backdrop-blur-md border border-gray-200 hover:bg-blue-50 rounded-3xl shadow-lg transition-all hover:scale-105">
          <Users size={56} className="mb-4 text-blue-600 transition-colors" />
          <span className="text-xl sm:text-2xl font-bold tracking-wide text-center">Arkadaşınla Kapış</span>
        </button>
        <button onClick={() => setMode('select_bot')} className="group flex flex-col items-center justify-center p-6 sm:p-10 bg-white/80 backdrop-blur-md border border-gray-200 hover:bg-purple-50 rounded-3xl shadow-lg transition-all hover:scale-105">
          <Bot size={56} className="mb-4 text-purple-600 transition-colors" />
          <span className="text-xl sm:text-2xl font-bold tracking-wide text-center">Botla Savaş</span>
        </button>
        <button onClick={() => setMode('tournament_setup')} className="group flex flex-col items-center justify-center p-6 sm:p-10 bg-white/80 backdrop-blur-md border border-gray-200 hover:bg-orange-50 rounded-3xl shadow-lg transition-all hover:scale-105">
          <Trophy size={56} className="mb-4 text-orange-500 transition-colors" />
          <span className="text-xl sm:text-2xl font-bold tracking-wide text-center">Turnuva Modu</span>
        </button>
        <button onClick={() => setMode('leaderboard')} className="group flex flex-col items-center justify-center p-6 sm:p-10 bg-white/80 backdrop-blur-md border border-gray-200 hover:bg-yellow-50 rounded-3xl shadow-lg transition-all hover:scale-105">
          <Medal size={56} className="mb-4 text-yellow-500 transition-colors" />
          <span className="text-xl sm:text-2xl font-bold tracking-wide text-center">Liderlik Tablosu</span>
        </button>
        <button onClick={() => setMode('class')} className="group flex flex-col items-center justify-center p-6 sm:p-10 bg-white/80 backdrop-blur-md border border-gray-200 hover:bg-green-50 rounded-3xl shadow-lg transition-all hover:scale-105">
          <UserPlus size={56} className="mb-4 text-green-600 transition-colors" />
          <span className="text-xl sm:text-2xl font-bold tracking-wide text-center">Sınıf Düzenle</span>
        </button>
        <button disabled className="group flex flex-col items-center justify-center p-6 sm:p-10 bg-gray-100/80 backdrop-blur-md border border-gray-300 rounded-3xl shadow-inner transition-all opacity-80 cursor-not-allowed relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full bg-red-500 text-white text-xs font-bold py-1 text-center uppercase tracking-widest z-10">Yapımda</div>
          <Globe size={56} className="mb-4 text-gray-400 transition-colors mt-2" />
          <span className="text-xl sm:text-2xl font-bold tracking-wide text-center text-gray-500 mb-2">Online Mod</span>
          <span className="text-xs text-gray-400 text-center leading-tight px-2">Bu modla beraber rank sistemi, market sistemi ve daha birçok özellik eklenecektir.</span>
        </button>
      </div>

      <div className="absolute bottom-4 text-gray-500 font-medium text-sm">
        Yapımcı: EnesAydar
      </div>
    </div>
  );
};

export const Leaderboard = ({ setMode }: { setMode: (m: GameMode) => void }) => {
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    const sorted = getStudents().sort((a, b) => b.wins - a.wins);
    setStudents(sorted);
  }, []);

  return (
    <div className="flex flex-col items-center h-full p-8 text-gray-900">
      <div className="w-full max-w-4xl flex items-center mb-12">
        <button onClick={() => setMode('menu')} className="p-4 bg-white shadow-md rounded-full hover:bg-gray-100 transition-all"><ArrowLeft size={32} /></button>
        <h2 className="text-5xl font-bold ml-6 text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-600">Liderlik Tablosu</h2>
      </div>
      
      <div className="w-full max-w-4xl flex-1 overflow-y-auto bg-white rounded-3xl p-8 shadow-xl border border-gray-200 space-y-4">
        {students.map((s, index) => (
          <div key={s.id} className="flex justify-between items-center bg-gray-50 hover:bg-gray-100 p-6 rounded-2xl transition-all border border-gray-200">
            <div className="flex items-center gap-6">
              <span className={`text-3xl font-black ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-amber-700' : 'text-gray-900'}`}>
                #{index + 1}
              </span>
              <span className="text-2xl font-bold">{s.name}</span>
            </div>
            <div className="flex gap-8 text-xl font-semibold">
              <span className="text-green-600">{s.wins} Galibiyet</span>
              <span className="text-red-500">{s.losses} Mağlubiyet</span>
            </div>
          </div>
        ))}
        {students.length === 0 && <p className="text-center text-gray-500 text-2xl mt-12">Henüz öğrenci eklenmedi.</p>}
      </div>
    </div>
  );
};

export const ClassManager = ({ setMode }: { setMode: (m: GameMode) => void }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [name, setName] = useState('');

  useEffect(() => {
    setStudents(getStudents());
  }, []);

  const addStudent = () => {
    if (!name.trim()) return;
    const newStudent: Student = {
      id: Date.now().toString(),
      name: name.trim(),
      wins: 0, losses: 0, shipsDestroyed: 0, powerupsUsed: 0
    };
    const updated = [...students, newStudent];
    setStudents(updated);
    saveStudents(updated);
    setName('');
  };

  const removeStudent = (id: string) => {
    const updated = students.filter(s => s.id !== id);
    setStudents(updated);
    saveStudents(updated);
  };

  return (
    <div className="flex flex-col items-center h-full p-8 text-gray-900">
      <div className="w-full max-w-4xl flex items-center mb-12">
        <button onClick={() => setMode('menu')} className="p-4 bg-white shadow-md rounded-full hover:bg-gray-100 transition-all"><ArrowLeft size={32} /></button>
        <h2 className="text-5xl font-bold ml-6 text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-600">Sınıf Düzenle</h2>
      </div>
      <div className="flex w-full max-w-4xl mb-8 shadow-lg rounded-2xl">
        <input 
          type="text" 
          value={name} 
          onChange={e => setName(e.target.value)} 
          placeholder="Öğrenci Adı" 
          className="flex-1 p-6 rounded-l-2xl bg-white text-gray-900 placeholder-gray-400 text-2xl outline-none border border-gray-200 border-r-0 focus:bg-gray-50 transition-all"
          onKeyDown={e => e.key === 'Enter' && addStudent()}
        />
        <button onClick={addStudent} className="px-12 bg-green-600 hover:bg-green-500 text-white rounded-r-2xl font-bold text-2xl transition-all">Ekle</button>
      </div>
      <div className="w-full max-w-4xl flex-1 overflow-y-auto bg-white rounded-3xl p-6 shadow-xl border border-gray-200 space-y-4">
        {students.map(s => (
          <div key={s.id} className="flex justify-between items-center bg-gray-50 hover:bg-gray-100 p-6 rounded-2xl transition-all border border-gray-200">
            <span className="text-2xl font-semibold">{s.name}</span>
            <button onClick={() => removeStudent(s.id)} className="p-3 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={28} /></button>
          </div>
        ))}
        {students.length === 0 && <p className="text-center text-gray-500 text-2xl mt-12">Henüz öğrenci eklenmedi.</p>}
      </div>
    </div>
  );
};

export const PlayerSelect = ({ setMode, mode, onStart }: { setMode: (m: GameMode) => void, mode: 'select_friend' | 'select_bot', onStart: (p1: Student, p2: Student | null, diff?: 'easy'|'medium'|'hard'|'impossible') => void }) => {
  const students = getStudents();
  const [p1, setP1] = useState<string>('');
  const [p2, setP2] = useState<string>('');
  const [diff, setDiff] = useState<'easy'|'medium'|'hard'|'impossible'>('medium');

  const handleStart = () => {
    // Removed oyunSesiCal('start.mp3') from here. It will play in Game.tsx after countdown.
    if (mode === 'select_friend') {
      const student1 = students.find(s => s.id === p1);
      const student2 = students.find(s => s.id === p2);
      if (!student1 || !student2 || p1 === p2) return;
      onStart(student1, student2);
    } else {
      const defaultPlayer: Student = { id: 'player', name: 'Kaptan', wins: 0, losses: 0, shipsDestroyed: 0, powerupsUsed: 0 };
      onStart(defaultPlayer, null, diff);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-gray-900">
      <div className="w-full max-w-3xl flex items-center mb-12">
        <button onClick={() => setMode('menu')} className="p-4 bg-white shadow-md rounded-full hover:bg-gray-100 transition-all"><ArrowLeft size={32} /></button>
        <h2 className="text-5xl font-bold ml-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
          {mode === 'select_friend' ? 'Kaptanları Seç' : 'Zorluk Seçimi'}
        </h2>
      </div>
      
      <div className="bg-white p-10 rounded-3xl w-full max-w-3xl flex flex-col gap-8 shadow-2xl border border-gray-200">
        {mode === 'select_friend' ? (
          <>
            <div>
              <label className="block text-2xl font-bold mb-4 text-blue-600">1. Kaptan</label>
              <select value={p1} onChange={e => setP1(e.target.value)} className="w-full p-6 rounded-2xl bg-gray-50 text-gray-900 text-2xl outline-none border border-gray-300 focus:border-blue-500 transition-colors">
                <option value="">Öğrenci Seçin</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-2xl font-bold mb-4 text-purple-600">2. Kaptan</label>
              <select value={p2} onChange={e => setP2(e.target.value)} className="w-full p-6 rounded-2xl bg-gray-50 text-gray-900 text-2xl outline-none border border-gray-300 focus:border-purple-500 transition-colors">
                <option value="">Öğrenci Seçin</option>
                {students.filter(s => s.id !== p1).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </>
        ) : (
          <div>
            <label className="block text-3xl font-bold mb-6 text-center">Botun Zekası</label>
            <div className="grid grid-cols-2 gap-4">
              {(['easy', 'medium', 'hard', 'impossible'] as const).map(d => (
                <button 
                  key={d} 
                  onClick={() => setDiff(d)} 
                  className={`p-6 rounded-2xl font-bold text-2xl capitalize transition-all border ${diff === d ? 'bg-blue-600 text-white shadow-lg border-blue-600 scale-105' : 'bg-gray-50 hover:bg-gray-100 border-gray-300 text-gray-700'}`}
                >
                  {d === 'easy' ? 'Kolay' : d === 'medium' ? 'Orta' : d === 'hard' ? 'Zor' : 'İmkansız'}
                </button>
              ))}
            </div>
          </div>
        )}

        <button 
          onClick={handleStart} 
          disabled={mode === 'select_friend' && (!p1 || !p2)}
          className="mt-8 p-6 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl font-black text-3xl flex items-center justify-center shadow-xl transition-all"
        >
          <Swords className="mr-4" size={40} /> SAVAŞA BAŞLA
        </button>
      </div>
    </div>
  );
};
