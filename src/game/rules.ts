/**
 * City Rush 3D - Game Rules, Catalogs, Scoring & Constants (Update V2)
 */

import {
  CarDefinition,
  CarId,
  CarStats,
  CarUpgradeLevels,
  EnvironmentDefinition,
  EnvironmentType,
  CareerMission,
  DailyMission,
  SaveData,
} from './types';

export const CAR_CATALOG: CarDefinition[] = [
  {
    id: 'compact',
    name: 'City Compact Hatch',
    vietnameseName: 'Hatchback Đô Thị',
    category: 'Compact',
    price: 0,
    unlockedByDefault: true,
    baseStats: {
      topSpeedKmh: 165,
      acceleration: 6.8,
      braking: 7.2,
      handling: 8.6,
      nitroPower: 1.25,
    },
    description: 'Xe đô thị nhỏ gọn linh hoạt, bán kính quay hẹp, cực kỳ dễ luồn lách qua các khe hở giao thông đông đúc.',
    colors: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#ffffff', '#1e293b'],
    hasSpoilerOption: true,
  },
  {
    id: 'sedan',
    name: 'Street Cruiser Sedan',
    vietnameseName: 'Sedan Phổ Thông',
    category: 'Sedan',
    price: 2000,
    unlockedByDefault: false,
    baseStats: {
      topSpeedKmh: 195,
      acceleration: 7.6,
      braking: 7.8,
      handling: 8.0,
      nitroPower: 1.35,
    },
    description: 'Sedan 4 cửa thực dụng, đầm chắc ở tốc độ cao, khả năng phanh êm ái và tầm nhìn cabin rộng rãi.',
    colors: ['#475569', '#1e3a8a', '#991b1b', '#065f46', '#f8fafc', '#18181b'],
    hasSpoilerOption: true,
  },
  {
    id: 'luxury_sedan',
    name: 'President Executive Saloon',
    vietnameseName: 'Sedan Hạng Sang President',
    category: 'Luxury Sedan',
    price: 5500,
    unlockedByDefault: false,
    baseStats: {
      topSpeedKmh: 220,
      acceleration: 8.4,
      braking: 8.5,
      handling: 8.2,
      nitroPower: 1.4,
    },
    description: 'Sedan hạng sang cao cấp, trục cơ sở kéo dài, ốp mạ chrome sang trọng, cách âm hoàn hảo và vận hành đầm chắc.',
    colors: ['#0f172a', '#1e293b', '#7f1d1d', '#14532d', '#f8fafc', '#d97706'],
    hasSpoilerOption: false,
  },
  {
    id: 'suv',
    name: 'Titan Crossover SUV 4x4',
    vietnameseName: 'SUV Đô Thị Titan',
    category: 'SUV',
    price: 9500,
    unlockedByDefault: false,
    baseStats: {
      topSpeedKmh: 215,
      acceleration: 8.2,
      braking: 8.8,
      handling: 7.6,
      nitroPower: 1.4,
    },
    description: 'Gầm cao kiên cố, thân xe nặng đầm chắc, vị trí ngồi cao bao quát toàn bộ tầm nhìn giao thông phía trước.',
    colors: ['#047857', '#334155', '#78350f', '#0284c7', '#27272a', '#e2e8f0'],
    hasSpoilerOption: false,
  },
  {
    id: 'pickup',
    name: 'Raptor Heavy 4x4 Pickup',
    vietnameseName: 'Xe Bán Tải Raptor 4x4',
    category: 'Pickup',
    price: 14500,
    unlockedByDefault: false,
    baseStats: {
      topSpeedKmh: 205,
      acceleration: 8.9,
      braking: 8.6,
      handling: 7.2,
      nitroPower: 1.45,
    },
    description: 'Bán tải việt dã bánh to hầm hố, khung gầm thép chịu lực, cản va trước kiên cố và thùng hàng đa dụng phong trần.',
    colors: ['#b45309', '#3f3f46', '#15803d', '#1d4ed8', '#111827', '#ffffff'],
    hasSpoilerOption: false,
  },
  {
    id: 'muscle',
    name: 'Thunder V8 Muscle Classic',
    vietnameseName: 'Cơ Bắp Cổ Điển Thunder V8',
    category: 'Muscle',
    price: 20000,
    unlockedByDefault: false,
    baseStats: {
      topSpeedKmh: 255,
      acceleration: 9.8,
      braking: 7.4,
      handling: 7.0,
      nitroPower: 1.6,
    },
    description: 'Cỗ máy cơ bắp V8 gầm rú hoang dã. Tốc độ thẳng khủng khiếp, trớn nặng, đòi hỏi tay lái điêu luyện khi phanh gấp.',
    colors: ['#ea580c', '#15803d', '#4338ca', '#713f12', '#18181b', '#b91c1c'],
    hasSpoilerOption: true,
  },
  {
    id: 'coupe',
    name: 'Apex GT Sport Coupe',
    vietnameseName: 'Xe Thể Thao Apex GT',
    category: 'Coupe',
    price: 27000,
    unlockedByDefault: false,
    baseStats: {
      topSpeedKmh: 245,
      acceleration: 9.2,
      braking: 8.6,
      handling: 8.7,
      nitroPower: 1.5,
    },
    description: 'Động cơ tăng áp kép, phân bổ trọng lượng 50:50, trọng tâm thấp ôm cua gắt không sàng lắc.',
    colors: ['#e11d48', '#8b5cf6', '#06b6d4', '#eab308', '#000000', '#f43f5e'],
    hasSpoilerOption: true,
  },
  {
    id: 'rally',
    name: 'Apex Rally Turbo 4WD',
    vietnameseName: 'Xe Đua Rally 4WD',
    category: 'Rally',
    price: 36000,
    unlockedByDefault: false,
    baseStats: {
      topSpeedKmh: 260,
      acceleration: 10.5,
      braking: 9.5,
      handling: 9.6,
      nitroPower: 1.55,
    },
    description: 'Hệ dẫn động 4 bánh toàn thời gian bám đường bất chấp mọi điều kiện thời tiết, phản hồi lái tức thì như chớp.',
    colors: ['#0284c7', '#ea580c', '#16a34a', '#e11d48', '#ffffff', '#0f172a'],
    hasSpoilerOption: true,
  },
  {
    id: 'supercar',
    name: 'Vortex GT Supercar',
    vietnameseName: 'Siêu Xe Vortex GT',
    category: 'Supercar',
    price: 48000,
    unlockedByDefault: false,
    baseStats: {
      topSpeedKmh: 305,
      acceleration: 12.0,
      braking: 10.0,
      handling: 10.0,
      nitroPower: 1.8,
    },
    description: 'Kỹ nghệ siêu xe khí động học đỉnh cao, gầm thấp xé gió, phanh gốm carbon và lực ép thân xe tuyệt hảo.',
    colors: ['#06b6d4', '#f43f5e', '#a855f7', '#84cc16', '#fafafa', '#0f172a'],
    hasSpoilerOption: true,
  },
  {
    id: 'hypercar',
    name: 'Phantom Vision Hypercar',
    vietnameseName: 'Hypercar Phantom Vision',
    category: 'Hypercar',
    price: 65000,
    unlockedByDefault: false,
    baseStats: {
      topSpeedKmh: 350,
      acceleration: 13.8,
      braking: 11.0,
      handling: 10.4,
      nitroPower: 2.0,
    },
    description: 'Đỉnh cao tốc độ thế giới. Động cơ hybrid quad-turbo, tăng tốc tên lửa và hệ thống cánh gió chủ động siêu việt.',
    colors: ['#6366f1', '#e11d48', '#14b8a6', '#f59e0b', '#000000', '#f8fafc'],
    hasSpoilerOption: true,
  },
  {
    id: 'bicycle',
    name: 'Urban Aero Street Bicycle',
    vietnameseName: 'Xe Đạp Đường Phố Urban Aero',
    category: 'Xe Đạp',
    price: 600,
    unlockedByDefault: false,
    baseStats: {
      topSpeedKmh: 48,
      acceleration: 4.5,
      braking: 8.8,
      handling: 9.8,
      nitroPower: 1.2,
    },
    description: 'Xe đạp đường phố thanh thoát, kích thước siêu gọn giúp lách qua mọi khe hở giao thông hẹp nhất.',
    colors: ['#84cc16', '#06b6d4', '#f43f5e', '#eab308', '#f8fafc', '#18181b'],
    hasSpoilerOption: false,
  },
  {
    id: 'moto_scooter',
    name: 'Metro Glide Maxi-Scooter',
    vietnameseName: 'Xe Tay Ga Metro Glide',
    category: 'Mô Tô',
    price: 1500,
    unlockedByDefault: false,
    baseStats: {
      topSpeedKmh: 110,
      acceleration: 6.6,
      braking: 8.0,
      handling: 9.2,
      nitroPower: 1.25,
    },
    description: 'Xe tay ga đô thị thanh lịch, sàn để chân tiện nghi, bứt tốc êm ái trên các tuyến phố nội đô.',
    colors: ['#06b6d4', '#ec4899', '#6366f1', '#f8fafc', '#18181b', '#eab308'],
    hasSpoilerOption: false,
  },
  {
    id: 'moto_cruiser',
    name: 'Iron Horse V-Twin Cruiser',
    vietnameseName: 'Mô Tô Cruiser Iron Horse',
    category: 'Mô Tô',
    price: 3200,
    unlockedByDefault: false,
    baseStats: {
      topSpeedKmh: 165,
      acceleration: 7.4,
      braking: 7.6,
      handling: 8.2,
      nitroPower: 1.35,
    },
    description: 'Mô tô cruiser cơ bắp, âm thanh pô trầm uy lực, gầm thấp đầm chắc trên các cung đường cao tốc dài.',
    colors: ['#18181b', '#78350f', '#991b1b', '#374151', '#f8fafc', '#0284c7'],
    hasSpoilerOption: false,
  },
  {
    id: 'moto_adventure',
    name: 'Dakar Explorer Adventure Bike',
    vietnameseName: 'Mô Tô Địa Hình Adventure Dakar',
    category: 'Mô Tô',
    price: 5000,
    unlockedByDefault: false,
    baseStats: {
      topSpeedKmh: 185,
      acceleration: 8.0,
      braking: 8.2,
      handling: 8.6,
      nitroPower: 1.4,
    },
    description: 'Chiến mã địa hình gầm cao việt dã, mỏ vịt cản gió, phuộc nhún dài và thùng nhôm hành trình xuyên quốc gia.',
    colors: ['#d97706', '#3f6212', '#0284c7', '#27272a', '#f8fafc', '#ef4444'],
    hasSpoilerOption: false,
  },
  {
    id: 'moto_naked',
    name: 'Street Beast Naked Bike',
    vietnameseName: 'Mô Tô Naked Street Beast',
    category: 'Mô Tô',
    price: 6800,
    unlockedByDefault: false,
    baseStats: {
      topSpeedKmh: 215,
      acceleration: 8.8,
      braking: 8.6,
      handling: 9.0,
      nitroPower: 1.45,
    },
    description: 'Streetfighter khung mắt cáo cam lộ thiên, nước đề cực bốc, cảm giác lái trực tiếp và vào cua sắc bén.',
    colors: ['#f97316', '#27272a', '#3b82f6', '#ef4444', '#84cc16', '#f8fafc'],
    hasSpoilerOption: false,
  },
  {
    id: 'moto_touring',
    name: 'Grand Highway Luxury Tourer',
    vietnameseName: 'Mô Tô Đường Trường Touring',
    category: 'Mô Tô',
    price: 8500,
    unlockedByDefault: false,
    baseStats: {
      topSpeedKmh: 200,
      acceleration: 8.2,
      braking: 8.4,
      handling: 8.0,
      nitroPower: 1.4,
    },
    description: 'Mô tô đường trường hạng sang, kính chắn gió lớn, thùng đồ đôi rộng rãi và sự êm ái tuyệt đối.',
    colors: ['#1e3a8a', '#334155', '#7f1d1d', '#0f172a', '#f8fafc', '#d97706'],
    hasSpoilerOption: false,
  },
  {
    id: 'moto_sport_touring',
    name: 'Velocity GT Sport Touring',
    vietnameseName: 'Mô Tô Thể Thao Đường Dài GT',
    category: 'Mô Tô',
    price: 10500,
    unlockedByDefault: false,
    baseStats: {
      topSpeedKmh: 240,
      acceleration: 9.1,
      braking: 8.8,
      handling: 8.8,
      nitroPower: 1.5,
    },
    description: 'Hòa quyện giữa tốc độ siêu xe và tính thực dụng đường dài, cỗ máy xé gió nuốt trọn mọi chặng đua.',
    colors: ['#881337', '#1e1b4b', '#0369a1', '#15803d', '#f8fafc', '#18181b'],
    hasSpoilerOption: false,
  },
  {
    id: 'moto_sport',
    name: 'Apex RS-V4 Super Sport Bike',
    vietnameseName: 'Mô Tô Thể Thao Apex Sport',
    category: 'Mô Tô',
    price: 14000,
    unlockedByDefault: false,
    baseStats: {
      topSpeedKmh: 295,
      acceleration: 9.6,
      braking: 9.2,
      handling: 9.4,
      nitroPower: 1.6,
    },
    description: 'Siêu mô tô thể thao thuần đua, góc nghiêng cua cực sâu, bứt tốc xé gió vượt mặt mọi đối thủ trên cao tốc.',
    colors: ['#ef4444', '#06b6d4', '#10b981', '#f59e0b', '#18181b', '#f8fafc'],
    hasSpoilerOption: true,
  },
];

