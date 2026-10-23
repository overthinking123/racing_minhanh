/**
 * City Rush 3D - Career Mode & Mission Campaign
 */

import React from 'react';
import { X, CheckCircle2, Circle, Trophy, Coins, Play, Flag } from 'lucide-react';
import { SaveData, CareerMission } from '../game/types';
import { CAREER_MISSIONS } from '../game/rules';
import { soundEngine } from '../game/audio';

interface CareerModalProps {
  saveData: SaveData;
  onSelectMission: (mission: CareerMission) => void;
  onClaimReward: (missionId: string, reward: number) => void;
  onClose: () => void;
}

export const CareerModal: React.FC<CareerModalProps> = ({
  saveData,
  onSelectMission,
  onClaimReward,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-none font-racing">
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-white/20 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-zinc-900/60">
          <div className="flex items-center space-x-3">
            <Trophy className="w-6 h-6 text-amber-400" />
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-wider">CHIẾN DỊCH NGHỆ NGHIỆP</h2>
              <p className="text-xs text-zinc-400">Hoàn thành thử thách để nhận huy chương và ngân sách khủng</p>
            </div>
          </div>

          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition"
            aria-label="Đóng nhiệm vụ"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Missions List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {CAREER_MISSIONS.map((mission, idx) => {
            const isCompleted = saveData.completedMissions.includes(mission.id);

            return (
              <div
                key={mission.id}
                className={`p-4 rounded-2xl border transition flex items-center justify-between ${
                  isCompleted
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-zinc-300'
                    : 'bg-zinc-900/40 border-white/10 hover:border-white/20 text-white'
                }`}
              >
                <div className="flex items-start space-x-3.5 flex-1 pr-3">
                  <div className="mt-1">
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-zinc-600 flex items-center justify-center text-[10px] text-zinc-400 font-bold">
                        {idx + 1}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-sm sm:text-base">{mission.title}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-zinc-300 uppercase font-semibold">
                        {mission.mode.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">{mission.description}</p>
                    <div className="flex items-center text-xs text-amber-400 font-bold mt-2">
                      <Coins className="w-3.5 h-3.5 mr-1" />
                      <span>Thưởng: +{mission.rewardCoins.toLocaleString()} Xu</span>
                    </div>
                  </div>
                </div>

                <div>
                  {isCompleted ? (
                    <span className="text-xs font-bold text-emerald-400 px-3 py-1.5 bg-emerald-500/10 rounded-xl">
                      HOÀN THÀNH
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        soundEngine.playClick();
                        onSelectMission(mission);
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-extrabold text-xs rounded-xl flex items-center space-x-1.5 shadow-md transition"
                    >
                      <Play className="w-3.5 h-3.5 fill-black" />
                      <span>THAM GIA</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
