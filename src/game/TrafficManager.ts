/**
 * City Rush 3D - Multi-Lane AI Traffic Manager (Update V2 - Fix Lần 2)
 * 10 distinct vehicle types, object pooling, safe distance spawning,
 * Flash-to-Yield AI (Nháy đèn pha nhường đường) with animated turn indicators,
 * brake lights, and collision detection.
 */

import * as THREE from 'three';
import { GameMode } from './types';
import { buildTrafficVehicle, TrafficVehicleType, TrafficModelInstance } from './proceduralModels';
import { LANE_CENTERS } from './environment';
import { evaluateNearMiss, NearMissResult } from './rules';

export interface TrafficEntity {
  id: number;
  type: TrafficVehicleType;
  group: THREE.Group;
  wheels: THREE.Group[];
  lane: number;
  targetLane: number;
  laneChangeProgress: number; // 0 to 1
  isChangingLane: boolean;
  laneChangeDirection: 'left' | 'right' | null;
  x: number;
  targetX: number;
  z: number;
  speedKmh: number;
  targetSpeedKmh: number;
  dimensions: { width: number; height: number; length: number };
  isOncoming: boolean;
  overtaken: boolean;
  active: boolean;
  brakeLightsMat: THREE.MeshStandardMaterial;
  headlightsMat: THREE.MeshStandardMaterial;
  blinkerLeftMat: THREE.MeshStandardMaterial;
  blinkerRightMat: THREE.MeshStandardMaterial;
  state: 'cruising' | 'signaling' | 'yielding';
  signalTimer: number;
  blinkerBlinkTimer: number;
  hasYieldedForFlash: boolean;
}

export class TrafficManager {
  private scene: THREE.Scene;
  private mode: GameMode;
  private vehicles: TrafficEntity[] = [];
  private pool: TrafficEntity[] = [];
  private nextId = 1;
  private maxVehicles = 12; // Tuned: reduced by 6 cars (from 18 to 12) for smooth navigation & high FPS
  private spawnTimer = 0;
  private spawnInterval = 1.25;
  private aiYieldOnFlash = true;

  constructor(scene: THREE.Scene, mode: GameMode) {
    this.scene = scene;
    this.mode = mode;
    this.prepopulatePool(36);
  }

  public setMode(mode: GameMode) {
    this.mode = mode;
    this.reset();
  }

  public setAiYieldOnFlash(enabled: boolean) {
    this.aiYieldOnFlash = enabled;
  }

  private prepopulatePool(count: number) {
    const types: TrafficVehicleType[] = [
      'sedan',
      'taxi',
      'coupe',
      'muscle',
      'suv',
      'truck',
      'bus',
      'van',
      'wagon',
      'pickup',
      'moto_sport',
      'moto_naked',
      'moto_touring',
      'moto_cruiser',
      'moto_adventure',
      'moto_scooter',
      'moto_sport_touring',
      'bicycle',
    ];

    for (let i = 0; i < count; i++) {
      const type = types[i % types.length];
      const model: TrafficModelInstance = buildTrafficVehicle(type);
      model.group.visible = false;
      this.scene.add(model.group);

      const entity: TrafficEntity = {
        id: this.nextId++,
        type,
        group: model.group,
        wheels: model.wheels,
        lane: 0,
        targetLane: 0,
        laneChangeProgress: 1.0,
        isChangingLane: false,
        laneChangeDirection: null,
        x: 0,
        targetX: 0,
        z: 0,
        speedKmh: 65,
        targetSpeedKmh: 65,
        dimensions: model.dimensions,
        isOncoming: false,
        overtaken: false,
        active: false,
        brakeLightsMat: model.brakeLightsMaterial,
        headlightsMat: model.headlightsMaterial,
        blinkerLeftMat: model.blinkerLeftMaterial,
        blinkerRightMat: model.blinkerRightMaterial,
        state: 'cruising',
        signalTimer: 0,
        blinkerBlinkTimer: 0,
        hasYieldedForFlash: false,
      };

      this.pool.push(entity);
    }
  }

  public reset() {
    this.vehicles.forEach((v) => {
      v.active = false;
      v.group.visible = false;
      v.blinkerLeftMat.emissiveIntensity = 0.1;
      v.blinkerRightMat.emissiveIntensity = 0.1;
      this.pool.push(v);
    });
    this.vehicles = [];
    this.spawnTimer = 0;
  }