export const ENVIRONMENTS: EnvironmentDefinition[] = [
  {
    id: 'city',
    name: 'Modern City',
    vietnameseName: 'Thành Phố Hiện Đại',
    skyColor: '#60a5fa',
    fogColor: '#93c5fd',
    groundColor: '#334155',
    timeOfDay: 'day',
    description: 'Đường phố nội đô nhộn nhịp giữa rừng cao ốc chọc trời, biển hiệu quảng cáo và nhịp sống sôi động ban ngày.',
    unlockedByDefault: true,
    unlockCost: 0,
  },
  {
    id: 'highway',
    name: 'Desert Highway',
    vietnameseName: 'Cao Tốc Sa Mạc',
    skyColor: '#f59e0b',
    fogColor: '#fcd34d',
    groundColor: '#78350f',
    timeOfDay: 'sunset',
    description: 'Cao tốc thẳng tắp qua hẻm núi sa mạc rực nắng hoàng hôn, làn xe rộng mở để thỏa sức ép hết ga.',
    unlockedByDefault: true,
    unlockCost: 0,
  },
  {
    id: 'night',
    name: 'Neon Night Drive',
    vietnameseName: 'Đêm Thành Phố Neon',
    skyColor: '#030712',
    fogColor: '#090d16',
    groundColor: '#020617',
    timeOfDay: 'night',
    description: 'Đêm huyền ảo dưới ánh đèn cao áp vàng cam, hệ thống đèn pha siêu sáng chiếu rọi đường phố.',
    unlockedByDefault: true, // Unlocked by default so player can test night headlights immediately
    unlockCost: 0,
  },
  {
    id: 'coastal',
    name: 'Ocean Coastline',
    vietnameseName: 'Đường Ven Biển',
    skyColor: '#38bdf8',
    fogColor: '#7dd3fc',
    groundColor: '#0c4a6e',
    timeOfDay: 'day',
    description: 'Tuyến đường ven biển ngát xanh, hàng cọ nhiệt đới và gió biển mát rượi với những khúc lượn đẹp mắt.',
    unlockedByDefault: false,
    unlockCost: 3500,
  },
];

