/**
 * City Rush 3D - Types and Interfaces (Update V2)
 */

export type CarId =
  | 'compact'
  | 'sedan'
  | 'luxury_sedan'
  | 'suv'
  | 'pickup'
  | 'muscle'
  | 'coupe'
  | 'rally'
  | 'supercar'
  | 'hypercar';

export interface CarStats {
  topSpeedKmh: number;   // Max speed in km/h
  acceleration: number;  // Accel factor
  braking: number;       // Brake deceleration factor
  handling: number;      // Lateral turn agility
  nitroPower: number;    // Boost multiplier
}

export interface CarDefinition {
  id: CarId;
  name: string;
  vietnameseName: string;
  category: string;
  price: number;
  unlockedByDefault: boolean;
  baseStats: CarStats;
  description: string;
  colors: string[];
  hasSpoilerOption: boolean;
}

export interface CarUpgradeLevels {
  engine: number;    // 0 to 5
  brakes: number;    // 0 to 5
  handling: number;  // 0 to 5
  nitro: number;     // 0 to 5
}

export interface CarCustomization {
  color: string;
  spoiler: boolean;
  rimColor: string;
}

export type GameMode = 'one_way' | 'two_way' | 'time_attack' | 'free_ride' | 'career';

export type EnvironmentType = 'city' | 'highway' | 'night' | 'coastal';

export interface EnvironmentDefinition {
  id: EnvironmentType;
  name: string;
  vietnameseName: string;
  skyColor: string;
  fogColor: string;
  groundColor: string;
  timeOfDay: 'day' | 'sunset' | 'night';
  description: string;
  unlockedByDefault: boolean;
  unlockCost: number;
}

export interface PlayerStats {
  speedKmh: number;
  distanceM: number;
  score: number;
  coins: number;
  nearMissCount: number;
  overtakeCount: number;
  wrongWayDurationSec: number;
  highSpeedDurationSec: number;
  nightDriveDurationSec: number;
  combo: number;
  comboTimer: number;
  nitroRemaining: number; // 0 to 100
  timeRemainingSec: number; // For Time Attack
  isGameOver: boolean;
  gameOverReason?: 'crash' | 'time_up';
}

export interface CareerMission {
  id: string;
  title: string;
  description: string;
  mode: GameMode;
  environment: EnvironmentType;
  targetType: 'distance' | 'near_miss' | 'top_speed' | 'wrong_way' | 'score' | 'overtake';
  targetValue: number;
  rewardCoins: number;
  completed: boolean;
}

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  targetType: 'distance' | 'overtake' | 'top_speed' | 'night_drive' | 'near_miss' | 'score';
  targetValue: number;
  progress: number;
  rewardCoins: number;
  completed: boolean;
  claimed: boolean;
}

export type HeadlightMode = 'off' | 'low' | 'high';

export interface GameSettings {
  masterVolume: number;
  engineVolume: number;
  sfxVolume: number;
  graphicsQuality: 'high' | 'medium' | 'low';
  mouseSensitivity: number;
  cameraAutoCenter: boolean;
  cameraShake: boolean;
  headlightAutoOn: boolean;
  rainWeather: boolean;
  fieldOfView: number;
  steeringSensitivity: number;
  useTouchControls: boolean;
  preferredCamera: 'chase' | 'cockpit';
}

export interface SaveData {
  playerId: string;
  playerName: string;
  coins: number;
  highScore: number;
  selectedCarId: CarId;
  selectedEnvironment: EnvironmentType;
  selectedMode: GameMode;
  unlockedCars: CarId[];
  unlockedEnvironments: EnvironmentType[];
  carUpgrades: Record<CarId, CarUpgradeLevels>;
  carCustomizations: Record<CarId, CarCustomization>;
  completedMissions: string[];
  dailyMissionProgress: Record<string, { progress: number; claimed: boolean }>;
  dailyMissionsCycleDay: number;
  settings: GameSettings;
}

export interface LeaderboardRow {
  rank: number;
  id: string;
  playerId: string;
  playerName: string;
  score: number;
  distanceM: number;
  carId: string;
  carName: string;
  nearMissCount: number;
  timestamp: number;
}
