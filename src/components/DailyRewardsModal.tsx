/**
 * City Rush 3D - Daily Rewards & Daily Missions Modal (Update V2)
 * 10-day login reward streak, 240h cycle server sync, and daily mission progress.
 */

import React, { useState, useEffect } from 'react';
import { X, Gift, Check, Clock, Coins, Sparkles, Target, Award, RefreshCw } from 'lucide-react';
import { SaveData, DailyMission } from '../game/types';
import { DAILY_MISSIONS_TEMPLATE } from '../game/rules';
import { soundEngine } from '../game/audio';

interface DailyRewardsModalProps {
  saveData: SaveData;
  onCoinsAwarded: (coins: number) => void;
  onUpdateDailyMissionClaim: (missionId: string, rewardCoins: number) => void;
  onClose: () => void;
}

const REWARDS_10_DAYS = [
  { day: 1, coins: 100, label: 'Khởi Động' },
  { day: 2, coins: 150, label: 'Tăng Tốc' },
  { day: 3, coins: 200, label: 'Lướt Gió' },
  { day: 4, coins: 250, label: 'Đột Phá' },
  { day: 5, coins: 350, label: 'Siêu Cấp' },
  { day: 6, coins: 450, label: 'Bão Táp' },
  { day: 7, coins: 600, label: 'Huyền Thoại' },
  { day: 8, coins: 750, label: 'Bất Bại' },
  { day: 9, coins: 900, label: 'Chiến Thần' },
  { day: 10, coins: 1500, label: 'VUA ĐƯỜNG ĐUA', isSpecial: true },
];