export const DAILY_MISSIONS_TEMPLATE: DailyMission[] = [
  {
    id: 'dm-dist',
    title: 'Chinh Phục Quãng Đường',
    description: 'Chạy tổng cộng 5,000 mét trong các lượt đua.',
    targetType: 'distance',
    targetValue: 5000,
    progress: 0,
    rewardCoins: 350,
    completed: false,
    claimed: false,
  },
  {
    id: 'dm-overtake',
    title: 'Chuyên Gia Vượt Xe',
    description: 'Vượt qua 20 phương tiện giao thông trên đường.',
    targetType: 'overtake',
    targetValue: 20,
    progress: 0,
    rewardCoins: 300,
    completed: false,
    claimed: false,
  },
  {
    id: 'dm-speed',
    title: 'Phá Vỡ Mốc 150 KM/H',
    description: 'Đạt tốc độ tức thời trên 150 km/h.',
    targetType: 'top_speed',
    targetValue: 150,
    progress: 0,
    rewardCoins: 250,
    completed: false,
    claimed: false,
  },
  {
    id: 'dm-night',
    title: 'Tay Đua Đêm Huyền Ảo',
    description: 'Lái xe trong bản đồ Đêm Neon (Night Drive) trong 3 phút (180s).',
    targetType: 'night_drive',
    targetValue: 180,
    progress: 0,
    rewardCoins: 400,
    completed: false,
    claimed: false,
  },
  {
    id: 'dm-nearmiss',
    title: 'Lạng Lách Điêu Luyện',
    description: 'Thực hiện 5 lần vượt xe sát nút (Near Miss) ở tốc độ cao.',
    targetType: 'near_miss',
    targetValue: 5,
    progress: 0,
    rewardCoins: 350,
    completed: false,
    claimed: false,
  },
  {
    id: 'dm-score',
    title: 'Thợ Săn Điểm Số',
    description: 'Ghi được ít nhất 1,500 điểm trong một lượt chạy duy nhất.',
    targetType: 'score',
    targetValue: 1500,
    progress: 0,
    rewardCoins: 450,
    completed: false,
    claimed: false,
  },
];

