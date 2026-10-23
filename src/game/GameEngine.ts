/**
 * City Rush 3D - Core Game Engine Orchestrator (Update V2)
 * Coordinates Three.js render loop, physics, headlights (Z/X), mouse drag free-look camera,
 * daily mission tracking, and overtaking/near-miss events.
 */

import * as THREE from 'three';
import {
  CarId,
  EnvironmentType,
  GameMode,
  PlayerStats,
  SaveData,
} from './types';
import { CAR_CATALOG, calculateDistanceScore, isDrivingWrongWay, calculateRunEarnings } from './rules';
import { EnvironmentManager } from './environment';
import { TrafficManager } from './TrafficManager';
import { VehicleController, VehicleInputs } from './VehicleController';
import { soundEngine } from './audio';

export interface NearMissEvent {
  id: number;
  type: 'near_miss' | 'overtake' | 'wrong_way' | 'nitro';
  title: string;
  scoreBonus: number;
  cashBonus: number;
  combo: number;
}

export class GameEngine {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;

  private envManager: EnvironmentManager;
  private trafficManager: TrafficManager;
  public vehicleController: VehicleController;

  private isSoftwareGl = false;
  private isRunning = false;
  private isPaused = false;
  private animFrameId: number | null = null;
  private lastTime = 0;

  // Active game state
  private mode: GameMode = 'one_way';
  private envType: EnvironmentType = 'city';
  private carId: CarId = 'compact';
  private saveData: SaveData;

  // Real-time run stats
  public stats: PlayerStats = {
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
  };

  // Inputs
  private inputs: VehicleInputs = {
    accelerate: false,
    brake: false,
    steerLeft: false,
    steerRight: false,
    handbrake: false,
    nitro: false,
    horn: false,
  };

  private touchInputs: Partial<VehicleInputs> = {};

  // Pointer dragging state for 360 look-around
  private isPointerDown = false;
  private lastPointerX = 0;
  private lastPointerY = 0;

  // Screen shake
  private shakeIntensity = 0;

  // Callbacks to React UI
  private onStatsUpdate?: (stats: PlayerStats) => void;
  private onNearMiss?: (event: NearMissEvent) => void;
  private onCameraToggle?: (mode: 'chase' | 'cockpit') => void;
  private onHeadlightsToggle?: (on: boolean) => void;
  private onGameOver?: (summary: {
    stats: PlayerStats;
    earnings: { totalCoins: number; breakdown: { distanceCoins: number; nearMissCoins: number; wrongWayCoins: number } };
  }) => void;

  constructor(
    container: HTMLElement,
    saveData: SaveData,
    callbacks: {
      onStatsUpdate: (stats: PlayerStats) => void;
      onNearMiss: (event: NearMissEvent) => void;
      onCameraToggle?: (mode: 'chase' | 'cockpit') => void;
      onHeadlightsToggle?: (on: boolean) => void;
      onGameOver: (summary: {
        stats: PlayerStats;
        earnings: { totalCoins: number; breakdown: { distanceCoins: number; nearMissCoins: number; wrongWayCoins: number } };
      }) => void;
    }
  ) {
    this.container = container;
    this.saveData = saveData;
    this.mode = saveData.selectedMode;
    this.envType = saveData.selectedEnvironment;
    this.carId = saveData.selectedCarId;
    this.onStatsUpdate = callbacks.onStatsUpdate;
    this.onNearMiss = callbacks.onNearMiss;
    this.onCameraToggle = callbacks.onCameraToggle;
    this.onHeadlightsToggle = callbacks.onHeadlightsToggle;
    this.onGameOver = callbacks.onGameOver;

    // Detect software GL
    this.isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: !this.isSoftwareGl && this.saveData.settings.graphicsQuality !== 'low',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl && this.saveData.settings.graphicsQuality === 'high';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);