  /**
   * Spawns a vehicle far ahead of the player on a chosen lane if safe
   */
  private trySpawnVehicle(playerZ: number) {
    if (this.vehicles.length >= this.maxVehicles || this.pool.length === 0) return;

    // Pick a lane (0, 1, 2, 3)
    const lane = Math.floor(Math.random() * 4);
    const xPos = LANE_CENTERS[lane];

    // In Two-Way mode: Lanes 0 & 1 (X < 0) are oncoming (+Z direction)
    const isOncoming = this.mode === 'two_way' && lane < 2;

    // Safe spawn distance: at least 135m to 210m ahead of player
    const spawnDistance = 135 + Math.random() * 85;
    const spawnZ = playerZ - spawnDistance;

    // Verify distance from any existing car in the same lane
    const minSafeSeparation = 32; // meters
    const tooClose = this.vehicles.some(
      (v) => v.active && v.lane === lane && Math.abs(v.z - spawnZ) < minSafeSeparation
    );
    if (tooClose) return;

    // Grab vehicle from pool
    const entity = this.pool.pop()!;
    entity.active = true;
    entity.lane = lane;
    entity.targetLane = lane;
    entity.x = xPos;
    entity.targetX = xPos;
    entity.z = spawnZ;
    entity.isOncoming = isOncoming;
    entity.overtaken = false;
    entity.isChangingLane = false;
    entity.laneChangeProgress = 1.0;
    entity.laneChangeDirection = null;
    entity.state = 'cruising';
    entity.signalTimer = 0;
    entity.blinkerBlinkTimer = 0;
    entity.hasYieldedForFlash = false;
    entity.blinkerLeftMat.emissiveIntensity = 0.1;
    entity.blinkerRightMat.emissiveIntensity = 0.1;

    // Vehicle speed based on type
    let baseSpeed = 70;
    if (entity.type === 'bicycle') baseSpeed = 22 + Math.random() * 4;
    else if (entity.type === 'moto_scooter') baseSpeed = 58 + Math.random() * 10;
    else if (entity.type === 'moto_cruiser') baseSpeed = 68 + Math.random() * 8;
    else if (entity.type === 'moto_adventure') baseSpeed = 78 + Math.random() * 10;
    else if (entity.type === 'moto_touring') baseSpeed = 80 + Math.random() * 10;
    else if (entity.type === 'moto_naked') baseSpeed = 78 + Math.random() * 12;
    else if (entity.type === 'moto_sport_touring') baseSpeed = 82 + Math.random() * 10;
    else if (entity.type === 'moto_sport') baseSpeed = 88 + Math.random() * 10;
    else if (entity.type === 'truck') baseSpeed = 52 + Math.random() * 14;
    else if (entity.type === 'bus') baseSpeed = 48 + Math.random() * 12;
    else if (entity.type === 'van') baseSpeed = 64 + Math.random() * 16;
    else if (entity.type === 'pickup') baseSpeed = 68 + Math.random() * 18;
    else if (entity.type === 'taxi') baseSpeed = 76 + Math.random() * 20;
    else if (entity.type === 'wagon') baseSpeed = 72 + Math.random() * 18;
    else if (entity.type === 'coupe') baseSpeed = 82 + Math.random() * 22;
    else if (entity.type === 'muscle') baseSpeed = 84 + Math.random() * 24;
    else if (entity.type === 'sedan') baseSpeed = 74 + Math.random() * 20;
    else if (entity.type === 'suv') baseSpeed = 68 + Math.random() * 18;

    entity.speedKmh = baseSpeed;
    entity.targetSpeedKmh = baseSpeed;

    entity.group.position.set(entity.x, 0, entity.z);
    entity.group.rotation.set(0, isOncoming ? Math.PI : 0, 0);
    entity.group.visible = true;

    this.vehicles.push(entity);
  }

  /**
   * Check if a specific target lane is clear near a target Z position
   */
  private isLaneClear(targetLane: number, currentZ: number, bufferM: number = 26): boolean {
    // In two-way mode, lanes 0 and 1 are oncoming lanes. Same direction cars cannot enter oncoming lanes!
    if (this.mode === 'two_way' && targetLane < 2) {
      return false;
    }

    if (targetLane < 0 || targetLane > 3) return false;

    return !this.vehicles.some(
      (v) => v.active && (v.lane === targetLane || v.targetLane === targetLane) && Math.abs(v.z - currentZ) < bufferM
    );
  }