export const CAREER_MISSIONS: CareerMission[] = [
  {
    id: 'c1',
    title: 'Làm quen tay lái',
    description: 'Chạy quãng đường 1,000 mét an toàn trên đường phố.',
    mode: 'one_way',
    environment: 'city',
    targetType: 'distance',
    targetValue: 1000,
    rewardCoins: 500,
    completed: false,
  },
  {
    id: 'c2',
    title: 'Phá vỡ tốc độ',
    description: 'Đạt tốc độ tức thời trên 150 km/h trên cao tốc.',
    mode: 'one_way',
    environment: 'highway',
    targetType: 'top_speed',
    targetValue: 150,
    rewardCoins: 800,
    completed: false,
  },
  {
    id: 'c3',
    title: 'Nghệ nhân lạng lách',
    description: 'Thực hiện 5 cú vượt xe ở cự ly gần (Near Miss).',
    mode: 'one_way',
    environment: 'city',
    targetType: 'near_miss',
    targetValue: 5,
    rewardCoins: 1200,
    completed: false,
  },
  {
    id: 'c4',
    title: 'Lửa ngược chiều',
    description: 'Duy trì lái xe ở làn ngược chiều trong 10 giây.',
    mode: 'two_way',
    environment: 'highway',
    targetType: 'wrong_way',
    targetValue: 10,
    rewardCoins: 1800,
    completed: false,
  },
  {
    id: 'c5',
    title: 'Vua đêm thành phố',
    description: 'Ghi được ít nhất 10,000 điểm trong một lượt chạy đêm.',
    mode: 'two_way',
    environment: 'night',
    targetType: 'score',
    targetValue: 10000,
    rewardCoins: 3000,
    completed: false,
  },
  {
    id: 'c6',
    title: 'Huyền thoại tốc độ',
    description: 'Chạy vượt quãng đường 5,000 mét ở tốc độ cực hạn.',
    mode: 'one_way',
    environment: 'coastal',
    targetType: 'distance',
    targetValue: 5000,
    rewardCoins: 5000,
    completed: false,
  },
];

