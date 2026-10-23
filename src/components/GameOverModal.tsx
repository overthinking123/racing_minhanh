/**
 * City Rush 3D - Game Over & Results Screen
 * Detailed score breakdown, coins rewards, near misses, and retry controls.
 */

import React from 'react';
import { RotateCcw, Home, Wrench, Trophy, Coins, Zap, MapPin, Gauge } from 'lucide-react';
import { PlayerStats, SaveData } from '../game/types';
import { soundEngine } from '../game/audio';

interface GameOverModalProps {
  stats: PlayerStats;
  earnings: {
    totalCoins: number;
    breakdown: { distanceCoins: number; scoreCoins?: number; nearMissCoins: number; wrongWayCoins: number };
  };
  saveData: SaveData;
  onRestart: () => void;
  onOpenGarage: () => void;
  onBackToMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  earnings,
  saveData,
  onRestart,
  onOpenGarage,
  onBackToMenu,
}) => {
  const isNewHighScore = stats.score > saveData.highScore;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 font-racing select-none animate-fade-in">
      <div className="relative w-full max-w-lg bg-zinc-950 border-2 border-red-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl text-white">
        {/* Header Alert Banner */}
        <div className="text-center mb-6">
          <div className="inline-block px-4 py-1 rounded-full bg-red-600/30 border border-red-500/50 text-red-400 font-extrabold text-xs uppercase tracking-widest mb-2">
            {stats.gameOverReason === 'time_up' ? 'HẾT THỜI GIAN' : 'VA CHẠM GIAO THÔNG'}
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-wider text-white">
            LƯỢT ĐUA KẾT THÚC
          </h2>
        </div>

        {/* Big Score Box */}
        <div className="bg-gradient-to-b from-zinc-900 to-black border border-white/10 rounded-2xl p-4 text-center mb-5 relative overflow-hidden">
          {isNewHighScore && (
            <div className="absolute top-2 right-2 flex items-center space-x-1 bg-amber-500 text-black px-2.5 py-0.5 rounded-full font-black text-[11px] shadow-lg animate-bounce">
              <Trophy className="w-3.5 h-3.5" />
              <span>KỶ LỤC MỚI!</span>
            </div>
          )}
          <div className="text-xs text-zinc-400 font-bold uppercase tracking-widest">TỔNG ĐIỂM SỐ</div>
          <div className="text-4xl sm:text-5xl font-black text-cyan-400 tracking-tight my-1">
            {stats.score.toLocaleString()}
          </div>
          <div className="text-xs text-zinc-400">
            Kỷ lục trước đó: <span className="text-white font-bold">{saveData.highScore.toLocaleString()}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2.5 mb-5 text-center">
          <div className="bg-zinc-900/60 border border-white/5 p-2.5 rounded-xl">
            <MapPin className="w-4 h-4 mx-auto text-blue-400 mb-1" />
            <div className="text-[10px] text-zinc-400 uppercase font-semibold">QUÃNG ĐƯỜNG</div>
            <div className="text-sm font-extrabold text-white">{stats.distanceM} m</div>
          </div>
          <div className="bg-zinc-900/60 border border-white/5 p-2.5 rounded-xl">
            <Zap className="w-4 h-4 mx-auto text-amber-400 mb-1" />
            <div className="text-[10px] text-zinc-400 uppercase font-semibold">LÁCH NÉ GẦN</div>
            <div className="text-sm font-extrabold text-white">{stats.nearMissCount} lần</div>
          </div>
          <div className="bg-zinc-900/60 border border-white/5 p-2.5 rounded-xl">
            <Gauge className="w-4 h-4 mx-auto text-emerald-400 mb-1" />
            <div className="text-[10px] text-zinc-400 uppercase font-semibold">TỐC ĐỘ ĐỈNH</div>
            <div className="text-sm font-extrabold text-white">{stats.speedKmh} km/h</div>
          </div>
        </div>

        {/* Coin Earnings Breakdown */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 mb-6">
          <div className="flex items-center justify-between text-xs text-zinc-300 mb-2">
            <span className="flex items-center text-amber-400 font-bold">
              <Coins className="w-4 h-4 mr-1.5" /> TIỀN THƯỞNG NHẬN ĐƯỢC
            </span>
            <span className="text-base font-black text-amber-400">
              +{earnings.totalCoins.toLocaleString()} XU
            </span>
          </div>
          <div className="text-[11px] text-zinc-400 space-y-1 pl-5">
            {earnings.breakdown.scoreCoins !== undefined && earnings.breakdown.scoreCoins > 0 && (
              <div className="flex justify-between text-cyan-300">
                <span>• Quy đổi từ điểm số cao:</span>
                <span>+{earnings.breakdown.scoreCoins.toLocaleString()} xu</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>• Quãng đường vượt qua:</span>
              <span className="text-white">+{earnings.breakdown.distanceCoins.toLocaleString()} xu</span>
            </div>
            <div className="flex justify-between">
              <span>• Vượt xe nguy hiểm (Near Miss):</span>
              <span className="text-white">+{earnings.breakdown.nearMissCoins.toLocaleString()} xu</span>
            </div>
            {earnings.breakdown.wrongWayCoins > 0 && (
              <div className="flex justify-between text-red-300">
                <span>• Chạy làn ngược chiều:</span>
                <span>+{earnings.breakdown.wrongWayCoins.toLocaleString()} xu</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            onClick={() => {
              soundEngine.playClick();
              onRestart();
            }}
            className="w-full py-3.5 bg-gradient-to-r from-red-600 via-rose-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-black text-base rounded-2xl shadow-xl flex items-center justify-center space-x-2 transition"
          >
            <RotateCcw className="w-5 h-5" />
            <span>ĐUA LẠI NGAY</span>
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => {
                soundEngine.playClick();
                onOpenGarage();
              }}
              className="py-3 bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition"
            >
              <Wrench className="w-4 h-4 text-cyan-400" />
              <span>NÂNG CẤP XE</span>
            </button>
            <button
              onClick={() => {
                soundEngine.playClick();
                onBackToMenu();
              }}
              className="py-3 bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition"
            >
              <Home className="w-4 h-4 text-zinc-400" />
              <span>MENU CHÍNH</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
