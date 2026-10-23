/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine, NearMissEvent } from './game/GameEngine';
import { GameMode, EnvironmentType, PlayerStats, SaveData, CareerMission, GameSettings } from './game/types';
import { loadSaveData, saveGameData } from './utils/storage';
import { CAREER_MISSIONS, CAR_CATALOG, isDrivingWrongWay } from './game/rules';
import { soundEngine } from './game/audio';

import { MainMenu } from './components/MainMenu';
import { HUD } from './components/HUD';
import { GarageModal } from './components/GarageModal';
import { GameOverModal } from './components/GameOverModal';
import { CareerModal } from './components/CareerModal';
import { SettingsModal } from './components/SettingsModal';
import { UnityExportModal } from './components/UnityExportModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { DailyRewardsModal } from './components/DailyRewardsModal';
import { Play, RotateCcw, Sliders, Home } from 'lucide-react';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const currentRunToken = useRef<string | null>(null);

  // Persistence State
  const [saveData, setSaveData] = useState<SaveData>(() => loadSaveData());

  // UI Flow States
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'game_over'>('menu');
  const [activeModal, setActiveModal] = useState<
    'garage' | 'career' | 'settings' | 'unity' | 'leaderboard' | 'daily_rewards' | null
  >(null);

  // Real-time In-game Stats
  const [stats, setStats] = useState<PlayerStats>({
    speedKmh: 0,
    distanceM: 0,
    score: 0,
    coins: 0,
    nearMissCount: 0,
    overtakeCount: 0,
    wrongWayDurationSec: 0,
    highSpeedDurationSec: 0,
    nightDriveDurationSec: 0,
    combo: 0,
    comboTimer: 0,
    nitroRemaining: 100,
    timeRemainingSec: 60,
    isGameOver: false,
  });

  const [cameraMode, setCameraMode] = useState<'chase' | 'cockpit'>('chase');
  const [headlightsOn, setHeadlightsOn] = useState(true);
  const [nearMissEvents, setNearMissEvents] = useState<NearMissEvent[]>([]);
  const [lastGameOverSummary, setLastGameOverSummary] = useState<{
    stats: PlayerStats;
    earnings: { totalCoins: number; breakdown: { distanceCoins: number; nearMissCoins: number; wrongWayCoins: number } };
  } | null>(null);

  // Mobile portrait orientation state
  const [isPortrait, setIsPortrait] = useState(() => {
    return typeof window !== 'undefined' && window.innerHeight > window.innerWidth && window.innerWidth < 768;
  });
  const [dismissedPortraitWarning, setDismissedPortraitWarning] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth && window.innerWidth < 768);
    };
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  // Sync audio volumes from saved settings & autostart query param support
  useEffect(() => {
    soundEngine.setVolumes(
      saveData.settings.masterVolume,
      saveData.settings.engineVolume,
      saveData.settings.sfxVolume
    );

    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      const timer = setTimeout(() => {
        handleStartGame();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleUpdateSave = useCallback((updater: (prev: SaveData) => SaveData) => {
    setSaveData((prev) => {
      const next = updater(prev);
      saveGameData(next);
      return next;
    });
  }, []);

  const handleNearMiss = useCallback((event: NearMissEvent) => {
    setNearMissEvents((prev) => [...prev.slice(-2), event]);
    setTimeout(() => {
      setNearMissEvents((prev) => prev.filter((e) => e.id !== event.id));
    }, 1800);
  }, []);

  // Submit score to real online backend
  const submitScoreToOnlineLeaderboard = async (finalStats: PlayerStats) => {
    try {
      const currentCar = CAR_CATALOG.find((c) => c.id === saveData.selectedCarId);
      await fetch('/api/leaderboard/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          runToken: currentRunToken.current,
          playerId: saveData.playerId,
          playerName: saveData.playerName,
          score: finalStats.score,
          distanceM: finalStats.distanceM,
          carId: saveData.selectedCarId,
          carName: currentCar?.vietnameseName || 'Hatchback',
          nearMissCount: finalStats.nearMissCount,
        }),
      });
      currentRunToken.current = null;
    } catch (e) {
      console.warn('Failed to submit score to online server:', e);
    }
  };

  // Check and reward career & daily missions
  const evaluateMissions = useCallback((finalStats: PlayerStats) => {
    handleUpdateSave((prev) => {
      const completed = [...prev.completedMissions];
      let newCoins = prev.coins;

      // Career missions check
      CAREER_MISSIONS.forEach((m) => {
        if (completed.includes(m.id)) return;

        let pass = false;
        if (m.targetType === 'distance' && finalStats.distanceM >= m.targetValue) pass = true;
        else if (m.targetType === 'top_speed' && finalStats.speedKmh >= m.targetValue) pass = true;
        else if (m.targetType === 'near_miss' && finalStats.nearMissCount >= m.targetValue) pass = true;
        else if (m.targetType === 'wrong_way' && finalStats.wrongWayDurationSec >= m.targetValue) pass = true;
        else if (m.targetType === 'score' && finalStats.score >= m.targetValue) pass = true;

        if (pass) {
          completed.push(m.id);
          newCoins += m.rewardCoins;
        }
      });

      // Daily missions progress accumulation
      const dailyMap = { ...prev.dailyMissionProgress };

      const updateProg = (id: string, amount: number) => {
        const cur = dailyMap[id] || { progress: 0, claimed: false };
        dailyMap[id] = { ...cur, progress: cur.progress + amount };
      };

      updateProg('dm-dist', finalStats.distanceM);
      updateProg('dm-overtake', finalStats.overtakeCount);
      if (finalStats.speedKmh >= 150) updateProg('dm-speed', 150);
      updateProg('dm-night', Math.floor(finalStats.nightDriveDurationSec));
      updateProg('dm-nearmiss', finalStats.nearMissCount);
      if (finalStats.score >= 1500) updateProg('dm-score', finalStats.score);

      return {
        ...prev,
        coins: newCoins,
        completedMissions: completed,
        dailyMissionProgress: dailyMap,
      };
    });
  }, [handleUpdateSave]);

  const handleGameOver = useCallback((summary: {
    stats: PlayerStats;
    earnings: { totalCoins: number; breakdown: { distanceCoins: number; nearMissCoins: number; wrongWayCoins: number } };
  }) => {
    setLastGameOverSummary(summary);
    setGameState('game_over');

    handleUpdateSave((prev) => ({
      ...prev,
      coins: prev.coins + summary.earnings.totalCoins,
      highScore: Math.max(prev.highScore, summary.stats.score),
    }));

    evaluateMissions(summary.stats);
    submitScoreToOnlineLeaderboard(summary.stats);
  }, [handleUpdateSave, evaluateMissions, saveData]);

  // Initialize Three.js Game Engine once on mount
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const engine = new GameEngine(canvasMountRef.current, saveData, {
      onStatsUpdate: (newStats) => {
        setStats(newStats);
      },
      onNearMiss: handleNearMiss,
      onCameraToggle: (mode) => {
        setCameraMode(mode);
      },
      onHeadlightsToggle: (on) => {
        setHeadlightsOn(on);
      },
      onGameOver: handleGameOver,
    });

    engineRef.current = engine;

    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      engine.startRound(saveData.selectedMode, saveData.selectedEnvironment, saveData.selectedCarId, saveData);
      setGameState('playing');
    }

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  const handleStartGame = async () => {
    if (!engineRef.current) return;

    // Start validated online run session
    try {
      const res = await fetch('/api/run/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: saveData.playerId, playerName: saveData.playerName }),
      });
      if (res.ok) {
        const data = await res.json();
        currentRunToken.current = data.runToken;
      }
    } catch {}

    engineRef.current.startRound(
      saveData.selectedMode,
      saveData.selectedEnvironment,
      saveData.selectedCarId,
      saveData
    );
    setGameState('playing');
  };

  const handlePause = () => {
    if (!engineRef.current) return;
    engineRef.current.pause();
    setGameState('paused');
  };

  const handleResume = () => {
    if (!engineRef.current) return;
    engineRef.current.resume();
    setGameState('playing');
  };

  const handleRestartGame = () => {
    handleStartGame();
  };

  const handleToggleCamera = () => {
    if (!engineRef.current) return;
    engineRef.current.toggleCamera();
  };

  const handleToggleHeadlights = () => {
    if (!engineRef.current) return;
    const newState = engineRef.current.toggleHeadlights();
    setHeadlightsOn(newState);
  };

  const handleFlashHeadlights = () => {
    if (!engineRef.current) return;
    engineRef.current.flashHeadlights();
    setHeadlightsOn(true);
  };

  const handleHonk = () => {
    if (!engineRef.current) return;
    engineRef.current.honkHorn();
  };

  const handleTouchInput = (key: 'accelerate' | 'brake' | 'steerLeft' | 'steerRight' | 'nitro', active: boolean) => {
    if (!engineRef.current) return;
    engineRef.current.setTouchInput(key, active);
  };

  const handleSelectMode = (mode: GameMode) => {
    handleUpdateSave((prev) => ({ ...prev, selectedMode: mode }));
  };

  const handleSelectEnvironment = (env: EnvironmentType) => {
    handleUpdateSave((prev) => ({ ...prev, selectedEnvironment: env }));
  };

  const handleUnlockEnvironment = (env: EnvironmentType, cost: number) => {
    if (saveData.coins < cost) return;
    soundEngine.playNearMissDing();
    handleUpdateSave((prev) => ({
      ...prev,
      coins: prev.coins - cost,
      unlockedEnvironments: [...prev.unlockedEnvironments, env],
      selectedEnvironment: env,
    }));
  };

  const handleSelectMission = (mission: CareerMission) => {
    handleUpdateSave((prev) => ({
      ...prev,
      selectedMode: mission.mode,
      selectedEnvironment: mission.environment,
    }));
    setActiveModal(null);
    if (engineRef.current) {
      engineRef.current.startRound(
        mission.mode,
        mission.environment,
        saveData.selectedCarId,
        saveData
      );
      setGameState('playing');
    }
  };

  const isWrongWayActive = isDrivingWrongWay(
    engineRef.current?.vehicleController?.position.x ?? 0,
    saveData.selectedMode
  );

  return (
    <div
      className="relative w-screen h-screen overflow-hidden bg-black text-white touch-none select-none"
      data-state={gameState}
    >
      {/* Mobile Portrait Orientation Prompt */}
      {isPortrait && !dismissedPortraitWarning && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 flex items-center space-x-2 bg-zinc-900/95 border border-cyan-400/80 text-cyan-200 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-2xl backdrop-blur-md animate-fade-in pointer-events-auto">
          <span className="text-sm">📱</span>
          <span>Khuyên dùng: Xoay ngang màn hình để đua mượt hơn</span>
          <button
            onClick={() => setDismissedPortraitWarning(true)}
            className="ml-1 w-4 h-4 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 text-[10px]"
            aria-label="Đóng thông báo xoay màn hình"
          >
            ✕
          </button>
        </div>
      )}

      {/* 3D WebGL Canvas Viewport */}
      <div
        ref={canvasMountRef}
        className="absolute inset-0 z-0 w-full h-full cursor-grab active:cursor-grabbing touch-none"
      />

      {/* Screen 1: Main Menu */}
      {gameState === 'menu' && (
        <MainMenu
          saveData={saveData}
          onStartGame={handleStartGame}
          onSelectMode={handleSelectMode}
          onSelectEnvironment={handleSelectEnvironment}
          onOpenGarage={() => setActiveModal('garage')}
          onOpenCareer={() => setActiveModal('career')}
          onOpenDailyRewards={() => setActiveModal('daily_rewards')}
          onOpenLeaderboard={() => setActiveModal('leaderboard')}
          onOpenSettings={() => setActiveModal('settings')}
          onOpenUnityCode={() => setActiveModal('unity')}
          onUnlockEnvironment={handleUnlockEnvironment}
        />
      )}

      {/* Screen 2: In-Game Racing HUD */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <HUD
          stats={stats}
          mode={saveData.selectedMode}
          cameraMode={cameraMode}
          headlightsOn={headlightsOn}
          nearMissEvents={nearMissEvents}
          isWrongWay={isWrongWayActive}
          onPause={handlePause}
          onToggleCamera={handleToggleCamera}
          onToggleHeadlights={handleToggleHeadlights}
          onFlashHeadlights={handleFlashHeadlights}
          onHonk={handleHonk}
          onTouchInput={handleTouchInput}
        />
      )}

      {/* Pause Overlay (with Settings access directly from Pause Menu!) */}
      {gameState === 'paused' && activeModal === null && (
        <div className="absolute inset-0 z-40 bg-black/85 flex items-center justify-center p-4 font-racing select-none animate-fade-in">
          <div className="bg-zinc-950 border border-white/20 p-6 sm:p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl space-y-4">
            <div>
              <h3 className="text-3xl font-black text-white tracking-wider">TẠM DỪNG</h3>
              <p className="text-xs text-zinc-400 mt-1">Trò chơi đang dừng. Nghỉ ngơi hoặc điều chỉnh cài đặt.</p>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={handleResume}
                className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-black text-sm rounded-xl transition flex items-center justify-center space-x-2 shadow-lg shadow-cyan-500/20"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>TIẾP TỤC ĐUA</span>
              </button>

              <button
                onClick={() => {
                  soundEngine.playClick();
                  setActiveModal('settings');
                }}
                className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-white font-bold text-xs rounded-xl transition flex items-center justify-center space-x-2"
              >
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>CÀI ĐẶT TRONG GAME</span>
              </button>

              <button
                onClick={handleRestartGame}
                className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-white font-bold text-xs rounded-xl transition flex items-center justify-center space-x-2"
              >
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <span>ĐUA LẠI TỪ ĐẦU</span>
              </button>

              <button
                onClick={() => {
                  soundEngine.playClick();
                  engineRef.current?.stop();
                  setGameState('menu');
                }}
                className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-400 hover:text-white font-bold text-xs rounded-xl transition flex items-center justify-center space-x-2"
              >
                <Home className="w-4 h-4" />
                <span>VỀ MENU CHÍNH</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Screen 3: Game Over & Results Screen */}
      {gameState === 'game_over' && lastGameOverSummary && (
        <GameOverModal
          stats={lastGameOverSummary.stats}
          earnings={lastGameOverSummary.earnings}
          saveData={saveData}
          onRestart={handleStartGame}
          onOpenGarage={() => {
            setGameState('menu');
            setActiveModal('garage');
          }}
          onBackToMenu={() => setGameState('menu')}
        />
      )}

      {/* Modal Overlays */}
      {activeModal === 'garage' && (
        <GarageModal
          saveData={saveData}
          onUpdateSave={handleUpdateSave}
          onClose={() => {
            setActiveModal(null);
            if (engineRef.current) {
              const carDef = CAR_CATALOG.find((c) => c.id === saveData.selectedCarId) || CAR_CATALOG[0];
              engineRef.current.vehicleController.rebuildCar(
                carDef,
                saveData.carUpgrades[saveData.selectedCarId],
                saveData.carCustomizations[saveData.selectedCarId]
              );
            }
          }}
        />
      )}

      {activeModal === 'daily_rewards' && (
        <DailyRewardsModal
          saveData={saveData}
          onCoinsAwarded={(coins) => {
            handleUpdateSave((prev) => ({ ...prev, coins: prev.coins + coins }));
          }}
          onUpdateDailyMissionClaim={(missionId, rewardCoins) => {
            handleUpdateSave((prev) => {
              const cur = prev.dailyMissionProgress[missionId] || { progress: 0, claimed: false };
              return {
                ...prev,
                coins: prev.coins + rewardCoins,
                dailyMissionProgress: {
                  ...prev.dailyMissionProgress,
                  [missionId]: { ...cur, claimed: true },
                },
              };
            });
          }}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'leaderboard' && (
        <LeaderboardModal
          saveData={saveData}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'career' && (
        <CareerModal
          saveData={saveData}
          onSelectMission={handleSelectMission}
          onClaimReward={(missionId, reward) => {
            handleUpdateSave((prev) => ({
              ...prev,
              coins: prev.coins + reward,
              completedMissions: [...prev.completedMissions, missionId],
            }));
          }}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'settings' && (
        <SettingsModal
          saveData={saveData}
          onUpdateSettings={(updater) => {
            handleUpdateSave((prev) => {
              const nextSettings = updater(prev.settings);
              if (engineRef.current) {
                engineRef.current.updateSettings({ ...prev, settings: nextSettings });
              }
              return {
                ...prev,
                settings: nextSettings,
              };
            });
          }}
          onUpdatePlayerName={(name) => {
            handleUpdateSave((prev) => ({ ...prev, playerName: name }));
          }}
          onClose={() => {
            // If we opened settings from pause menu, closing settings keeps us paused!
            setActiveModal(null);
          }}
        />
      )}

      {activeModal === 'unity' && (
        <UnityExportModal onClose={() => setActiveModal(null)} />
      )}
    </div>
  );
}