export const UPGRADE_MAX_LEVEL = 5;

export const UPGRADE_BASE_COSTS = {
  engine: 800,
  brakes: 600,
  handling: 700,
  nitro: 900,
};

export function getUpgradeCost(type: keyof CarUpgradeLevels, currentLevel: number): number {
  if (currentLevel >= UPGRADE_MAX_LEVEL) return Infinity;
  const base = UPGRADE_BASE_COSTS[type];
  return Math.round(base * Math.pow(1.5, currentLevel));
}

export function computeEffectiveStats(base: CarStats, upgrades?: CarUpgradeLevels): CarStats {
  const up = upgrades || { engine: 0, brakes: 0, handling: 0, nitro: 0 };
  const engineBoost = 1 + up.engine * 0.06;
  const brakesBoost = 1 + up.brakes * 0.08;
  const handlingBoost = 1 + up.handling * 0.05;
  const nitroBoost = 1 + up.nitro * 0.08;

  return {
    topSpeedKmh: Math.round(base.topSpeedKmh * (1 + up.engine * 0.045)),
    acceleration: Number((base.acceleration * engineBoost).toFixed(2)),
    braking: Number((base.braking * brakesBoost).toFixed(2)),
    handling: Number((base.handling * handlingBoost).toFixed(2)),
    nitroPower: Number((base.nitroPower * nitroBoost).toFixed(2)),
  };
}