export const DailyRewardsModal: React.FC<DailyRewardsModalProps> = ({
  saveData,
  onCoinsAwarded,
  onUpdateDailyMissionClaim,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'rewards' | 'missions'>('rewards');
  const [status, setStatus] = useState<{
    dayInCycle: number;
    claimedDays: number[];
    canClaimToday: boolean;
    secondsUntilNextDay: number;
    hoursLeftInCycle: number;
  }>({
    dayInCycle: 1,
    claimedDays: [],
    canClaimToday: false,
    secondsUntilNextDay: 86400,
    hoursLeftInCycle: 240,
  });

  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`/api/daily-rewards/status/${saveData.playerId}`);
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleClaimReward = async (day: number) => {
    if (claiming || !status.canClaimToday || day !== status.dayInCycle) return;
    setClaiming(true);
    setMessage(null);

    try {
      const res = await fetch('/api/daily-rewards/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: saveData.playerId, day }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        soundEngine.playNearMissDing();
        onCoinsAwarded(data.coinsAwarded);
        setMessage(`Chúc mừng! Bạn đã nhận +${data.coinsAwarded} Xu ngày ${day}!`);
        setStatus((prev) => ({
          ...prev,
          claimedDays: data.claimedDays,
          canClaimToday: false,
        }));
      } else {
        setMessage(data.error || 'Lỗi nhận thưởng');
      }
    } catch (e: any) {
      setMessage(e.message || 'Lỗi kết nối máy chủ');
    } finally {
      setClaiming(false);
    }
  };

  const formatCountdown = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-none font-racing">
      <div className="relative w-full max-w-3xl bg-zinc-950 border border-white/20 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-zinc-900/60">
          <div className="flex items-center space-x-3">
            <Gift className="w-6 h-6 text-amber-400" />
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-wider">THƯỞNG NGÀY & NHIỆM VỤ HÀNG NGÀY</h2>
              <p className="text-xs text-zinc-400">Chu kỳ thưởng 10 Ngày (240 Giờ) - Đồng bộ Server UTC</p>
            </div>
          </div>

          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition"
            aria-label="Đóng bảng thưởng"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Filters */}
        <div className="flex border-b border-white/10 bg-zinc-900/40 px-6">
          <button
            onClick={() => {
              soundEngine.playClick();
              setActiveTab('rewards');
            }}
            className={`py-3 px-4 text-xs font-bold uppercase tracking-wider flex items-center space-x-2 border-b-2 transition ${
              activeTab === 'rewards'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Gift className="w-4 h-4" />
            <span>Thưởng 10 Ngày Đăng Nhập</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              setActiveTab('missions');
            }}
            className={`py-3 px-4 text-xs font-bold uppercase tracking-wider flex items-center space-x-2 border-b-2 transition ${
              activeTab === 'missions'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>Nhiệm Vụ Trong Ngày</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {message && (
            <div className="p-3 bg-amber-500/15 border border-amber-500/30 text-amber-300 rounded-xl text-xs font-bold text-center animate-fade-in">
              {message}
            </div>
          )}

          {activeTab === 'rewards' ? (
            <div>
              {/* Cycle Info Bar */}
              <div className="flex flex-wrap items-center justify-between bg-zinc-900/60 border border-white/10 p-3.5 rounded-2xl mb-4 text-xs">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span className="text-zinc-400">Lượt nhận tiếp theo sau:</span>
                  <span className="font-mono font-bold text-white">
                    {formatCountdown(status.secondsUntilNextDay)}
                  </span>
                </div>

                <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-zinc-400">Chu kỳ 240H còn lại:</span>
                  <span className="font-bold text-amber-300">{status.hoursLeftInCycle} Giờ</span>
                </div>
              </div>

              {/* 10 Days Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {REWARDS_10_DAYS.map((item) => {
                  const isClaimed = status.claimedDays.includes(item.day);
                  const isCurrentEligible = status.dayInCycle === item.day && status.canClaimToday;
                  const isPastMissed = item.day < status.dayInCycle && !isClaimed;

                  return (
                    <div
                      key={item.day}
                      className={`p-3.5 rounded-2xl border flex flex-col justify-between items-center text-center transition ${
                        item.isSpecial
                          ? 'sm:col-span-2 bg-gradient-to-br from-amber-900/40 via-zinc-900 to-black border-amber-500/60 shadow-lg'
                          : isClaimed
                          ? 'bg-zinc-900/30 border-white/5 opacity-70'
                          : isCurrentEligible
                          ? 'bg-amber-500/15 border-amber-400 shadow-md shadow-amber-500/20'
                          : 'bg-zinc-900/50 border-white/10'
                      }`}
                    >
                      <div className="w-full flex items-center justify-between text-[11px] font-bold text-zinc-400 mb-2">
                        <span>NGÀY {item.day}</span>
                        {isClaimed ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : item.isSpecial ? (
                          <span className="text-[9px] bg-amber-500 text-black px-1.5 py-0.5 rounded font-black">
                            ĐẶC BIỆT
                          </span>
                        ) : null}
                      </div>

                      <div className="my-2">
                        <Coins className={`w-8 h-8 mx-auto ${item.isSpecial ? 'text-amber-300' : 'text-amber-400'}`} />
                        <div className="text-lg font-black text-white mt-1">+{item.coins}</div>
                        <div className="text-[10px] text-zinc-400">{item.label}</div>
                      </div>

                      <div className="w-full mt-2">
                        {isClaimed ? (
                          <span className="block w-full py-1 text-[11px] font-bold text-zinc-500 bg-zinc-800/40 rounded-lg">
                            ĐÃ NHẬN
                          </span>
                        ) : isCurrentEligible ? (
                          <button
                            onClick={() => handleClaimReward(item.day)}
                            disabled={claiming}
                            className="w-full py-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-xs rounded-lg shadow-md transition"
                          >
                            NHẬN NGAY
                          </button>
                        ) : isPastMissed ? (
                          <span className="block w-full py-1 text-[10px] font-bold text-zinc-500">
                            BỎ LỠ
                          </span>
                        ) : (
                          <span className="block w-full py-1 text-[10px] text-zinc-500 font-mono">
                            KHÓA
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Daily Missions List */
            <div className="space-y-3">
              {DAILY_MISSIONS_TEMPLATE.map((m) => {
                const stored = saveData.dailyMissionProgress[m.id] || { progress: 0, claimed: false };
                const currentProgress = stored.progress;
                const isComplete = currentProgress >= m.targetValue;
                const isClaimed = stored.claimed;

                return (
                  <div
                    key={m.id}
                    className="p-4 bg-zinc-900/60 border border-white/10 rounded-2xl flex items-center justify-between"
                  >
                    <div className="flex-1 pr-4">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-bold text-sm text-white">{m.title}</h4>
                        <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded">
                          +{m.rewardCoins} Xu
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">{m.description}</p>

                      {/* Progress Bar */}
                      <div className="mt-2.5">
                        <div className="flex justify-between text-[10px] font-mono text-zinc-400 mb-1">
                          <span>Tiến độ:</span>
                          <span>
                            {Math.min(currentProgress, m.targetValue)} / {m.targetValue}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-cyan-400 rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min(100, (currentProgress / m.targetValue) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      {isClaimed ? (
                        <span className="px-3 py-1.5 bg-zinc-800 text-zinc-500 text-xs font-bold rounded-xl">
                          ĐÃ NHẬN
                        </span>
                      ) : isComplete ? (
                        <button
                          onClick={() => {
                            soundEngine.playNearMissDing();
                            onUpdateDailyMissionClaim(m.id, m.rewardCoins);
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-black text-xs rounded-xl shadow-lg transition"
                        >
                          NHẬN XU
                        </button>
                      ) : (
                        <span className="px-3 py-1.5 bg-zinc-800/40 text-zinc-400 text-xs font-bold rounded-xl border border-white/5">
                          CHƯA ĐẠT
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
