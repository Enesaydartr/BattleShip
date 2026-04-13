import React, { useState } from 'react';
import { PlayerState, PlacedShip, ShipDef, PlacedMine } from '../types';
import { SHIPS } from '../constants';
import { RotateCw, Check, Bomb, MousePointerClick } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  player: PlayerState;
  onReady: (ships: PlacedShip[], mines: PlacedMine[]) => void;
  key?: any;
}

export const ShipPlacement = ({ player, onReady }: Props) => {
  const [placedShips, setPlacedShips] = useState<PlacedShip[]>([]);
  const [placedMines, setPlacedMines] = useState<PlacedMine[]>([]);
  const [selectedShip, setSelectedShip] = useState<ShipDef | null>(null);
  const [isVertical, setIsVertical] = useState(false);
  const [hoverCell, setHoverCell] = useState<{x: number, y: number} | null>(null);

  const unplacedShips = SHIPS.filter(s => !placedShips.find(ps => ps.id === s.id));
  const minesLeft = 2 - placedMines.length;

  const checkOverlap = (x: number, y: number, size: number, vertical: boolean, ignoreShipId?: string) => {
    if (vertical && y + size > 10) return true;
    if (!vertical && x + size > 10) return true;

    for (let i = 0; i < size; i++) {
      const cx = vertical ? x : x + i;
      const cy = vertical ? y + i : y;
      
      for (const ps of placedShips) {
        if (ps.id === ignoreShipId) continue;
        const def = SHIPS.find(s => s.id === ps.id)!;
        if (ps.vertical) {
          if (cx === ps.x && cy >= ps.y && cy < ps.y + def.size) return true;
        } else {
          if (cy === ps.y && cx >= ps.x && cx < ps.x + def.size) return true;
        }
      }
      for (const pm of placedMines) {
        if (cx === pm.x && cy === pm.y) return true;
      }
    }
    return false;
  };

  const handleCellClick = (x: number, y: number) => {
    // If we have a selected ship to place
    if (selectedShip) {
      if (!checkOverlap(x, y, selectedShip.size, isVertical)) {
        setPlacedShips([...placedShips, { id: selectedShip.id, x, y, vertical: isVertical, isShielded: false }]);
        setSelectedShip(null);
        setHoverCell(null);
      }
      return;
    }

    // If clicking a placed ship, pick it up (removes from board and selects it)
    const clickedShip = placedShips.find(ps => {
      const def = SHIPS.find(s => s.id === ps.id)!;
      if (ps.vertical) {
        return x === ps.x && y >= ps.y && y < ps.y + def.size;
      } else {
        return y === ps.y && x >= ps.x && x < ps.x + def.size;
      }
    });

    if (clickedShip) {
      setPlacedShips(prev => prev.filter(ps => ps.id !== clickedShip.id));
      const def = SHIPS.find(s => s.id === clickedShip.id)!;
      setSelectedShip(def);
      setIsVertical(clickedShip.vertical);
      return;
    }

    // If clicking a mine, remove it
    const clickedMineIndex = placedMines.findIndex(pm => pm.x === x && pm.y === y);
    if (clickedMineIndex !== -1) {
      setPlacedMines(prev => prev.filter((_, i) => i !== clickedMineIndex));
      return;
    }

    // Place mine if all ships are placed and we have mines left
    if (unplacedShips.length === 0 && minesLeft > 0) {
      setPlacedMines([...placedMines, { x, y }]);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, x: number, y: number) => {
    e.preventDefault();
    const clickedShip = placedShips.find(ps => {
      const def = SHIPS.find(s => s.id === ps.id)!;
      if (ps.vertical) {
        return x === ps.x && y >= ps.y && y < ps.y + def.size;
      } else {
        return y === ps.y && x >= ps.x && x < ps.x + def.size;
      }
    });

    if (clickedShip) {
      setPlacedShips(prev => prev.filter(ps => ps.id !== clickedShip.id));
    }
  };

  const renderGrid = () => {
    const cells = [];
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        let isShip = false;
        let shipColor = '';
        
        // Check placed ships
        for (const ps of placedShips) {
          const def = SHIPS.find(s => s.id === ps.id)!;
          if (ps.vertical) {
            if (x === ps.x && y >= ps.y && y < ps.y + def.size) { isShip = true; shipColor = def.color; }
          } else {
            if (y === ps.y && x >= ps.x && x < ps.x + def.size) { isShip = true; shipColor = def.color; }
          }
        }

        // Check hover preview
        let isHoverPreview = false;
        let hoverValid = true;
        if (selectedShip && hoverCell) {
          if (isVertical) {
            if (x === hoverCell.x && y >= hoverCell.y && y < hoverCell.y + selectedShip.size) {
              isHoverPreview = true;
            }
          } else {
            if (y === hoverCell.y && x >= hoverCell.x && x < hoverCell.x + selectedShip.size) {
              isHoverPreview = true;
            }
          }
          if (isHoverPreview) {
            hoverValid = !checkOverlap(hoverCell.x, hoverCell.y, selectedShip.size, isVertical);
            shipColor = hoverValid ? selectedShip.color : 'bg-red-500';
          }
        }

        const isMine = placedMines.some(pm => pm.x === x && pm.y === y);

        cells.push(
          <div 
            key={`${x}-${y}`} 
            data-x={x}
            data-y={y}
            onClick={() => handleCellClick(x, y)}
            onContextMenu={(e) => handleContextMenu(e, x, y)}
            onMouseEnter={() => setHoverCell({x, y})}
            onMouseLeave={() => setHoverCell(null)}
            className={`w-full h-full border border-gray-200 cursor-pointer transition-colors flex items-center justify-center overflow-hidden
              ${isHoverPreview ? (hoverValid ? `${shipColor} opacity-70` : 'bg-red-500 opacity-70') : 
                isShip ? shipColor : 
                isMine ? 'bg-red-200' : 'bg-gray-50 hover:bg-gray-100'}`}
          >
            {isMine && <Bomb className="text-red-500 w-3/4 h-3/4" />}
          </div>
        );
      }
    }
    return cells;
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 sm:p-8 text-gray-900">
      <h2 className="text-4xl sm:text-5xl font-bold mb-4 sm:mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 drop-shadow-sm text-center">
        {player.name}, Filo Hazırlığı
      </h2>
      
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-center lg:items-start w-full max-w-7xl justify-center">
        
        {/* Arsenal Panel */}
        <div className="flex flex-col w-full max-w-sm bg-white p-6 sm:p-8 rounded-3xl shadow-xl border border-gray-200">
          <div className="flex items-center justify-between mb-6 border-b border-gray-200 pb-4">
            <h3 className="text-2xl font-bold text-blue-600">Cephanelik</h3>
            <MousePointerClick className="text-gray-400" />
          </div>
          
          <p className="text-sm text-gray-500 mb-4 italic">
            * Yerleştirmek için gemiyi seçip ızgaraya tıkla veya sürükle.
          </p>

          <div className="flex-1 space-y-4 max-h-[40vh] overflow-y-auto pr-2">
            {unplacedShips.map(ship => (
              <motion.div 
                key={ship.id} 
                drag
                dragSnapToOrigin
                onDragStart={() => setSelectedShip(ship)}
                onDragEnd={(e, info) => {
                  const target = e.target as HTMLElement;
                  const originalDisplay = target.style.display;
                  target.style.display = 'none';
                  
                  const el = document.elementFromPoint(info.point.x, info.point.y);
                  
                  target.style.display = originalDisplay;

                  if (el) {
                    const cellEl = el.closest('[data-x]');
                    if (cellEl) {
                      const x = parseInt(cellEl.getAttribute('data-x')!);
                      const y = parseInt(cellEl.getAttribute('data-y')!);
                      if (!checkOverlap(x, y, ship.size, isVertical)) {
                        setPlacedShips(prev => [...prev, { id: ship.id, x, y, vertical: isVertical, isShielded: false }]);
                        setSelectedShip(null);
                        setHoverCell(null);
                      }
                    }
                  }
                }}
                onClick={() => setSelectedShip(selectedShip?.id === ship.id ? null : ship)}
                className={`p-4 rounded-2xl cursor-pointer transition-all border ${selectedShip?.id === ship.id ? 'bg-blue-50 border-blue-400 shadow-md scale-105' : 'bg-gray-50 hover:bg-gray-100 border-gray-200'} z-50 relative`}
              >
                <div className="text-lg font-bold mb-3 text-gray-800 pointer-events-none">{ship.name} ({ship.size})</div>
                <div className="flex gap-1 pointer-events-none">
                  {Array.from({length: ship.size}).map((_, i) => (
                    <div key={i} className={`w-8 h-8 rounded-md ${ship.color} shadow-sm`} />
                  ))}
                </div>
              </motion.div>
            ))}

            {unplacedShips.length === 0 && (
              <div className="mt-8 p-6 bg-red-50 border border-red-200 rounded-2xl text-center">
                <h4 className="text-xl font-bold text-red-600 mb-2">Gizli Mayınlar</h4>
                <p className="text-sm text-gray-600 mb-4">Izgaraya tıklayarak mayın yerleştir.</p>
                <div className="flex justify-center gap-2">
                  {Array.from({length: 2}).map((_, i) => (
                    <div key={i} className={`w-10 h-10 rounded-lg flex items-center justify-center ${i < placedMines.length ? 'bg-gray-200' : 'bg-red-100 animate-pulse'}`}>
                      <Bomb size={24} className={i < placedMines.length ? 'text-gray-400' : 'text-red-500'} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col gap-4">
            <button 
              onClick={() => setIsVertical(!isVertical)}
              className="flex items-center justify-center p-4 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-2xl font-bold text-xl text-gray-700 transition-all"
            >
              <RotateCw className="mr-3" size={24} /> Yön: {isVertical ? 'Dikey' : 'Yatay'}
            </button>
            
            <button 
              onClick={() => onReady(placedShips, placedMines)}
              disabled={unplacedShips.length > 0 || minesLeft > 0}
              className="flex items-center justify-center p-5 bg-green-500 hover:bg-green-600 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl font-black text-2xl shadow-lg transition-all"
            >
              <Check className="mr-3" size={28} /> SAVAŞA HAZIR
            </button>
          </div>
        </div>

        {/* Grid Panel */}
        <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-xl border border-gray-200 w-full max-w-[50vh] lg:max-w-[60vh]">
          <div className="grid grid-cols-10 grid-rows-10 gap-0 border-4 border-gray-300 bg-white rounded-xl overflow-hidden aspect-square w-full touch-none">
            {renderGrid()}
          </div>
          <p className="text-center mt-4 text-gray-500 text-sm sm:text-base">
            * Yerleştirilen gemiyi taşımak veya silmek için üzerine tıkla.
          </p>
        </div>
      </div>
    </div>
  );
};