export function calculateDistanceScore(
  distanceDeltaM: number,
  speedKmh: number,
  isWrongWay: boolean
): number {
  if (distanceDeltaM <= 0) return 0;
  let points = distanceDeltaM * 0.5;

  if (speedKmh > 100) {
    const speedBonus = 1 + (speedKmh - 100) / 100;
    points *= speedBonus;
  }

  if (isWrongWay && speedKmh > 60) {
    points *= 2.2;
  }

  return Math.round(points);
}

export interface NearMissResult {
  isNearMiss: boolean;
  scoreBonus: number;
  cashBonus: number;
  comboInc: number;
}

export function evaluateNearMiss(
  playerZ: number,
  playerX: number,
  playerSpeedKmh: number,
  trafficZ: number,
  trafficX: number,
  trafficSpeedKmh: number,
  alreadyOvertaken: boolean
): NearMissResult {
  if (alreadyOvertaken) {
    return { isNearMiss: false, scoreBonus: 0, cashBonus: 0, comboInc: 0 };
  }

  if (playerSpeedKmh < 90) {
    return { isNearMiss: false, scoreBonus: 0, cashBonus: 0, comboInc: 0 };
  }

  const dz = Math.abs(playerZ - trafficZ);
  const dx = Math.abs(playerX - trafficX);

  const isLateralClose = dx >= 1.4 && dx <= 2.9;
  const isLongitudinalPassing = dz <= 3.2;

  if (isLateralClose && isLongitudinalPassing) {
    const relSpeed = Math.abs(playerSpeedKmh - trafficSpeedKmh);
    const speedFactor = Math.min(2.5, Math.max(1.0, relSpeed / 50));
    const scoreBonus = Math.round(180 * speedFactor);
    const cashBonus = Math.round(50 * speedFactor);

    return {
      isNearMiss: true,
      scoreBonus,
      cashBonus,
      comboInc: 1,
    };
  }

  return { isNearMiss: false, scoreBonus: 0, cashBonus: 0, comboInc: 0 };
}

export function isDrivingWrongWay(playerX: number, mode: string): boolean {
  if (mode !== 'two_way') return false;
  return playerX < 0;
}

export function calculateRunEarnings(
  distanceM: number,
  score: number,
  nearMissCount: number,
  wrongWaySec: number,
  mode: string
): {
  totalCoins: number;
  breakdown: {
    distanceCoins: number;
    scoreCoins: number;
    nearMissCoins: number;
    wrongWayCoins: number;
  };
} {
  // Rebalanced formula: A 30,000 score run rewards 5,000 - 8,000 coins
  // (e.g. 3,600 from score conversion + ~600 distance + ~1,500 overtakes/near-misses + wrong-way)
  const scoreCoins = Math.floor(score * 0.12);
  const distanceCoins = Math.floor(distanceM / 6);
  const nearMissCoins = nearMissCount * 75;
  const wrongWayCoins = mode === 'two_way' ? Math.floor(wrongWaySec * 35) : 0;

  const totalCoins = scoreCoins + distanceCoins + nearMissCoins + wrongWayCoins;
  return {
    totalCoins,
    breakdown: {
      distanceCoins,
      scoreCoins,
      nearMissCoins,
      wrongWayCoins,
    },
  };
}

