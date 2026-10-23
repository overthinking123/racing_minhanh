/**
 * City Rush 3D - Heads-Up Display (HUD) (Update V2)
 * Clean corner notifications (never blocking road center), dedicated Headlights toggle (Z/X),
 * real-time speedometer, responsive touch controls.
 */

import React from 'react';
import { Camera, Volume2, Pause, Zap, Flame, AlertTriangle, Lightbulb } from 'lucide-react';
import { PlayerStats, GameMode } from '../game/types';
import { NearMissEvent } from '../game/GameEngine';

interface HUDProps {
  stats: PlayerStats;
  mode: GameMode;
  cameraMode: 'chase' | 'cockpit';
  headlightsOn: boolean;
  nearMissEvents: NearMissEvent[];
  isWrongWay: boolean;
  onPause: () => void;
  onToggleCamera: () => void;
  onToggleHeadlights: () => void;
  onFlashHeadlights: () => void;
  onHonk: () => void;
  onTouchInput: (key: 'accelerate' | 'brake' | 'steerLeft' | 'steerRight' | 'nitro', active: boolean) => void;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  mode,
  cameraMode,
  headlightsOn,
  nearMissEvents,
  isWrongWay,
  onPause,
  onToggleCamera,
  onToggleHeadlights,
  onFlashHeadlights,
  onHonk,
  onTouchInput,
}) => {
  const maxDialSpeed = 340;
  const speedRatio = Math.min(1.0, stats.speedKmh / maxDialSpeed);
  const needleRotation = -120 + speedRatio * 240;

  return (
    <div
      className="absolute inset-0 pointer-events-none flex flex-col justify-between z-20 font-racing select-none overflow-hidden touch-none"
      style={{
        paddingTop: 'max(0.5rem, env(safe-area-inset-top))',
        paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))',
        paddingLeft: 'max(0.5rem, env(safe-area-inset-left))',
        paddingRight: 'max(0.5rem, env(safe-area-inset-right))',
      }}
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between w-full max-w-5xl mx-auto pointer-events-auto gap-1 sm:gap-2 px-1 sm:px-0">
        {/* Left: Distance & Coins */}
        <div className="flex items-center space-x-1.5 sm:space-x-3 bg-black/80 border border-white/10 px-2 sm:px-4 py-1.5 sm:py-2 rounded-xl text-white shadow-xl">
          <div>
            <div className="text-[8px] sm:text-[11px] text-zinc-400 uppercase tracking-widest font-semibold">ĐƯỜNG</div>
            <div className="text-xs sm:text-xl font-bold tracking-tight text-cyan-400">
              {stats.distanceM > 1000 ? `${(stats.distanceM / 1000).toFixed(1)}k` : `${stats.distanceM}m`}
            </div>
          </div>
          <div className="h-5 sm:h-6 w-[1px] bg-white/15" />
          <div>
            <div className="text-[8px] sm:text-[11px] text-zinc-400 uppercase tracking-widest font-semibold">THƯỞNG</div>
            <div className="text-xs sm:text-xl font-bold tracking-tight text-amber-400">
              +{stats.coins.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Center: Score & Combo & Time Attack Timer */}
        <div className="flex flex-col items-center">
          <div className="bg-gradient-to-r from-red-600/80 via-black/80 to-blue-600/80 border border-white/15 px-2.5 sm:px-6 py-0.5 sm:py-1.5 rounded-xl text-center shadow-2xl">
            <div className="text-[8px] sm:text-[10px] text-zinc-300 uppercase tracking-widest font-semibold">ĐIỂM SỐ</div>
            <div className="text-lg sm:text-3xl font-extrabold tracking-wider text-white">
              {stats.score.toLocaleString()}
            </div>
          </div>

          {stats.combo > 1 && (
            <div className="mt-0.5 flex items-center space-x-1 px-2 py-0.5 bg-amber-500 text-black font-extrabold text-[10px] sm:text-xs rounded-full shadow-lg animate-bounce">
              <Zap className="w-3 h-3 fill-black" />
              <span>x{stats.combo}</span>
            </div>
          )}

          {mode === 'time_attack' && (
            <div className={`mt-0.5 px-2 py-0.5 rounded-lg font-bold text-[10px] sm:text-xs tracking-wider ${
              stats.timeRemainingSec <= 10 ? 'bg-red-600 text-white animate-pulse' : 'bg-black/80 text-cyan-300 border border-cyan-500/30'
            }`}>
              {Math.ceil(stats.timeRemainingSec)}S
            </div>
          )}
        </div>

        {/* Right: Controls (Aozoom Headlights, Flash, Camera, Horn, Pause) */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          {/* Quick Flash Aozoom Bi-Laser Button ('Nháy Pha Xin Đường') */}
          <button
            onClick={onFlashHeadlights}
            className="flex items-center space-x-1 px-1.5 sm:px-2.5 py-1.5 sm:py-2 rounded-xl transition text-[10px] sm:text-xs font-black border bg-cyan-500/25 hover:bg-cyan-500/40 active:scale-95 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/20 touch-none"
            title="Nháy Đèn Pha Aozoom Bi-Laser Xin Đường (Phím F)"
            aria-label="Nháy pha xin đường"
          >
            <Zap className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400 animate-pulse" />
            <span className="uppercase tracking-tight">NHÁY PHA</span>
            <span className="hidden sm:inline text-[9px] bg-white/10 px-1 py-0.5 rounded font-mono">F</span>
          </button>

          {/* Aozoom Headlights Toggle Button */}
          <button
            onClick={onToggleHeadlights}
            className={`flex items-center space-x-1 px-1.5 sm:px-2.5 py-1.5 sm:py-2 rounded-xl transition text-[10px] sm:text-xs font-bold border touch-none ${
              headlightsOn
                ? 'bg-amber-500/25 border-amber-400 text-amber-300 shadow-md shadow-amber-500/20'
                : 'bg-black/75 border-white/20 text-zinc-400 hover:text-white'
            }`}
            title="Bật/Tắt Đèn Pha Aozoom (Phím Z hoặc X)"
            aria-label="Bật tắt đèn pha"
          >
            <Lightbulb className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${headlightsOn ? 'text-amber-400 fill-amber-400' : 'text-zinc-400'}`} />
            <span className="hidden sm:inline uppercase">{headlightsOn ? 'AOZOOM' : 'TẮT ĐÈN'}</span>
            <span className="hidden sm:inline text-[9px] bg-white/10 px-1 py-0.5 rounded font-mono">Z</span>
          </button>

          {/* Camera View Toggle */}
          <button
            onClick={onToggleCamera}
            className="flex items-center space-x-1 bg-black/75 hover:bg-white/20 active:bg-white/30 border border-white/20 text-white px-1.5 sm:px-2.5 py-1.5 sm:py-2 rounded-xl transition text-[10px] sm:text-xs font-semibold touch-none"
            title="Đổi góc nhìn Camera (C)"
            aria-label="Đổi góc nhìn Camera"
          >
            <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
            <span className="hidden sm:inline uppercase">{cameraMode === 'chase' ? 'Góc Sau' : 'Cabin'}</span>
          </button>

          {/* Horn */}
          <button
            onClick={onHonk}
            className="p-1.5 sm:p-2 bg-black/75 hover:bg-white/20 active:bg-white/30 border border-white/20 text-white rounded-xl transition touch-none"
            title="Bấm còi xe (H)"
            aria-label="Bấm còi xe"
          >
            <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
          </button>

          {/* Pause */}
          <button
            onClick={onPause}
            className="p-1.5 sm:p-2 bg-black/75 hover:bg-white/20 active:bg-white/30 border border-white/20 text-white rounded-xl transition touch-none"
            title="Tạm dừng game (Esc)"
            aria-label="Tạm dừng game"
          >
            <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-300" />
          </button>
        </div>
      </div>

      {/* TOP-RIGHT CORNER NOTIFICATION FEED (Fix: Never blocking center road!) */}
      <div className="absolute top-16 sm:top-20 right-3 sm:right-6 flex flex-col items-end space-y-1.5 pointer-events-none max-w-xs z-30">
        {nearMissEvents.slice(-3).map((nm) => (
          <div
            key={nm.id}
            className="bg-black/90 border border-cyan-400/80 text-cyan-300 px-3.5 py-1.5 rounded-xl shadow-xl animate-fade-in flex items-center space-x-2 text-right backdrop-blur-none"
          >
            <div className="w-2 h-2 rounded-full bg-cyan-400" />
            <div>
              <div className="text-[10px] font-bold text-amber-400 tracking-wider">
                ★ {nm.title || 'VƯỢT XE GẦN'} ★
              </div>
              <div className="text-xs font-black text-white">
                +{nm.scoreBonus} ĐIỂM <span className="text-amber-400">(+{nm.cashBonus} Xu)</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Center Alerts (Wrong-Way alert only, subtle banner) */}
      <div className="flex flex-col items-center justify-center pointer-events-none mt-2">
        {isWrongWay && (
          <div className="flex items-center space-x-2 bg-red-600/90 text-white px-4 sm:px-6 py-1.5 sm:py-2 rounded-2xl font-black text-sm sm:text-base tracking-wider border-2 border-yellow-300 shadow-2xl animate-pulse">
            <AlertTriangle className="w-5 h-5 text-yellow-300" />
            <span>NGƯỢC CHIỀU! THƯỞNG ĐIỂM x2.2</span>
          </div>
        )}
      </div>

      {/* Bottom Dashboard / Controls Area */}
      <div className="w-full max-w-5xl mx-auto flex items-end justify-between gap-1 sm:gap-3">
        {/* Left Side: Touch Steering */}
        <div className="pointer-events-auto flex items-center space-x-1 sm:space-x-2 touch-none select-none">
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              onTouchInput('steerLeft', true);
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              onTouchInput('steerLeft', false);
            }}
            onPointerCancel={() => onTouchInput('steerLeft', false)}
            onPointerLeave={() => onTouchInput('steerLeft', false)}
            className="w-13 h-13 sm:w-18 sm:h-18 bg-black/75 active:bg-cyan-600/60 border-2 border-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center text-white text-xl sm:text-2xl font-extrabold shadow-2xl transition touch-none select-none"
            aria-label="Đánh lái trái"
          >
            ◀
          </button>
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              onTouchInput('steerRight', true);
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              onTouchInput('steerRight', false);
            }}
            onPointerCancel={() => onTouchInput('steerRight', false)}
            onPointerLeave={() => onTouchInput('steerRight', false)}
            className="w-13 h-13 sm:w-18 sm:h-18 bg-black/75 active:bg-cyan-600/60 border-2 border-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center text-white text-xl sm:text-2xl font-extrabold shadow-2xl transition touch-none select-none"
            aria-label="Đánh lái phải"
          >
            ▶
          </button>
        </div>

        {/* Center: Analog Speedometer & Nitro Gauge */}
        <div className="flex flex-col items-center pointer-events-auto bg-black/85 border border-white/15 px-2.5 sm:px-6 py-1.5 sm:py-2 rounded-2xl sm:rounded-3xl shadow-2xl scale-85 sm:scale-100 origin-bottom select-none">
          <div className="w-28 sm:w-48 mb-0.5 sm:mb-2">
            <div className="flex justify-between items-center text-[8px] sm:text-[10px] text-zinc-400 font-bold mb-0.5">
              <span className="flex items-center text-cyan-400">
                <Flame className="w-3 h-3 mr-1" /> NITRO
              </span>
              <span>{Math.round(stats.nitroRemaining)}%</span>
            </div>
            <div className="w-full h-1.5 sm:h-2 bg-zinc-800 rounded-full overflow-hidden border border-cyan-500/30">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 transition-all duration-75"
                style={{ width: `${stats.nitroRemaining}%` }}
              />
            </div>
          </div>

          <div className="relative w-24 sm:w-36 h-18 sm:h-28 flex flex-col items-center justify-center">
            <svg className="w-24 sm:w-36 h-18 sm:h-28 overflow-visible" viewBox="0 0 100 70">
              <path
                d="M 15 65 A 40 40 0 1 1 85 65"
                fill="none"
                stroke="#27272a"
                strokeWidth="7"
                strokeLinecap="round"
              />
              <path
                d="M 15 65 A 40 40 0 1 1 85 65"
                fill="none"
                stroke="url(#speedGradient)"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray="180"
                strokeDashoffset={180 - speedRatio * 180}
              />
              <defs>
                <linearGradient id="speedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="65%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
              </defs>
            </svg>

            <div
              className="absolute bottom-1 w-0.5 sm:w-1 h-9 sm:h-14 bg-red-500 origin-bottom rounded-full transition-transform duration-75"
              style={{
                transform: `rotate(${needleRotation}deg)`,
                boxShadow: '0 0 6px #ef4444',
              }}
            />

            <div className="absolute bottom-0 text-center">
              <div className="text-xl sm:text-4xl font-black tracking-tight text-white leading-none">
                {stats.speedKmh}
              </div>
              <div className="text-[8px] sm:text-[11px] font-bold text-zinc-400 tracking-wider">KM/H</div>
            </div>
          </div>
        </div>

        {/* Right Side: Touch Boost, Brake, Gas */}
        <div className="pointer-events-auto flex flex-col items-end space-y-1 touch-none select-none">
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              onTouchInput('nitro', true);
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              onTouchInput('nitro', false);
            }}
            onPointerCancel={() => onTouchInput('nitro', false)}
            onPointerLeave={() => onTouchInput('nitro', false)}
            className="w-full h-7 sm:h-8 bg-gradient-to-r from-cyan-600 to-blue-600 active:from-cyan-400 active:to-blue-400 border border-cyan-300 rounded-lg sm:rounded-xl flex items-center justify-center space-x-1 text-white text-[9px] sm:text-[11px] font-black shadow-lg transition touch-none select-none"
            aria-label="Kích hoạt Nitro"
          >
            <Flame className="w-3 h-3 fill-white" />
            <span>NITRO BOOST</span>
          </button>

          <div className="flex items-center space-x-1 sm:space-x-2">
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                onTouchInput('brake', true);
              }}
              onPointerUp={(e) => {
                e.preventDefault();
                onTouchInput('brake', false);
              }}
              onPointerCancel={() => onTouchInput('brake', false)}
              onPointerLeave={() => onTouchInput('brake', false)}
              className="w-13 h-12 sm:w-16 sm:h-16 bg-gradient-to-t from-red-900 to-red-600 active:from-red-600 active:to-red-500 border-2 border-red-400 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center text-white text-[10px] sm:text-xs font-black shadow-2xl transition touch-none select-none"
              aria-label="Phanh xe"
            >
              <span className="text-xs sm:text-lg leading-none">STOP</span>
              <span className="text-[7px] sm:text-[9px] text-red-200">PHANH</span>
            </button>

            <button
              onPointerDown={(e) => {
                e.preventDefault();
                onTouchInput('accelerate', true);
              }}
              onPointerUp={(e) => {
                e.preventDefault();
                onTouchInput('accelerate', false);
              }}
              onPointerCancel={() => onTouchInput('accelerate', false)}
              onPointerLeave={() => onTouchInput('accelerate', false)}
              className="w-15 h-12 sm:w-18 sm:h-16 bg-gradient-to-t from-emerald-800 to-emerald-500 active:from-emerald-500 active:to-emerald-400 border-2 border-emerald-300 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center text-white text-[10px] sm:text-xs font-black shadow-2xl transition touch-none select-none"
              aria-label="Tăng ga"
            >
              <span className="text-sm sm:text-xl leading-none">GAS</span>
              <span className="text-[7px] sm:text-[9px] text-emerald-100">GA</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
