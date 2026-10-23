/**
 * City Rush 3D - Settings & Preferences Modal (Update V2)
 * Full controls for graphics quality, mouse sensitivity, camera auto-center,
 * camera shake, headlight auto-on, FOV, and audio volumes.
 */

import React from 'react';
import { X, Volume2, Monitor, Camera, Sliders, Gamepad2, Lightbulb, User, Navigation } from 'lucide-react';
import { SaveData, GameSettings } from '../game/types';
import { soundEngine } from '../game/audio';

interface SettingsModalProps {
  saveData: SaveData;
  onUpdateSettings: (updater: (prev: GameSettings) => GameSettings) => void;
  onUpdatePlayerName?: (name: string) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  saveData,
  onUpdateSettings,
  onUpdatePlayerName,
  onClose,
}) => {
  const { settings } = saveData;

  const handleMasterChange = (val: number) => {
    onUpdateSettings((prev) => {
      const next = { ...prev, masterVolume: val };
      soundEngine.setVolumes(next.masterVolume, next.engineVolume, next.sfxVolume);
      return next;
    });
  };

  const handleEngineChange = (val: number) => {
    onUpdateSettings((prev) => {
      const next = { ...prev, engineVolume: val };
      soundEngine.setVolumes(next.masterVolume, next.engineVolume, next.sfxVolume);
      return next;
    });
  };

  const handleSfxChange = (val: number) => {
    onUpdateSettings((prev) => {
      const next = { ...prev, sfxVolume: val };
      soundEngine.setVolumes(next.masterVolume, next.engineVolume, next.sfxVolume);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-none font-racing">
      <div style={{ maxHeight: '86vh' }} className="relative w-full max-w-2xl bg-zinc-950 border border-white/20 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-zinc-900/60 shrink-0">
          <div className="flex items-center space-x-3">
            <Sliders className="w-6 h-6 text-cyan-400" />
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-wider">CÀI ĐẶT TRÒ CHƠI</h2>
              <p className="text-xs text-zinc-400">Điều chỉnh đồ họa, camera chuột, âm thanh và hồ sơ tay đua</p>
            </div>
          </div>

          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition"
            aria-label="Đóng cài đặt"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Player Profile Name */}
          <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center space-x-2 text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">
              <User className="w-4 h-4" />
              <span>Hồ Sơ Tay Đua Trực Tuyến</span>
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={saveData.playerName}
                onChange={(e) => onUpdatePlayerName?.(e.target.value)}
                maxLength={20}
                placeholder="Nhập biệt danh đua xe..."
                className="flex-1 bg-black/70 border border-white/15 px-3 py-2 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-cyan-400"
              />
              <span className="text-xs text-zinc-400 font-mono">ID: {saveData.playerId}</span>
            </div>
          </div>

          {/* Graphics Quality */}
          <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center space-x-2 text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2.5">
              <Monitor className="w-4 h-4" />
              <span>Chất Lượng Đồ Họa</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'high'] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    soundEngine.playClick();
                    onUpdateSettings((prev) => ({ ...prev, graphicsQuality: q }));
                  }}
                  className={`py-2 rounded-xl text-xs font-bold uppercase transition border ${
                    settings.graphicsQuality === q
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md'
                      : 'bg-black/40 border-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  {q === 'low' ? 'Thấp (Tiết Kiệm)' : q === 'medium' ? 'Trung Bình' : 'Cao (Đẹp Nhất)'}
                </button>
              ))}
            </div>
          </div>

          {/* Mouse & Camera Settings */}
          <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-4 space-y-3.5">
            <div className="flex items-center space-x-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
              <Camera className="w-4 h-4" />
              <span>Camera & Chuột Quan Sát 360</span>
            </div>

            {/* Mouse Sensitivity */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-zinc-300 mb-1">
                <span>Độ Nhạy Kéo Chuột Xoay Camera</span>
                <span>{(settings.mouseSensitivity || 1.0).toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.3"
                max="2.5"
                step="0.1"
                value={settings.mouseSensitivity || 1.0}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onUpdateSettings((prev) => ({ ...prev, mouseSensitivity: val }));
                }}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Field of View (FOV) */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-zinc-300 mb-1">
                <span>Tầm Nhìn Ống Kính (Field of View - FOV)</span>
                <span>{settings.fieldOfView || 60}°</span>
              </div>
              <input
                type="range"
                min="50"
                max="85"
                step="1"
                value={settings.fieldOfView || 60}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  onUpdateSettings((prev) => ({ ...prev, fieldOfView: val }));
                }}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Toggles: Auto-Center & Camera Shake */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => {
                  soundEngine.playClick();
                  onUpdateSettings((prev) => ({ ...prev, cameraAutoCenter: !prev.cameraAutoCenter }));
                }}
                className={`p-2.5 rounded-xl border text-left text-xs font-bold transition flex items-center justify-between ${
                  settings.cameraAutoCenter
                    ? 'bg-cyan-500/15 border-cyan-400 text-cyan-300'
                    : 'bg-black/40 border-white/10 text-zinc-400'
                }`}
              >
                <span>Tự Căn Giữa Camera</span>
                <span className="text-[10px] uppercase font-black">{settings.cameraAutoCenter ? 'BẬT' : 'TẮT'}</span>
              </button>

              <button
                onClick={() => {
                  soundEngine.playClick();
                  onUpdateSettings((prev) => ({ ...prev, cameraShake: !prev.cameraShake }));
                }}
                className={`p-2.5 rounded-xl border text-left text-xs font-bold transition flex items-center justify-between ${
                  settings.cameraShake
                    ? 'bg-cyan-500/15 border-cyan-400 text-cyan-300'
                    : 'bg-black/40 border-white/10 text-zinc-400'
                }`}
              >
                <span>Rung Camera Va Chạm</span>
                <span className="text-[10px] uppercase font-black">{settings.cameraShake ? 'BẬT' : 'TẮT'}</span>
              </button>
            </div>
          </div>

          {/* Headlights & Audio Settings */}
          <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-4 space-y-3.5">
            <div className="flex items-center space-x-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
              <Lightbulb className="w-4 h-4" />
              <span>Đèn Pha Chiếu Sáng</span>
            </div>

            <div className="flex items-center justify-between bg-black/40 p-2.5 rounded-xl border border-white/10">
              <div>
                <div className="text-xs font-bold text-white">Tự Bật Đèn Pha Ban Đêm</div>
                <div className="text-[10px] text-zinc-400">Tự động kích hoạt khi vào map Neon Night Drive</div>
              </div>
              <button
                onClick={() => {
                  soundEngine.playClick();
                  onUpdateSettings((prev) => ({ ...prev, headlightAutoOn: !prev.headlightAutoOn }));
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  settings.headlightAutoOn ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {settings.headlightAutoOn ? 'BẬT' : 'TẮT'}
              </button>
            </div>

            <div className="flex items-center justify-between bg-black/40 p-2.5 rounded-xl border border-white/10">
              <div>
                <div className="text-xs font-bold text-cyan-300">Thời Tiết Mưa Rơi 3D (Đường Ướt Bóng)</div>
                <div className="text-[10px] text-zinc-400">Hiệu ứng hạt mưa rơi, mặt đường ướt phản xạ đèn & trơn trượt</div>
              </div>
              <button
                onClick={() => {
                  soundEngine.playClick();
                  onUpdateSettings((prev) => ({ ...prev, rainWeather: !prev.rainWeather }));
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  settings.rainWeather ? 'bg-cyan-500 text-black font-extrabold' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {settings.rainWeather ? 'MƯA BẬT' : 'MƯA TẮT'}
              </button>
            </div>
          </div>

          {/* AI Traffic & Driving Assistant */}
          <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-4 space-y-3.5">
            <div className="flex items-center space-x-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
              <Navigation className="w-4 h-4" />
              <span>Giao Thông & Trợ Lái AI</span>
            </div>

            <div className="flex items-center justify-between bg-black/40 p-2.5 rounded-xl border border-white/10">
              <div className="pr-3">
                <div className="text-xs font-bold text-white">AI Nhường Đường Khi Nháy Pha</div>
                <div className="text-[10px] text-zinc-400">
                  Phương tiện AI (ô tô, mô tô, xe đạp) phía trước tự động xi-nhan và tấp làn né đường khi bạn nháy pha (F / NHÁY PHA). Tắt để AI giữ nguyên làn.
                </div>
              </div>
              <button
                onClick={() => {
                  soundEngine.playClick();
                  onUpdateSettings((prev) => ({ ...prev, aiYieldOnFlash: prev.aiYieldOnFlash === false ? true : false }));
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                  settings.aiYieldOnFlash !== false ? 'bg-cyan-500 text-black font-extrabold shadow-sm' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {settings.aiYieldOnFlash !== false ? 'BẬT' : 'TẮT'}
              </button>
            </div>
          </div>

          {/* Audio Settings */}
          <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-4 space-y-3.5">
            <div className="flex items-center space-x-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
              <Volume2 className="w-4 h-4" />
              <span>Âm Lượng Trò Chơi</span>
            </div>

            <div className="space-y-2.5">
              <div className="flex justify-between text-xs font-semibold text-zinc-300">
                <span>Âm Lượng Tổng</span>
                <span>{Math.round((settings.masterVolume || 0.8) * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.masterVolume}
                onChange={(e) => handleMasterChange(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