export const DEFAULT_SAVE_DATA: SaveData = {
  playerId: 'racer-' + Math.random().toString(36).substring(2, 9),
  playerName: 'Racer_' + Math.floor(100 + Math.random() * 900),
  coins: 1000,
  highScore: 0,
  selectedCarId: 'compact',
  selectedEnvironment: 'city',
  selectedMode: 'one_way',
  unlockedCars: ['compact'],
  unlockedEnvironments: ['city', 'highway', 'night'],
  carUpgrades: {
    compact: { engine: 0, brakes: 0, handling: 0, nitro: 0 },
    sedan: { engine: 0, brakes: 0, handling: 0, nitro: 0 },
    luxury_sedan: { engine: 0, brakes: 0, handling: 0, nitro: 0 },
    suv: { engine: 0, brakes: 0, handling: 0, nitro: 0 },
    pickup: { engine: 0, brakes: 0, handling: 0, nitro: 0 },
    muscle: { engine: 0, brakes: 0, handling: 0, nitro: 0 },
    coupe: { engine: 0, brakes: 0, handling: 0, nitro: 0 },
    rally: { engine: 0, brakes: 0, handling: 0, nitro: 0 },
    supercar: { engine: 0, brakes: 0, handling: 0, nitro: 0 },
    hypercar: { engine: 0, brakes: 0, handling: 0, nitro: 0 },
    moto_sport: { engine: 0, brakes: 0, handling: 0, nitro: 0 },
    moto_naked: { engine: 0, brakes: 0, handling: 0, nitro: 0 },
    moto_touring: { engine: 0, brakes: 0, handling: 0, nitro: 0 },
    moto_cruiser: { engine: 0, brakes: 0, handling: 0, nitro: 0 },
    moto_adventure: { engine: 0, brakes: 0, handling: 0, nitro: 0 },
    moto_scooter: { engine: 0, brakes: 0, handling: 0, nitro: 0 },
    moto_sport_touring: { engine: 0, brakes: 0, handling: 0, nitro: 0 },
    bicycle: { engine: 0, brakes: 0, handling: 0, nitro: 0 },
  },
  carCustomizations: {
    compact: { color: '#3b82f6', spoiler: false, rimColor: '#cbd5e1' },
    sedan: { color: '#475569', spoiler: false, rimColor: '#cbd5e1' },
    luxury_sedan: { color: '#0f172a', spoiler: false, rimColor: '#f8fafc' },
    suv: { color: '#047857', spoiler: false, rimColor: '#475569' },
    pickup: { color: '#b45309', spoiler: false, rimColor: '#27272a' },
    muscle: { color: '#ea580c', spoiler: false, rimColor: '#e2e8f0' },
    coupe: { color: '#e11d48', spoiler: true, rimColor: '#18181b' },
    rally: { color: '#0284c7', spoiler: true, rimColor: '#f8fafc' },
    supercar: { color: '#06b6d4', spoiler: true, rimColor: '#0f172a' },
    hypercar: { color: '#6366f1', spoiler: true, rimColor: '#18181b' },
    moto_sport: { color: '#ef4444', spoiler: true, rimColor: '#d4d4d8' },
    moto_naked: { color: '#f97316', spoiler: false, rimColor: '#f97316' },
    moto_touring: { color: '#1e3a8a', spoiler: false, rimColor: '#94a3b8' },
    moto_cruiser: { color: '#18181b', spoiler: false, rimColor: '#f8fafc' },
    moto_adventure: { color: '#d97706', spoiler: false, rimColor: '#94a3b8' },
    moto_scooter: { color: '#06b6d4', spoiler: false, rimColor: '#334155' },
    moto_sport_touring: { color: '#881337', spoiler: false, rimColor: '#1e293b' },
    bicycle: { color: '#84cc16', spoiler: false, rimColor: '#94a3b8' },
  },
  completedMissions: [],
  dailyMissionProgress: {},
  dailyMissionsCycleDay: 1,
  settings: {
    masterVolume: 0.8,
    engineVolume: 0.8,
    sfxVolume: 0.85,
    graphicsQuality: 'high',
    mouseSensitivity: 1.0,
    cameraAutoCenter: true,
    cameraShake: true,
    headlightAutoOn: true,
    rainWeather: false,
    fieldOfView: 60,
    steeringSensitivity: 1.0,
    useTouchControls: false,
    preferredCamera: 'chase',
    aiYieldOnFlash: true,
    preferredHeadlightMode: 'low',
  },
};
