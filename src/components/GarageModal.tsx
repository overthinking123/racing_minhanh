/**
 * City Rush 3D - Garage & Customization Workshop (Update V2)
 * Supports 8 distinct vehicles (Compact to Hypercar), performance upgrades,
 * paint swatches, rims, and aerodynamic spoilers.
 */

import React, { useState } from 'react';
import { X, Check, Lock, ChevronLeft, ChevronRight, Gauge, Zap, Disc, Wrench, Sparkles, Coins } from 'lucide-react';
import { CarDefinition, CarUpgradeLevels, SaveData } from '../game/types';
import { CAR_CATALOG, UPGRADE_MAX_LEVEL, getUpgradeCost, computeEffectiveStats } from '../game/rules';
import { soundEngine } from '../game/audio';
import { GarageCarViewer } from './GarageCarViewer';

interface GarageModalProps {
  saveData: SaveData;
  onUpdateSave: (updater: (prev: SaveData) => SaveData) => void;
  onClose: () => void;
}

type VehicleCategoryFilter = 'all' | 'car' | 'moto' | 'bicycle';

export const GarageModal: React.FC<GarageModalProps> = ({ saveData, onUpdateSave, onClose }) => {
  const [categoryFilter, setCategoryFilter] = useState<VehicleCategoryFilter>('all');
  const [selectedIdx, setSelectedIdx] = useState<number>(() => {
    const idx = CAR_CATALOG.findIndex((c) => c.id === saveData.selectedCarId);
    return idx >= 0 ? idx : 0;
  });

  const [activeTab, setActiveTab] = useState<'specs' | 'upgrades' | 'custom'>('specs');

  const currentCar: CarDefinition = CAR_CATALOG[selectedIdx] || CAR_CATALOG[0];
  const isUnlocked = saveData.unlockedCars.includes(currentCar.id);
  const isSelected = saveData.selectedCarId === currentCar.id;

  const currentUpgrades = saveData.carUpgrades[currentCar.id] || { engine: 0, brakes: 0, handling: 0, nitro: 0 };
  const currentCustom = saveData.carCustomizations[currentCar.id] || {
    color: currentCar.colors[0],
    spoiler: false,
    rimColor: '#cbd5e1',
  };

  const effectiveStats = computeEffectiveStats(currentCar.baseStats, currentUpgrades);

  const filteredCars = CAR_CATALOG.filter((c) => {
    if (categoryFilter === 'all') return true;
    if (categoryFilter === 'car') return !c.id.startsWith('moto_') && c.id !== 'bicycle';
    if (categoryFilter === 'moto') return c.id.startsWith('moto_');
    if (categoryFilter === 'bicycle') return c.id === 'bicycle';
    return true;
  });

  const currentFilteredIdx = filteredCars.findIndex((c) => c.id === currentCar.id);

  const handlePrevCar = () => {
    soundEngine.playClick();
    const nextFilteredIdx = currentFilteredIdx > 0 ? currentFilteredIdx - 1 : filteredCars.length - 1;
    const targetCar = filteredCars[nextFilteredIdx];
    const globalIdx = CAR_CATALOG.findIndex((c) => c.id === targetCar?.id);
    setSelectedIdx(globalIdx >= 0 ? globalIdx : 0);
  };

  const handleNextCar = () => {
    soundEngine.playClick();
    const nextFilteredIdx = currentFilteredIdx < filteredCars.length - 1 ? currentFilteredIdx + 1 : 0;
    const targetCar = filteredCars[nextFilteredIdx];
    const globalIdx = CAR_CATALOG.findIndex((c) => c.id === targetCar?.id);
    setSelectedIdx(globalIdx >= 0 ? globalIdx : 0);
  };

  const handleSelectCar = () => {
    soundEngine.playClick();
    onUpdateSave((prev) => ({
      ...prev,
      selectedCarId: currentCar.id,
    }));
  };

  const handleBuyCar = () => {
    if (saveData.coins < currentCar.price) return;
    soundEngine.playNearMissDing();
    onUpdateSave((prev) => ({
      ...prev,
      coins: prev.coins - currentCar.price,
      unlockedCars: [...prev.unlockedCars, currentCar.id],
      selectedCarId: currentCar.id,
    }));
  };

  const handleUpgrade = (type: keyof CarUpgradeLevels) => {
    const cost = getUpgradeCost(type, currentUpgrades[type]);
    if (saveData.coins < cost || currentUpgrades[type] >= UPGRADE_MAX_LEVEL) return;

    soundEngine.playNearMissDing();
    onUpdateSave((prev) => {
      const existing = prev.carUpgrades[currentCar.id] || { engine: 0, brakes: 0, handling: 0, nitro: 0 };
      return {
        ...prev,
        coins: prev.coins - cost,
        carUpgrades: {
          ...prev.carUpgrades,
          [currentCar.id]: {
            ...existing,
            [type]: existing[type] + 1,
          },
        },
      };
    });
  };

  const handleSetColor = (color: string) => {
    soundEngine.playClick();
    onUpdateSave((prev) => ({
      ...prev,
      carCustomizations: {
        ...prev.carCustomizations,
        [currentCar.id]: {
          ...currentCustom,
          color,
        },
      },
    }));
  };

  const handleSetRimColor = (rimColor: string) => {
    soundEngine.playClick();
    onUpdateSave((prev) => ({
      ...prev,
      carCustomizations: {
        ...prev.carCustomizations,
        [currentCar.id]: {
          ...currentCustom,
          rimColor,
        },
      },
    }));
  };

  const handleToggleSpoiler = () => {
    soundEngine.playClick();
    onUpdateSave((prev) => ({
      ...prev,
      carCustomizations: {
        ...prev.carCustomizations,
        [currentCar.id]: {
          ...currentCustom,
          spoiler: !currentCustom.spoiler,
        },
      },
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-none font-racing">
      <div className="relative w-full max-w-4xl bg-zinc-950 border border-white/20 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-zinc-900/60">
          <div className="flex items-center space-x-3">
            <Wrench className="w-6 h-6 text-cyan-400" />
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-wider">GARAGE & BỘ SƯU TẬP PHƯƠNG TIỆN (18 MẪU XE)</h2>
              <p className="text-xs text-zinc-400">Tùy biến diện mạo, màu sơn, mâm xe và nâng cấp công suất</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-amber-500/10 border border-amber-500/30 px-3.5 py-1.5 rounded-xl text-amber-400 font-bold text-sm">
              <Coins className="w-4 h-4" />
              <span>{saveData.coins.toLocaleString()} XU</span>
            </div>

            <button
              onClick={() => {
                soundEngine.playClick();
                onClose();
              }}
              className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition"
              aria-label="Đóng garage"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column: Car Showcase (5 cols) */}
          <div className="md:col-span-5 flex flex-col justify-between bg-zinc-900/40 border border-white/10 rounded-2xl p-4">
            {/* Category Filter Tabs */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-black/60 border border-white/10 rounded-xl mb-3 text-[10px] sm:text-xs font-bold">
              {[
                { id: 'all', label: 'TẤT CẢ (18)' },
                { id: 'car', label: 'Ô TÔ (10)' },
                { id: 'moto', label: 'MÔ TÔ (7)' },
                { id: 'bicycle', label: 'XE ĐẠP (1)' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    soundEngine.playClick();
                    setCategoryFilter(tab.id as VehicleCategoryFilter);
                    const subset = CAR_CATALOG.filter((c) => {
                      if (tab.id === 'all') return true;
                      if (tab.id === 'car') return !c.id.startsWith('moto_') && c.id !== 'bicycle';
                      if (tab.id === 'moto') return c.id.startsWith('moto_');
                      if (tab.id === 'bicycle') return c.id === 'bicycle';
                      return true;
                    });
                    if (subset.length > 0 && !subset.some((c) => c.id === currentCar.id)) {
                      const firstIdx = CAR_CATALOG.findIndex((c) => c.id === subset[0].id);
                      setSelectedIdx(firstIdx >= 0 ? firstIdx : 0);
                    }
                  }}
                  className={`py-1.5 rounded-lg text-center transition ${
                    categoryFilter === tab.id
                      ? 'bg-cyan-500 text-black font-black shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Carousel Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={handlePrevCar}
                className="p-2 bg-black/60 hover:bg-white/10 border border-white/15 rounded-xl text-white transition"
                aria-label="Xe trước"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div className="text-center">
                <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest">{currentCar.category} ({selectedIdx + 1}/{CAR_CATALOG.length})</span>
                <h3 className="text-lg font-black text-white">{currentCar.vietnameseName}</h3>
                <div className="text-xs text-zinc-400">{currentCar.name}</div>
              </div>
              <button
                onClick={handleNextCar}
                className="p-2 bg-black/60 hover:bg-white/10 border border-white/15 rounded-xl text-white transition"
                aria-label="Xe tiếp theo"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Interactive 3D Car Showcase Viewport (Orbit 360 drag, zoom, real-time colors & spoiler) */}
            <GarageCarViewer
              carId={currentCar.id}
              color={currentCustom.color}
              spoiler={currentCustom.spoiler}
              rimColor={currentCustom.rimColor}
              isUnlocked={isUnlocked}
              price={currentCar.price}
            />

            <div className="text-center my-1">
              <div className="text-xs text-zinc-400 max-w-sm mx-auto line-clamp-2 px-1">{currentCar.description}</div>
            </div>

            {/* Select or Buy Button */}
            <div className="mt-4">
              {isUnlocked ? (
                <button
                  onClick={handleSelectCar}
                  disabled={isSelected}
                  className={`w-full py-3 rounded-xl font-bold text-sm tracking-wider flex items-center justify-center space-x-2 transition ${
                    isSelected
                      ? 'bg-zinc-800 text-zinc-400 cursor-default'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-lg shadow-cyan-500/20'
                  }`}
                >
                  {isSelected ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>ĐANG SỬ DỤNG</span>
                    </>
                  ) : (
                    <span>CHỌN LÁI XE NÀY</span>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleBuyCar}
                  disabled={saveData.coins < currentCar.price}
                  className={`w-full py-3 rounded-xl font-bold text-sm tracking-wider flex items-center justify-center space-x-2 transition ${
                    saveData.coins >= currentCar.price
                      ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  <Coins className="w-4 h-4" />
                  <span>MUA XE ({currentCar.price.toLocaleString()} XU)</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Tabs (Specs, Upgrades, Customization) (7 cols) */}
          <div className="md:col-span-7 flex flex-col">
            <div className="flex border-b border-white/10 mb-4">
              <button
                onClick={() => {
                  soundEngine.playClick();
                  setActiveTab('specs');
                }}
                className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
                  activeTab === 'specs'
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-zinc-400 hover:text-white'
                }`}
              >
                Thông Số Xe
              </button>
              <button
                onClick={() => {
                  soundEngine.playClick();
                  setActiveTab('upgrades');
                }}
                className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
                  activeTab === 'upgrades'
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-zinc-400 hover:text-white'
                }`}
              >
                Nâng Cấp Hiệu Năng
              </button>
              <button
                onClick={() => {
                  soundEngine.playClick();
                  setActiveTab('custom');
                }}
                className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
                  activeTab === 'custom'
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-zinc-400 hover:text-white'
                }`}
              >
                Sơn & Cánh Gió
              </button>
            </div>

            {/* Tab 1: Specs */}
            {activeTab === 'specs' && (
              <div className="space-y-4">
                <div className="bg-zinc-900/50 p-4 rounded-2xl border border-white/5 space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-bold text-zinc-300 mb-1">
                      <span className="flex items-center text-cyan-400">
                        <Gauge className="w-4 h-4 mr-1.5" /> TỐC ĐỘ TỐI ĐA
                      </span>
                      <span>{effectiveStats.topSpeedKmh} KM/H</span>
                    </div>
                    <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-400 rounded-full"
                        style={{ width: `${(effectiveStats.topSpeedKmh / 350) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-zinc-300 mb-1">
                      <span className="flex items-center text-amber-400">
                        <Zap className="w-4 h-4 mr-1.5" /> GIA TỐC
                      </span>
                      <span>{effectiveStats.acceleration} / 16.0</span>
                    </div>
                    <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full"
                        style={{ width: `${(effectiveStats.acceleration / 16.0) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-zinc-300 mb-1">
                      <span className="flex items-center text-red-400">
                        <Disc className="w-4 h-4 mr-1.5" /> LỰC PHANH
                      </span>
                      <span>{effectiveStats.braking} / 14.0</span>
                    </div>
                    <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-400 rounded-full"
                        style={{ width: `${(effectiveStats.braking / 14.0) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-zinc-300 mb-1">
                      <span className="flex items-center text-emerald-400">
                        <Sparkles className="w-4 h-4 mr-1.5" /> ĐỘ BÁM ĐƯỜNG & LÁI
                      </span>
                      <span>{effectiveStats.handling} / 13.0</span>
                    </div>
                    <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 rounded-full"
                        style={{ width: `${(effectiveStats.handling / 13.0) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Performance Upgrades */}
            {activeTab === 'upgrades' && (
              <div className="space-y-3">
                {(['engine', 'brakes', 'handling', 'nitro'] as const).map((upgradeKey) => {
                  const level = currentUpgrades[upgradeKey] || 0;
                  const cost = getUpgradeCost(upgradeKey, level);
                  const isMax = level >= UPGRADE_MAX_LEVEL;
                  const canAfford = saveData.coins >= cost && !isMax;

                  const titles = {
                    engine: 'ĐỘNG CƠ TĂNG ÁP',
                    brakes: 'HỆ THỐNG PHANH GỐM',
                    handling: 'HỆ THỐNG LÁI & TREO',
                    nitro: 'BÌNH NITRO CAO CẤP',
                  };

                  return (
                    <div
                      key={upgradeKey}
                      className="flex items-center justify-between bg-zinc-900/60 border border-white/10 p-3 rounded-2xl"
                    >
                      <div className="flex-1 mr-3">
                        <div className="flex items-center justify-between text-xs font-bold mb-1">
                          <span className="text-white">{titles[upgradeKey]}</span>
                          <span className="text-cyan-400 font-extrabold">CẤP {level}/{UPGRADE_MAX_LEVEL}</span>
                        </div>
                        <div className="flex space-x-1">
                          {Array.from({ length: UPGRADE_MAX_LEVEL }).map((_, i) => (
                            <div
                              key={i}
                              className={`h-2 flex-1 rounded-sm ${
                                i < level ? 'bg-cyan-400' : 'bg-zinc-800'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => handleUpgrade(upgradeKey)}
                        disabled={!canAfford}
                        className={`px-4 py-2 rounded-xl text-xs font-black tracking-wider transition ${
                          isMax
                            ? 'bg-zinc-800 text-zinc-500 cursor-default'
                            : canAfford
                            ? 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black shadow-md'
                            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                        }`}
                      >
                        {isMax ? 'MAX' : `${cost.toLocaleString()} XU`}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tab 3: Customization */}
            {activeTab === 'custom' && (
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">Màu Sơn Thân Xe</div>
                  <div className="flex flex-wrap gap-2.5">
                    {currentCar.colors.map((c) => (
                      <button
                        key={c}
                        onClick={() => handleSetColor(c)}
                        className={`w-9 h-9 rounded-xl border-2 transition ${
                          currentCustom.color === c ? 'border-white scale-110 shadow-lg' : 'border-black/50 hover:border-white/50'
                        }`}
                        style={{ backgroundColor: c }}
                        aria-label={`Màu ${c}`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">Màu Mâm Xe Hợp Kim</div>
                  <div className="flex flex-wrap gap-2.5">
                    {['#cbd5e1', '#18181b', '#d97706', '#9333ea', '#dc2626'].map((rc) => (
                      <button
                        key={rc}
                        onClick={() => handleSetRimColor(rc)}
                        className={`w-9 h-9 rounded-xl border-2 transition ${
                          currentCustom.rimColor === rc ? 'border-cyan-400 scale-110 shadow-lg' : 'border-black/50 hover:border-white/50'
                        }`}
                        style={{ backgroundColor: rc }}
                        aria-label={`Mâm ${rc}`}
                      />
                    ))}
                  </div>
                </div>

                {currentCar.hasSpoilerOption && (
                  <div className="flex items-center justify-between bg-zinc-900/60 p-3 rounded-2xl border border-white/10">
                    <div>
                      <div className="text-xs font-bold text-white uppercase">Cánh Gió Khí Động Học (Spoiler)</div>
                      <div className="text-[11px] text-zinc-400">Tăng lực ép mặt đường và thẩm mỹ thể thao</div>
                    </div>
                    <button
                      onClick={handleToggleSpoiler}
                      className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wider transition ${
                        currentCustom.spoiler
                          ? 'bg-emerald-500 text-black font-extrabold'
                          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                      }`}
                    >
                      {currentCustom.spoiler ? 'ĐANG LẮP' : 'GỠ BỎ'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
