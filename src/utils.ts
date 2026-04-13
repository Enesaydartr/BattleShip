import { Cell, ShipType, PlayerState, Student } from './types';

export const createEmptyBoard = (): Cell[][] => {
  return Array.from({ length: 10 }, (_, y) =>
    Array.from({ length: 10 }, (_, x) => ({
      x, y, hasShip: null, hasMine: false, isHit: false, isMiss: false, hasPowerupBox: false, isRevealed: false
    }))
  );
};

export const isShipSunk = (board: Cell[][], shipId: ShipType): boolean => {
  let shipCells = 0;
  let hitCells = 0;
  for(let y=0; y<10; y++) {
    for(let x=0; x<10; x++) {
      if(board[y][x].hasShip === shipId) {
        shipCells++;
        if(board[y][x].isHit) hitCells++;
      }
    }
  }
  return shipCells > 0 && shipCells === hitCells;
};

export const getShipRemainingParts = (board: Cell[][], shipId: ShipType): number => {
  let remaining = 0;
  for(let y=0; y<10; y++) {
    for(let x=0; x<10; x++) {
      if(board[y][x].hasShip === shipId && !board[y][x].isHit) {
        remaining++;
      }
    }
  }
  return remaining;
};

export const checkWin = (board: Cell[][]): boolean => {
  let hasShip = false;
  for(let y=0; y<10; y++) {
    for(let x=0; x<10; x++) {
      if(board[y][x].hasShip) {
        hasShip = true;
        if(!board[y][x].isHit) return false;
      }
    }
  }
  return hasShip;
};

export const getStudents = (): Student[] => JSON.parse(localStorage.getItem('battleship_students') || '[]');
export const saveStudents = (s: Student[]) => localStorage.setItem('battleship_students', JSON.stringify(s));

export const updateStudentStats = (id: string, updates: Partial<Student>) => {
  const students = getStudents();
  const index = students.findIndex(s => s.id === id);
  if (index !== -1) {
    students[index] = { ...students[index], ...updates };
    saveStudents(students);
  }
};

export const recordDailyWin = (name: string) => {
  const today = new Date().toDateString();
  const stats = JSON.parse(localStorage.getItem('daily_stats') || '{}');
  if (stats.date !== today) {
    stats.date = today;
    stats.wins = {};
  }
  stats.wins[name] = (stats.wins[name] || 0) + 1;
  localStorage.setItem('daily_stats', JSON.stringify(stats));
};

export const getCaptainOfTheDay = (): string | null => {
  const today = new Date().toDateString();
  const stats = JSON.parse(localStorage.getItem('daily_stats') || '{}');
  if (stats.date !== today || !stats.wins) return null;
  
  let best = null;
  let maxWins = 0;
  for (const [name, wins] of Object.entries(stats.wins)) {
    if ((wins as number) > maxWins) { 
      maxWins = wins as number; 
      best = name; 
    }
  }
  return best;
};