  /**
   * Evaluates if vehicle ahead should yield lane when player flashes or uses high beam
   */
  private handleYieldToPlayer(
    v: TrafficEntity,
    delta: number,
    playerZ: number,
    playerX: number,
    playerSpeedKmh: number,
    isPlayerFlashing: boolean,
    isPlayerHighBeam: boolean
  ) {
    // If AI yielding on flash setting is disabled, AI maintains its lane without yielding
    if (!this.aiYieldOnFlash) return;
    if (v.isOncoming || v.hasYieldedForFlash) return;

    // Check if player is directly behind this vehicle in the same lane
    const distanceBehind = v.z - playerZ; // playerZ is more negative if player is behind in Three.js?
    // Wait: player travels in -Z direction! So if player is behind, playerZ > v.z!
    const distToPlayer = playerZ - v.z;

    // Only react if player is behind within 85m and closing in
    if (distToPlayer > 8 && distToPlayer < 85) {
      const isPlayerInSameLane = Math.abs(playerX - v.x) < 2.0;

      if (isPlayerInSameLane && (isPlayerFlashing || isPlayerHighBeam || playerSpeedKmh > v.speedKmh + 25)) {
        if (v.state === 'cruising' && !v.isChangingLane) {
          // Evaluate available adjacent lanes to yield
          let candidateLane: number | null = null;
          let dir: 'left' | 'right' | null = null;

          if (this.mode === 'two_way') {
            // In two-way mode, same-direction traffic is in lanes 2 and 3.
            // If in lane 2, yield right to lane 3! Never yield left into lanes 0 or 1!
            if (v.lane === 2 && this.isLaneClear(3, v.z)) {
              candidateLane = 3;
              dir = 'right';
            }
          } else {
            // In one-way mode, can yield right (preferred) or left
            if (v.lane < 3 && this.isLaneClear(v.lane + 1, v.z)) {
              candidateLane = v.lane + 1;
              dir = 'right';
            } else if (v.lane > 0 && this.isLaneClear(v.lane - 1, v.z)) {
              candidateLane = v.lane - 1;
              dir = 'left';
            }
          }

          if (candidateLane !== null && dir !== null) {
            v.state = 'signaling';
            v.targetLane = candidateLane;
            v.laneChangeDirection = dir;
            v.signalTimer = 0.45; // Turn on blinker for 0.45s before moving
            v.targetX = LANE_CENTERS[candidateLane];
          }
        }
      }
    }

    // State transition from signaling to yielding
    if (v.state === 'signaling') {
      v.signalTimer -= delta;

      // Animate amber blinker
      v.blinkerBlinkTimer += delta;
      const blinkOn = Math.floor(v.blinkerBlinkTimer * 8) % 2 === 0;
      if (v.laneChangeDirection === 'right') {
        v.blinkerRightMat.emissiveIntensity = blinkOn ? 3.5 : 0.1;
      } else {
        v.blinkerLeftMat.emissiveIntensity = blinkOn ? 3.5 : 0.1;
      }

      if (v.signalTimer <= 0) {
        v.state = 'yielding';
        v.isChangingLane = true;
        v.laneChangeProgress = 0;
      }
    }

    // Lane change interpolation
    if (v.isChangingLane) {
      v.laneChangeProgress += delta * 1.2; // ~0.85s to change lane smoothly

      // Continue blinking indicator during lane change
      v.blinkerBlinkTimer += delta;
      const blinkOn = Math.floor(v.blinkerBlinkTimer * 8) % 2 === 0;
      if (v.laneChangeDirection === 'right') {
        v.blinkerRightMat.emissiveIntensity = blinkOn ? 3.5 : 0.1;
      } else {
        v.blinkerLeftMat.emissiveIntensity = blinkOn ? 3.5 : 0.1;
      }

      if (v.laneChangeProgress >= 1.0) {
        v.laneChangeProgress = 1.0;
        v.lane = v.targetLane;
        v.x = v.targetX;
        v.isChangingLane = false;
        v.state = 'cruising';
        v.hasYieldedForFlash = true;
        v.blinkerLeftMat.emissiveIntensity = 0.1;
        v.blinkerRightMat.emissiveIntensity = 0.1;
        v.group.rotation.y = 0;
      } else {
        // Smooth sine interpolation
        const t = Math.sin((v.laneChangeProgress * Math.PI) / 2);
        const startX = LANE_CENTERS[v.lane];
        v.x = THREE.MathUtils.lerp(startX, v.targetX, t);

        // Realistic body yaw steering angle during lane change
        const steerSign = v.laneChangeDirection === 'right' ? 1 : -1;
        const steerAngle = Math.sin(v.laneChangeProgress * Math.PI) * 0.12 * steerSign;
        v.group.rotation.y = steerAngle;
      }

      v.group.position.x = v.x;
    }
  }