    // Scene & Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      saveData.settings.fieldOfView || 60,
      container.clientWidth / container.clientHeight,
      0.1,
      800
    );

    // Managers
    this.envManager = new EnvironmentManager(this.scene, this.envType, this.mode);
    this.trafficManager = new TrafficManager(this.scene, this.mode);

    const carDef = CAR_CATALOG.find((c) => c.id === this.carId) || CAR_CATALOG[0];
    this.vehicleController = new VehicleController(
      this.scene,
      this.camera,
      carDef,
      this.saveData.carUpgrades[this.carId],
      this.saveData.carCustomizations[this.carId],
      this.saveData.settings,
      this.saveData.settings.preferredCamera
    );

    this.bindKeyboardEvents();
    this.bindPointerEvents();
    window.addEventListener('resize', this.handleResize);

    // Initial render
    this.renderer.render(this.scene, this.camera);
  }

  private handleResize = () => {
    if (!this.container || !this.renderer) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private bindKeyboardEvents() {
    window.addEventListener('keydown', (e) => {
      soundEngine.resume();

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.inputs.accelerate = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.inputs.brake = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.inputs.steerLeft = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.inputs.steerRight = true;
          break;
        case 'Space':
          this.inputs.handbrake = true;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.inputs.nitro = true;
          break;
        case 'KeyH':
          this.inputs.horn = true;
          break;
        case 'KeyC':
          this.vehicleController.toggleCamera();
          this.onCameraToggle?.(this.vehicleController.cameraMode);
          break;
        case 'KeyZ':
          const cycled = this.vehicleController.cycleHeadlightMode();
          this.onHeadlightsToggle?.(cycled !== 'off');
          break;
        case 'KeyX':
          const toggled = this.vehicleController.toggleHeadlights();
          this.onHeadlightsToggle?.(toggled);
          break;
        case 'KeyF':
          this.vehicleController.flashHeadlights();
          this.onHeadlightsToggle?.(true);
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.inputs.accelerate = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.inputs.brake = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.inputs.steerLeft = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.inputs.steerRight = false;
          break;
        case 'Space':
          this.inputs.handbrake = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.inputs.nitro = false;
          break;
        case 'KeyH':
          this.inputs.horn = false;
          break;
      }
    });
  }

  private bindPointerEvents() {
    const dom = this.renderer.domElement;

    dom.addEventListener('pointerdown', (e) => {
      // Primary button
      if (e.button === 0) {
        this.isPointerDown = true;
        this.lastPointerX = e.clientX;
        this.lastPointerY = e.clientY;
      }
    });

    window.addEventListener('pointermove', (e) => {
      if (!this.isPointerDown) return;
      const dx = e.clientX - this.lastPointerX;
      const dy = e.clientY - this.lastPointerY;
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;

      this.vehicleController.onPointerDrag(dx, dy);
    });

    const endDrag = () => {
      if (this.isPointerDown) {
        this.isPointerDown = false;
        this.vehicleController.onPointerRelease();
      }
    };

    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);
  }

  public setTouchInput(key: keyof VehicleInputs, value: boolean) {
    soundEngine.resume();
    this.touchInputs[key] = value;
  }

  public toggleCamera() {
    this.vehicleController.toggleCamera();
    this.onCameraToggle?.(this.vehicleController.cameraMode);
  }

  public toggleHeadlights() {
    const newState = this.vehicleController.toggleHeadlights();
    this.onHeadlightsToggle?.(newState);
    return newState;
  }

  public cycleHeadlights(): 'off' | 'low' | 'high' {
    const newMode = this.vehicleController.cycleHeadlightMode();
    this.onHeadlightsToggle?.(newMode !== 'off');
    return newMode;
  }

  public flashHeadlights() {
    this.vehicleController.flashHeadlights();
    this.onHeadlightsToggle?.(true);
  }

  public setHeadlights(on: boolean) {
    this.vehicleController.setHeadlights(on);
    this.onHeadlightsToggle?.(on);
  }

  public honkHorn() {
    soundEngine.resume();
    soundEngine.playHorn();
  }

  public updateSettings(saveData: SaveData) {
    this.saveData = saveData;
    this.vehicleController.updateSettings(saveData.settings);
    this.envManager.setRain(!!saveData.settings.rainWeather);
    this.camera.fov = saveData.settings.fieldOfView || 60;
    this.camera.updateProjectionMatrix();
  }

  public startRound(mode: GameMode, env: EnvironmentType, carId: CarId, freshSaveData: SaveData) {
    soundEngine.resume();
    this.mode = mode;
    this.envType = env;
    this.carId = carId;
    this.saveData = freshSaveData;

    this.envManager.setEnvironment(env, mode);
    this.envManager.setRain(!!freshSaveData.settings.rainWeather);
    this.trafficManager.setMode(mode);

    const carDef = CAR_CATALOG.find((c) => c.id === carId) || CAR_CATALOG[0];
    this.vehicleController.rebuildCar(
      carDef,
      this.saveData.carUpgrades[carId],
      this.saveData.carCustomizations[carId]
    );

    // Auto headlight in Night Drive or if user setting enabled
    const autoHeadlight = env === 'night' || this.saveData.settings.headlightAutoOn;
    this.vehicleController.setHeadlights(autoHeadlight);
    this.onHeadlightsToggle?.(autoHeadlight);

    this.vehicleController.reset(1.8);

    // Reset stats
    this.stats = {
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
      timeRemainingSec: mode === 'time_attack' ? 70 : 0,
      isGameOver: false,
    };

    soundEngine.startEngine();
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();

    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    this.tick();
  }

  public pause() {
    this.isPaused = true;
    soundEngine.stopEngine();
  }

  public resume() {
    if (!this.isRunning) return;
    this.isPaused = false;
    this.lastTime = performance.now();
    soundEngine.startEngine();
  }

  public stop() {
    this.isRunning = false;
    this.isPaused = false;
    soundEngine.stopEngine();
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  private triggerGameOver(reason: 'crash' | 'time_up') {
    if (this.stats.isGameOver) return;
    this.stats.isGameOver = true;
    this.stats.gameOverReason = reason;
    this.isRunning = false;

    soundEngine.playCrash();
    soundEngine.stopEngine();

    if (this.saveData.settings.cameraShake) {
      this.shakeIntensity = 0.8;
    }

    const earnings = calculateRunEarnings(
      this.stats.distanceM,
      this.stats.score,
      this.stats.nearMissCount,
      this.stats.wrongWayDurationSec,
      this.mode
    );

    if (this.onGameOver) {
      this.onGameOver({ stats: this.stats, earnings });
    }
  }

  private tick = () => {
    if (!this.isRunning) {
      this.renderer.render(this.scene, this.camera);
      return;
    }

    const now = performance.now();
    const rawDelta = (now - this.lastTime) / 1000;
    this.lastTime = now;
    const delta = Math.min(rawDelta, 0.08);

    if (!this.isPaused) {
      const combinedInputs: VehicleInputs = {
        accelerate: this.inputs.accelerate || !!this.touchInputs.accelerate,
        brake: this.inputs.brake || !!this.touchInputs.brake,
        steerLeft: this.inputs.steerLeft || !!this.touchInputs.steerLeft,
        steerRight: this.inputs.steerRight || !!this.touchInputs.steerRight,
        handbrake: this.inputs.handbrake || !!this.touchInputs.handbrake,
        nitro: this.inputs.nitro || !!this.touchInputs.nitro,
        horn: this.inputs.horn || !!this.touchInputs.horn,
      };

      // 1. Vehicle kinematics update
      const prevDist = this.vehicleController.distanceTraveledM;
      this.vehicleController.update(delta, combinedInputs);
      const currentDist = this.vehicleController.distanceTraveledM;
      const distanceDelta = Math.max(0, currentDist - prevDist);

      const playerZ = this.vehicleController.position.z;
      const playerX = this.vehicleController.position.x;
      const speedKmh = this.vehicleController.speedKmh;

      // 2. Road chunk recycling & 3D Rain particles
      this.envManager.update(playerZ, delta, speedKmh);

      // 3. Traffic simulation, Flash-To-Yield AI & Near-Miss check
      this.trafficManager.update(
        delta,
        playerZ,
        playerX,
        speedKmh,
        this.vehicleController.isFlashing,
        this.vehicleController.headlightMode === 'high',
        (nmResult) => {
        soundEngine.playNearMissDing();
        this.stats.nearMissCount++;
        this.stats.overtakeCount++;
        this.stats.combo = Math.min(10, this.stats.combo + 1);
        this.stats.comboTimer = 3.5;

        const comboMultiplier = 1 + (this.stats.combo - 1) * 0.25;
        const totalScoreBonus = Math.round(nmResult.scoreBonus * comboMultiplier);
        const totalCashBonus = Math.round(nmResult.cashBonus * comboMultiplier);

        this.stats.score += totalScoreBonus;
        this.stats.coins += totalCashBonus;

        if (this.mode === 'time_attack') {
          this.stats.timeRemainingSec = Math.min(99, this.stats.timeRemainingSec + 3);
        }

        if (this.onNearMiss) {
          this.onNearMiss({
            id: Date.now() + Math.random(),
            type: 'near_miss',
            title: 'NEAR MISS!',
            scoreBonus: totalScoreBonus,
            cashBonus: totalCashBonus,
            combo: this.stats.combo,
          });
        }
      });

      // 4. Night drive duration
      if (this.envType === 'night' && speedKmh > 20) {
        this.stats.nightDriveDurationSec += delta;
      }

      // 5. Wrong-way check
      const isWrongWay = isDrivingWrongWay(playerX, this.mode);
      if (isWrongWay && speedKmh > 50) {
        this.stats.wrongWayDurationSec += delta;
      }

      if (speedKmh > 130) {
        this.stats.highSpeedDurationSec += delta;
      }

      // 6. Distance Score
      const distPoints = calculateDistanceScore(distanceDelta, speedKmh, isWrongWay);
      this.stats.score += distPoints;
      this.stats.distanceM = Math.floor(currentDist);
      this.stats.speedKmh = Math.round(speedKmh);
      this.stats.nitroRemaining = Math.round(this.vehicleController.nitroRemaining);

      // 7. Combo decay
      if (this.stats.comboTimer > 0) {
        this.stats.comboTimer -= delta;
        if (this.stats.comboTimer <= 0) {
          this.stats.combo = 0;
        }
      }

      // 8. Time Attack Countdown
      if (this.mode === 'time_attack') {
        this.stats.timeRemainingSec -= delta;
        if (this.stats.timeRemainingSec <= 0) {
          this.stats.timeRemainingSec = 0;
          this.triggerGameOver('time_up');
        }
      }

      // 9. Collision detection
      const dims = this.vehicleController.model.dimensions;
      const collision = this.trafficManager.checkPlayerCollision(playerX, playerZ, dims.width, dims.length);
      if (collision) {
        if (this.mode === 'free_ride') {
          soundEngine.playCrash();
          this.vehicleController.speedKmh *= 0.35;
          if (this.saveData.settings.cameraShake) {
            this.shakeIntensity = 0.4;
          }
        } else {
          this.triggerGameOver('crash');
        }
      }

      // 10. Camera Shake
      if (this.shakeIntensity > 0) {
        this.camera.position.x += (Math.random() - 0.5) * this.shakeIntensity;
        this.camera.position.y += (Math.random() - 0.5) * this.shakeIntensity;
        this.shakeIntensity = THREE.MathUtils.damp(this.shakeIntensity, 0, 8, delta);
      }

      if (this.onStatsUpdate) {
        this.onStatsUpdate({ ...this.stats });
      }
    }

    this.renderer.render(this.scene, this.camera);
    this.animFrameId = requestAnimationFrame(this.tick);
  };

  public dispose() {
    this.stop();
    window.removeEventListener('resize', this.handleResize);
    this.envManager.dispose();
    this.trafficManager.dispose();
    this.vehicleController.dispose();
    this.renderer.dispose();
  }
}
