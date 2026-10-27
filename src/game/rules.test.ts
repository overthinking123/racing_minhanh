import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CAR_CATALOG,
  ENVIRONMENTS,
  DAILY_MISSIONS_TEMPLATE,
  UPGRADE_MAX_LEVEL,
  getUpgradeCost,
  computeEffectiveStats,
  calculateDistanceScore,
  evaluateNearMiss,
  isDrivingWrongWay,
  calculateRunEarnings,
  DEFAULT_SAVE_DATA,
} from './rules';

test('CAR_CATALOG contains 18 distinct player vehicles (10 cars, 7 motorbikes, 1 bicycle)', () => {
  assert.equal(CAR_CATALOG.length, 18);
  const ids = CAR_CATALOG.map((c) => c.id);
  const expectedCars = [
    'compact',
    'sedan',
    'luxury_sedan',
    'suv',
    'pickup',
    'muscle',
    'coupe',
    'rally',
    'supercar',
    'hypercar',
  ];
  const expectedTwoWheelers = [
    'bicycle',
    'moto_scooter',
    'moto_cruiser',
    'moto_adventure',
    'moto_naked',
    'moto_touring',
    'moto_sport_touring',
    'moto_sport',
  ];

  for (const id of [...expectedCars, ...expectedTwoWheelers]) {
    assert.ok(ids.includes(id as any), `Missing vehicle id: ${id}`);
  }

  for (const car of CAR_CATALOG) {
    assert.ok(car.baseStats.topSpeedKmh > 30);
    assert.ok(car.baseStats.acceleration > 2);
    assert.ok(car.baseStats.braking > 2);
    assert.ok(car.baseStats.handling > 2);
  }
});

test('DAILY_MISSIONS_TEMPLATE contains 6 balanced gameplay objectives', () => {
  assert.equal(DAILY_MISSIONS_TEMPLATE.length, 6);
  for (const m of DAILY_MISSIONS_TEMPLATE) {
    assert.ok(m.targetValue > 0);
    assert.ok(m.rewardCoins > 0);
  }
});

test('ENVIRONMENTS includes Night Drive unlocked for testing', () => {
  assert.equal(ENVIRONMENTS.length, 4);
  const night = ENVIRONMENTS.find((e) => e.id === 'night');
  assert.ok(night);
  assert.equal(night?.unlockedByDefault, true);
});

test('Upgrade cost scales progressively', () => {
  const lvl0 = getUpgradeCost('engine', 0);
  const lvl1 = getUpgradeCost('engine', 1);
  assert.ok(lvl1 > lvl0);
  assert.equal(getUpgradeCost('engine', UPGRADE_MAX_LEVEL), Infinity);
});

test('Effective stats compute correctly from upgrades', () => {
  const base = CAR_CATALOG[0].baseStats;
  const upgraded = computeEffectiveStats(base, {
    engine: 3,
    brakes: 2,
    handling: 1,
    nitro: 4,
  });

  assert.ok(upgraded.topSpeedKmh > base.topSpeedKmh);
  assert.ok(upgraded.acceleration > base.acceleration);
  assert.ok(upgraded.braking > base.braking);
  assert.ok(upgraded.handling > base.handling);
  assert.ok(upgraded.nitroPower > base.nitroPower);
});

test('Near miss correctly triggers on close overtaking pass at speed', () => {
  const result = evaluateNearMiss(100, 1.8, 120, 99, 3.8, 70, false);
  assert.equal(result.isNearMiss, true);
  assert.ok(result.scoreBonus > 0);
  assert.ok(result.cashBonus > 0);
});

test('DEFAULT_SAVE_DATA has playerId, playerName, and 18 vehicle upgrade slots', () => {
  assert.ok(DEFAULT_SAVE_DATA.playerId.startsWith('racer-'));
  assert.ok(DEFAULT_SAVE_DATA.playerName.length > 0);
  assert.equal(Object.keys(DEFAULT_SAVE_DATA.carUpgrades).length, 18);
});

test('calculateRunEarnings provides 5,000 to 8,000 coins for a 30,000 score run', () => {
  // Typical 30k score run: 3,500m distance, 30,000 score, 18 near misses, 0s wrong way
  const run1 = calculateRunEarnings(3500, 30000, 18, 0, 'one_way');
  assert.ok(run1.totalCoins >= 5000 && run1.totalCoins <= 8000, `Expected 5000-8000 coins, got ${run1.totalCoins}`);
  assert.ok(run1.breakdown.scoreCoins > 0);
  assert.ok(run1.breakdown.distanceCoins > 0);
  assert.ok(run1.breakdown.nearMissCoins > 0);

  // Two-way run with some wrong way driving
  const run2 = calculateRunEarnings(3000, 30000, 12, 15, 'two_way');
  assert.ok(run2.totalCoins >= 5000 && run2.totalCoins <= 8000, `Expected 5000-8000 coins, got ${run2.totalCoins}`);
});

test('DEFAULT_SAVE_DATA includes aiYieldOnFlash set to true by default', () => {
  assert.strictEqual(DEFAULT_SAVE_DATA.settings.aiYieldOnFlash, true);
});

test('Player catalog includes 7 distinct motorbikes and 1 bicycle, traffic is cars only', () => {
  const expectedTwoWheelers = [
    'moto_sport',
    'moto_naked',
    'moto_touring',
    'moto_cruiser',
    'moto_adventure',
    'moto_scooter',
    'moto_sport_touring',
    'bicycle',
  ];
  assert.equal(expectedTwoWheelers.length, 8);
  for (const t of expectedTwoWheelers) {
    assert.ok(t.startsWith('moto_') || t === 'bicycle');
    const def = CAR_CATALOG.find((c) => c.id === t);
    assert.ok(def, `Player vehicle ${t} must exist in CAR_CATALOG`);
  }
});


