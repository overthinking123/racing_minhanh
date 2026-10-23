/**
 * City Rush 3D - Online Leaderboard Modal
 * Live rankings connected to full-stack Express server (/api/leaderboard)
 * Tabs: All-Time, Weekly, Daily with player rank indicator.
 */

import React, { useState, useEffect } from 'react';
import { X, Trophy, Flame, Calendar, Clock, RefreshCw, User, Award } from 'lucide-react';
import { LeaderboardRow, SaveData } from '../game/types';
import { soundEngine } from '../game/audio';

interface LeaderboardModalProps {
  saveData: SaveData;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ saveData, onClose }) => {
  const [activeTab, setActiveTab] = useState<'all_time' | 'weekly' | 'daily'>('all_time');
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [playerRank, setPlayerRank] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = async (tab: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/leaderboard?tab=${tab}&playerId=${encodeURIComponent(saveData.playerId)}`);
      if (!res.ok) throw new Error('Không thể tải bảng xếp hạng');
      const data = await res.json();
      setLeaderboard(data.leaderboard || []);
      setPlayerRank(data.playerRank || null);
    } catch (e: any) {
      setError(e.message || 'Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard(activeTab);
  }, [activeTab]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 font-racing">
      <div className="relative w-full max-w-3xl bg-zinc-950 border border-white/20 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-zinc-900/60">
          <div className="flex items-center space-x-3">
            <Trophy className="w-6 h-6 text-amber-400" />
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-wider">BẢNG XẾP HẠNG TRỰC TUYẾN</h2>
              <p className="text-xs text-zinc-400">Các tay đua cự phách trên toàn cầu (Server Realtime)</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                soundEngine.playClick();
                fetchLeaderboard(activeTab);
              }}
              className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition"
              title="Làm mới bảng xếp hạng"
              aria-label="Làm mới"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
            <button
              onClick={() => {
                soundEngine.playClick();
                onClose();
              }}
              className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition"
              aria-label="Đóng bảng xếp hạng"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex border-b border-white/10 bg-zinc-900/40 px-6">
          {[
            { id: 'all_time', label: 'Toàn Thời Gian', icon: Trophy },
            { id: 'weekly', label: 'Tuần Này', icon: Calendar },
            { id: 'daily', label: 'Hôm Nay (24h)', icon: Clock },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  soundEngine.playClick();
                  setActiveTab(tab.id as any);
                }}
                className={`py-3 px-4 text-xs font-bold uppercase tracking-wider flex items-center space-x-2 border-b-2 transition ${
                  activeTab === tab.id
                    ? 'border-amber-400 text-amber-400'
                    : 'border-transparent text-zinc-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Leaderboard Table */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="py-16 text-center text-zinc-400 space-y-2">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-cyan-400" />
              <div className="text-sm font-bold">Đang kết nối máy chủ bảng xếp hạng...</div>
            </div>
          ) : error ? (
            <div className="py-16 text-center text-red-400 space-y-2">
              <div className="text-base font-bold">{error}</div>
              <button
                onClick={() => fetchLeaderboard(activeTab)}
                className="px-4 py-2 bg-zinc-800 text-white rounded-xl text-xs font-bold"
              >
                Thử lại
              </button>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="py-16 text-center text-zinc-400 space-y-2">
              <Flame className="w-8 h-8 mx-auto text-zinc-600" />
              <div className="text-sm font-bold">Chưa có tay đua nào trong khoảng thời gian này!</div>
              <p className="text-xs text-zinc-500">Hãy là người đầu tiên ghi danh trên bảng vàng!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((row) => {
                const isMe = row.playerId === saveData.playerId;

                let rankBadge = (
                  <span className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-400">
                    {row.rank}
                  </span>
                );

                if (row.rank === 1) {
                  rankBadge = (
                    <span className="w-7 h-7 rounded-full bg-amber-500 text-black flex items-center justify-center font-black text-xs shadow-lg shadow-amber-500/30">
                      🥇
                    </span>
                  );
                } else if (row.rank === 2) {
                  rankBadge = (
                    <span className="w-7 h-7 rounded-full bg-slate-300 text-black flex items-center justify-center font-black text-xs">
                      🥈
                    </span>
                  );
                } else if (row.rank === 3) {
                  rankBadge = (
                    <span className="w-7 h-7 rounded-full bg-amber-700 text-white flex items-center justify-center font-black text-xs">
                      🥉
                    </span>
                  );
                }

                return (
                  <div
                    key={row.id}
                    className={`p-3.5 rounded-2xl border transition flex items-center justify-between ${
                      isMe
                        ? 'bg-cyan-950/40 border-cyan-400 shadow-md shadow-cyan-500/10'
                        : 'bg-zinc-900/50 border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center space-x-3.5 flex-1 min-w-0 pr-3">
                      {rankBadge}
                      <div className="truncate">
                        <div className="flex items-center space-x-2">
                          <span className={`font-black text-sm ${isMe ? 'text-cyan-300' : 'text-white'}`}>
                            {row.playerName}
                          </span>
                          {isMe && (
                            <span className="text-[9px] bg-cyan-500 text-black font-extrabold px-1.5 py-0.2 rounded">
                              BẠN
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-400 flex items-center space-x-2 mt-0.5">
                          <span>{row.carName}</span>
                          <span>•</span>
                          <span>{row.distanceM}m</span>
                          <span>•</span>
                          <span>{row.nearMissCount} Near Miss</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-base sm:text-lg font-black text-amber-400">
                        {row.score.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-zinc-500">ĐIỂM SỐ</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer: Current Player Position */}
        <div className="px-6 py-3 border-t border-white/10 bg-zinc-900/70 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs">
            <User className="w-4 h-4 text-cyan-400" />
            <span className="text-zinc-400">Hạng của bạn:</span>
            <span className="font-black text-white">
              {playerRank ? `#${playerRank}` : 'Chưa có lượt đua'}
            </span>
          </div>

          <div className="text-xs text-zinc-400">
            Kỷ lục cá nhân: <span className="font-bold text-cyan-400">{saveData.highScore.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
