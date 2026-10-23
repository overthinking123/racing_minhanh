/**
 * City Rush 3D - Save & Load System
 */

import { DEFAULT_SAVE_DATA } from '../game/rules';
import { SaveData } from '../game/types';

const STORAGE_KEY = 'city_rush_3d_save_v1';

export function loadSaveData(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SAVE_DATA };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SAVE_DATA,
      ...parsed,
      settings: {
        ...DEFAULT_SAVE_DATA.settings,
        ...(parsed.settings || {}),
      },
      carUpgrades: {
        ...DEFAULT_SAVE_DATA.carUpgrades,
        ...(parsed.carUpgrades || {}),
      },
      carCustomizations: {
        ...DEFAULT_SAVE_DATA.carCustomizations,
        ...(parsed.carCustomizations || {}),
      },
    };
  } catch (e) {
    console.warn('Failed to parse save data, falling back to defaults:', e);
    return { ...DEFAULT_SAVE_DATA };
  }
}

export function saveGameData(data: SaveData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save game data:', e);
  }
}
