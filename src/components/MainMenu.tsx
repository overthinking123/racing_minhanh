/**
 * City Rush 3D - Main Menu & Setup Screen (Update V2)
 * Mode selection, map selector, vehicle quick peek, Daily Rewards & Online Leaderboard navigation.
 */

import React from 'react';
import {
  Play,
  Wrench,
  Trophy,
  Sliders,
  Code2,
  Coins,
  Compass,
  Zap,
  Sparkles,
  Lock,
  Gift,
  Award,
  ChevronRight,
  Moon,
} from 'lucide-react';
import { GameMode, EnvironmentType, SaveData } from '../game/types';
import { CAR_CATALOG, ENVIRONMENTS } from '../game/rules';
import { soundEngine } from '../game/audio';

interface MainMenuProps {
  saveData: SaveData;
  onStartGame: () => void;
  onSelectMode: (mode: GameMode) => void;
  onSelectEnvironment: (env: EnvironmentType) => void;
  onOpenGarage: () => void;
  onOpenCareer: () => void;
  onOpenDailyRewards: () => void;
  onOpenLeaderboard: () => void;
  onOpenSettings: () => void;
  onOpenUnityCode: () => void;
  onUnlockEnvironment: (env: EnvironmentType, cost: number) => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  saveData,
  onStartGame,
  onSelectMode,
  onSelectEnvironment,
  onOpenGarage,
  onOpenCareer,
  onOpenDailyRewards,
  onOpenLeaderboard,
  onOpenSettings,
  onOpenUnityCode,
  onUnlockEnvironment,
}) => {
  const currentCar = CAR_CATALOG.find((c) => c.id === saveData.selectedCarId) || CAR_CATALOG[0];

  const modes: Array<{ id: GameMode; title: string; desc: string; icon: any; color: string }> = [
    {
      id: 'one_way',
      title: 'MỘT CHIỀU',
      desc: 'Toàn bộ 4 làn xe chạy cùng hướng',
      icon: Compass,
      color: 'from-blue-600 to-cyan-500',
    },
    {
      id: 'two_way',
      title: 'HAI CHIỀU',
      desc: '2 làn ngược chiều, thưởng x2.2 điểm',
      icon: Zap,
      color: 'from-amber-600 to-red-500',
    },
    {
      id: 'time_attack',
      title: 'TÍNH GIỜ',
      desc: 'Đua với thời gian, né gần cộng giây',
      icon: Trophy,
      color: 'from-purple-600 to-pink-500',
    },
    {
      id: 'free_ride',
      title: 'TỰ DO',
      desc: 'Lái xe thư giãn, không tính điểm',
      icon: Sparkles,
      color: 'from-emerald-600 to-teal-500',
    },
  ];

  return (
    <div className="relative z-30 min-h-screen flex flex-col justify-between p-4 sm:p-8 font-racing select-none overflow-y-auto">
      {/* Top Header Bar */}
      <div className="w-full max-w-6xl mx-auto flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 tracking-wider">
              CITY RUSH 3D
            </span>
            <span className="bg-red-600 text-white font-extrabold text-[10px] px-2 py-0.5 rounded tracking-widest">
              V2 PRO
            </span>
          </div>
          <p className="text-xs text-zinc-400">Game Đua Xe Giao Thông 3D & Bảng Xếp Hạng Trực Tuyến</p>
        </div>

        {/* Player Wallet & High Score */}
        <div className="flex items-center space-x-3">
          <div className="bg-black/75 border border-amber-500/30 px-3.5 sm:px-4 py-2 rounded-2xl flex items-center space-x-2 text-amber-400 font-bold text-xs sm:text-sm shadow-xl">
            <Coins className="w-4 h-4" />
            <span>{saveData.coins.toLocaleString()} XU</span>
          </div>

          <div className="hidden sm:flex bg-black/75 border border-white/10 px-4 py-2 rounded-2xl items-center space-x-2 text-white font-bold text-sm shadow-xl">
            <Trophy className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-zinc-400 font-normal">KỶ LỤC:</span>
            <span>{saveData.highScore.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Center Body: Mode Selection & Map Selection */}
      <div className="w-full max-w-6xl mx-auto my-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Mode Selector (6 cols) */}
        <div className="lg:col-span-6 bg-black/75 border border-white/10 rounded-3xl p-5 shadow-2xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center">
              <Compass className="w-4 h-4 mr-2" /> CHỌN CHẾ ĐỘ CHƠI
            </h3>
            <span className="text-[11px] text-zinc-400 font-semibold">
              {modes.find((m) => m.id === saveData.selectedMode)?.title}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {modes.map((mode) => {
              const Icon = mode.icon;
              const isSelected = saveData.selectedMode === mode.id;

              return (
                <button
                  key={mode.id}
                  onClick={() => {
                    soundEngine.playClick();
                    onSelectMode(mode.id);
                  }}
                  className={`p-3.5 rounded-2xl text-left border transition flex flex-col justify-between ${
                    isSelected
                      ? `bg-gradient-to-br ${mode.color} text-white border-white/40 shadow-lg scale-[1.02]`
                      : 'bg-zinc-900/60 border-white/5 text-zinc-300 hover:bg-zinc-800/80 hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon className="w-5 h-5" />
                    {isSelected && <span className="text-[10px] font-black uppercase bg-black/40 px-2 py-0.5 rounded">CHỌN</span>}
                  </div>
                  <div>
                    <h4 className="font-black text-sm tracking-wide">{mode.title}</h4>
                    <p className={`text-[11px] mt-0.5 ${isSelected ? 'text-white/80' : 'text-zinc-400'}`}>
                      {mode.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Access: Daily Rewards Banner */}
          <button
            onClick={() => {
              soundEngine.playClick();
              onOpenDailyRewards();
            }}
            className="w-full p-3.5 bg-gradient-to-r from-amber-600/30 via-zinc-900 to-zinc-900 hover:from-amber-600/40 border border-amber-500/30 rounded-2xl flex items-center justify-between text-left transition"
          >
            <div className="flex items-center space-x-3">
              <Gift className="w-6 h-6 text-amber-400" />
              <div>
                <div className="text-sm font-black text-white">THƯỞNG 10 NGÀY & NHIỆM VỤ 240H</div>
                <div className="text-[11px] text-zinc-400">Đăng nhập mỗi ngày nhận tới 1,500 Xu và vật phẩm độc quyền</div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-amber-400" />
          </button>
        </div>

        {/* Right Column: Maps, Online Leaderboard, and Car peek */}
        <div className="lg:col-span-6 space-y-4">
          {/* Map Selector */}
          <div className="bg-black/75 border border-white/10 rounded-3xl p-5 shadow-2xl">
            <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span className="flex items-center">
                <Compass className="w-4 h-4 mr-2" /> TUYẾN ĐƯỜNG ĐUA XE
              </span>
              <span className="text-[10px] text-zinc-400 font-normal">Hỗ trợ đèn pha siêu sáng (Phím Z/X)</span>
            </h3>

            <div className="grid grid-cols-2 gap-2.5">
              {ENVIRONMENTS.map((env) => {
                const isSelected = saveData.selectedEnvironment === env.id;
                const isUnlocked = saveData.unlockedEnvironments.includes(env.id);

                return (
                  <div
                    key={env.id}
                    onClick={() => {
                      if (isUnlocked) {
                        soundEngine.playClick();
                        onSelectEnvironment(env.id);
                      } else {
                        onUnlockEnvironment(env.id, env.unlockCost);
                      }
                    }}
                    className={`p-3 rounded-2xl border text-left cursor-pointer transition relative overflow-hidden ${
                      isSelected
                        ? 'bg-cyan-950/60 border-cyan-400 shadow-md shadow-cyan-500/20'
                        : isUnlocked
                        ? 'bg-zinc-900/60 border-white/5 hover:border-white/20'
                        : 'bg-zinc-900/30 border-white/5 opacity-80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs sm:text-sm text-white flex items-center">
                        {env.id === 'night' && <Moon className="w-3.5 h-3.5 mr-1 text-indigo-400" />}
                        {env.vietnameseName}
                      </span>
                      {isSelected && <span className="text-[9px] font-bold text-cyan-400 uppercase">CHỌN</span>}
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-1 line-clamp-1">{env.description}</div>

                    {!isUnlocked && (
                      <div className="mt-2 flex items-center justify-between text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg">
                        <span className="flex items-center">
                          <Lock className="w-3 h-3 mr-1" /> Mở:
                        </span>
                        <span>{env.unlockCost.toLocaleString()} Xu</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Current Car & Leaderboard Quick Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Current Car Peek */}
            <div className="bg-black/75 border border-white/10 rounded-3xl p-4 flex items-center justify-between shadow-2xl">
              <div className="flex items-center space-x-3">
                <div
                  className="w-11 h-11 rounded-2xl border-2 border-white/20 flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: saveData.carCustomizations[currentCar.id]?.color || '#3b82f6' }}
                >
                  <span className="text-[10px] font-black text-white uppercase">{currentCar.category[0]}</span>
                </div>
                <div>
                  <div className="text-[9px] text-zinc-400 font-bold uppercase">XE ĐANG CHỌN</div>
                  <div className="text-sm font-black text-white truncate max-w-[100px]">{currentCar.vietnameseName}</div>
                  <div className="text-xs text-cyan-400">{currentCar.baseStats.topSpeedKmh} KM/H</div>
                </div>
              </div>

              <button
                onClick={() => {
                  soundEngine.playClick();
                  onOpenGarage();
                }}
                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1 border border-white/10 transition"
              >
                <Wrench className="w-3.5 h-3.5 text-cyan-400" />
                <span>GARAGE</span>
              </button>
            </div>

            {/* Online Leaderboard Button */}
            <button
              onClick={() => {
                soundEngine.playClick();
                onOpenLeaderboard();
              }}
              className="bg-gradient-to-r from-indigo-950/80 to-zinc-900 border border-indigo-500/40 hover:border-indigo-400 rounded-3xl p-4 flex items-center justify-between text-left shadow-2xl transition group"
            >
              <div className="flex items-center space-x-3">
                <Award className="w-8 h-8 text-amber-400 group-hover:scale-110 transition" />
                <div>
                  <div className="text-[9px] text-indigo-300 font-bold uppercase">XẾP HẠNG TOÀN CẦU</div>
                  <div className="text-sm font-black text-white">BẢNG XẾP HẠNG</div>
                  <div className="text-xs text-zinc-400">Xem top tay đua online</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Main Action Bar */}
      <div className="w-full max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              soundEngine.playClick();
              onOpenSettings();
            }}
            className="px-4 py-3 bg-black/80 hover:bg-white/15 border border-white/15 text-white font-bold text-xs rounded-2xl flex items-center space-x-2 shadow-xl transition"
          >
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>CÀI ĐẶT</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              onOpenCareer();
            }}
            className="px-4 py-3 bg-black/80 hover:bg-white/15 border border-white/15 text-white font-bold text-xs rounded-2xl flex items-center space-x-2 shadow-xl transition"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>CHIẾN DỊCH</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              onOpenUnityCode();
            }}
            className="px-4 py-3 bg-black/80 hover:bg-white/15 border border-white/15 text-white font-bold text-xs rounded-2xl flex items-center space-x-2 shadow-xl transition"
          >
            <Code2 className="w-4 h-4 text-emerald-400" />
            <span>MÃ UNITY C#</span>
          </button>
        </div>

        <button
          onClick={() => {
            soundEngine.playClick();
            onStartGame();
          }}
          className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-red-600 via-rose-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-black text-lg sm:text-xl rounded-2xl shadow-2xl flex items-center justify-center space-x-3 transition transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Play className="w-6 h-6 fill-white" />
          <span>XUẤT PHÁT ĐUA XE</span>
        </button>
      </div>
    </div>
  );
};