  /**
   * Updates traffic simulation per frame
   */
  public update(
    delta: number,
    playerZ: number,
    playerX: number,
    playerSpeedKmh: number,
    isPlayerFlashing: boolean,
    isPlayerHighBeam: boolean,
    onNearMiss: (result: NearMissResult) => void
  ) {
    this.spawnTimer += delta;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this.trySpawnVehicle(playerZ);
    }

    const mps = (kmh: number) => kmh / 3.6;

    for (let i = this.vehicles.length - 1; i >= 0; i--) {
      const v = this.vehicles[i];
      if (!v.active) continue;

      // Check Flash-To-Yield Mechanic
      this.handleYieldToPlayer(v, delta, playerZ, playerX, playerSpeedKmh, isPlayerFlashing, isPlayerHighBeam);

      // Move vehicle along Z
      // Normal traffic moves in -Z direction (same as player forward)
      // Oncoming traffic moves in +Z direction (towards player)
      const speedMs = mps(v.speedKmh);
      if (v.isOncoming) {
        v.z += speedMs * delta;
      } else {
        v.z -= speedMs * delta;
      }

      v.group.position.z = v.z;

      // Rotate wheels
      const wheelRot = (speedMs / 0.35) * delta;
      v.wheels.forEach((w) => {
        w.rotation.x += wheelRot;
      });

      // Near miss check when player is passing this vehicle
      if (!v.overtaken && !v.isOncoming) {
        const isPassingNow = playerZ <= v.z + 1.2;
        if (isPassingNow) {
          const nm = evaluateNearMiss(playerZ, playerX, playerSpeedKmh, v.z, v.x, v.speedKmh, v.overtaken);
          if (nm.isNearMiss) {
            v.overtaken = true;
            onNearMiss(nm);
          } else if (playerZ < v.z - 5) {
            v.overtaken = true;
          }
        }
      } else if (!v.overtaken && v.isOncoming) {
        const isPassingNow = playerZ <= v.z + 1.2;
        if (isPassingNow) {
          const nm = evaluateNearMiss(playerZ, playerX, playerSpeedKmh, v.z, v.x, v.speedKmh, v.overtaken);
          if (nm.isNearMiss) {
            nm.scoreBonus = Math.round(nm.scoreBonus * 1.5);
            nm.cashBonus = Math.round(nm.cashBonus * 1.5);
            v.overtaken = true;
            onNearMiss(nm);
          } else if (playerZ < v.z - 5) {
            v.overtaken = true;
          }
        }
      }

      // Despawn checks
      const distanceBehind = v.z - playerZ;
      const distanceAhead = playerZ - v.z;
      const shouldDespawn = distanceBehind > 55 || distanceAhead > 280;

      if (shouldDespawn) {
        v.active = false;
        v.group.visible = false;
        v.blinkerLeftMat.emissiveIntensity = 0.1;
        v.blinkerRightMat.emissiveIntensity = 0.1;
        this.vehicles.splice(i, 1);
        this.pool.push(v);
      }
    }
  }

  /**
   * Collision check between player car and any AI traffic vehicle
   */
  public checkPlayerCollision(
    playerX: number,
    playerZ: number,
    playerWidth: number,
    playerLength: number
  ): TrafficEntity | null {
    const halfPW = playerWidth * 0.45;
    const halfPL = playerLength * 0.45;

    for (const v of this.vehicles) {
      if (!v.active) continue;

      const halfVW = v.dimensions.width * 0.48;
      const halfVL = v.dimensions.length * 0.48;

      const overlapX = Math.abs(playerX - v.x) < halfPW + halfVW;
      const overlapZ = Math.abs(playerZ - v.z) < halfPL + halfVL;

      if (overlapX && overlapZ) {
        return v;
      }
    }

    return null;
  }

  public getActiveCount(): number {
    return this.vehicles.length;
  }

  public dispose() {
    this.vehicles.forEach((v) => this.scene.remove(v.group));
    this.pool.forEach((v) => this.scene.remove(v.group));
    this.vehicles = [];
    this.pool = [];
  }
}
