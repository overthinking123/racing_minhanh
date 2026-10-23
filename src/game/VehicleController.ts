/**
 * City Rush 3D - Vehicle Controller, Physics & Free-Look Camera (Update V2)
 * Mouse drag 360 camera viewing, cockpit look-around, auto-center, super-bright headlights (Z/X).
 */

import * as THREE from 'three';
import { CarDefinition, CarUpgradeLevels, CarCustomization, GameSettings } from './types';
import { computeEffectiveStats } from './rules';
import { buildPlayerCar, CarModelInstance } from './proceduralModels';
import { soundEngine } from './audio';

export interface VehicleInputs {
  accelerate: boolean;
  brake: boolean;
  steerLeft: boolean;
  steerRight: boolean;
  handbrake: boolean;
  nitro: boolean;
  horn: boolean;
  headlights?: boolean;
}

export class VehicleController {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private carDef: CarDefinition;
  private upgrades: CarUpgradeLevels;
  private customization: CarCustomization;
  private settings: GameSettings;
  public model: CarModelInstance;

  // Position & Kinematics
  public position = new THREE.Vector3(1.8, 0, 0);
  public speedKmh = 0;
  private velocityX = 0;
  private steerAngle = 0;
  private targetSteerAngle = 0;
  public distanceTraveledM = 0;

  // Nitro state
  public nitroRemaining = 100;
  public isNitroActive = false;

  // Headlights (Aozoom Bi-LED / Bi-Laser High Performance)
  public headlightMode: 'off' | 'low' | 'high' = 'low';
  public headlightsOn = true; // backward compat boolean
  public isFlashing = false;
  private flashTimer = 0;
  private flashPulsesRemaining = 0;
  public isRaining = false;
  private currentLowIntensity = 20.0;
  private currentLaserIntensity = 0.0;
  private currentBeamOpacity = 0.10;

  // Camera settings & Mouse look-around
  public cameraMode: 'chase' | 'cockpit' = 'chase';
  private currentCameraPos = new THREE.Vector3(1.8, 2.3, 5.5);
  private currentCameraLookAt = new THREE.Vector3(1.8, 1.2, -10);

  // Orbit rotation offsets from mouse dragging
  public orbitYaw = 0;   // Radians
  public orbitPitch = 0; // Radians
  private isUserInteractingWithCamera = false;
  private autoCenterIdleTimer = 0;

  private readonly ROAD_LIMIT_X = 6.8;

  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    carDef: CarDefinition,
    upgrades: CarUpgradeLevels,
    customization: CarCustomization,
    settings: GameSettings,
    initialCameraMode: 'chase' | 'cockpit' = 'chase'
  ) {
    this.scene = scene;
    this.camera = camera;
    this.carDef = carDef;
    this.upgrades = upgrades;
    this.customization = customization;
    this.settings = settings;
    this.cameraMode = initialCameraMode;
    this.headlightMode = settings.headlightAutoOn ? 'low' : 'off';
    this.headlightsOn = this.headlightMode !== 'off';
    this.isRaining = !!settings.rainWeather;

    this.model = buildPlayerCar(
      carDef.id,
      customization.color,
      customization.spoiler,
      customization.rimColor
    );
    this.model.group.position.copy(this.position);
    this.scene.add(this.model.group);

    this.applyHeadlightsState();
  }

  public rebuildCar(carDef: CarDefinition, upgrades: CarUpgradeLevels, customization: CarCustomization) {
    this.carDef = carDef;
    this.upgrades = upgrades;
    this.customization = customization;

    const oldPos = this.position.clone();
    this.scene.remove(this.model.group);

    this.model = buildPlayerCar(
      carDef.id,
      customization.color,
      customization.spoiler,
      customization.rimColor
    );
    this.position.copy(oldPos);
    this.model.group.position.copy(this.position);
    this.scene.add(this.model.group);

    this.applyHeadlightsState();
  }

  public updateSettings(settings: GameSettings) {
    this.settings = settings;
    this.isRaining = !!settings.rainWeather;
  }

  public toggleCamera() {
    this.cameraMode = this.cameraMode === 'chase' ? 'cockpit' : 'chase';
    this.orbitYaw = 0;
    this.orbitPitch = 0;
    this.autoCenterIdleTimer = 0;
    soundEngine.playClick();
  }

  public toggleHeadlights(): boolean {
    if (this.headlightMode === 'off') {
      this.headlightMode = 'low';
    } else {
      this.headlightMode = 'off';
    }
    this.headlightsOn = this.headlightMode !== 'off';
    this.applyHeadlightsState();
    soundEngine.playClick();
    return this.headlightsOn;
  }

  public cycleHeadlightMode(): 'off' | 'low' | 'high' {
    if (this.headlightMode === 'off') {
      this.headlightMode = 'low';
    } else if (this.headlightMode === 'low') {
      this.headlightMode = 'high';
    } else {
      this.headlightMode = 'off';
    }
    this.headlightsOn = this.headlightMode !== 'off';
    this.applyHeadlightsState();
    soundEngine.playClick();
    return this.headlightMode;
  }

  public setHeadlightMode(mode: 'off' | 'low' | 'high') {
    this.headlightMode = mode;
    this.headlightsOn = mode !== 'off';
    this.applyHeadlightsState();
  }

  public setHeadlights(on: boolean) {
    this.headlightMode = on ? (this.headlightMode === 'off' ? 'low' : this.headlightMode) : 'off';
    this.headlightsOn = on;
    this.applyHeadlightsState();
  }

  /**
   * Bi-Laser Flash Flasher ('Nháy Pha Xin Đường'): Rapid 3-burst laser strobe
   * Signals traffic AI ahead in lane to yield path
   */
  public flashHeadlights() {
    this.isFlashing = true;
    this.flashPulsesRemaining = 6; // 3 on-off cycles
    this.flashTimer = 0;
    soundEngine.playClick();
    this.applyHeadlightsState();
  }

  public applyHeadlightsState() {
    // Laser high is active if mode is high, or during an odd pulse of flashing
    const isLaserHighActive =
      this.headlightMode === 'high' ||
      (this.isFlashing && this.flashPulsesRemaining % 2 === 1);
    const isLowActive = this.headlightMode !== 'off' || isLaserHighActive;

    const targetLow = isLaserHighActive ? 25.0 : isLowActive ? 20.0 : 0.0;
    const targetLaser = isLaserHighActive ? 55.0 : 0.0;
    const targetBeam = isLaserHighActive ? 0.35 : isLowActive ? 0.12 : 0.0;

    if (this.isFlashing) {
      this.currentLowIntensity = targetLow;
      this.currentLaserIntensity = targetLaser;
      this.currentBeamOpacity = targetBeam;
    }

    this.model.headlightSpots.forEach((spot) => {
      spot.intensity = this.currentLowIntensity;
    });

    this.model.laserSpotLights.forEach((spot) => {
      spot.intensity = this.currentLaserIntensity;
    });

    this.model.headlightsMaterial.emissiveIntensity = isLaserHighActive ? 5.5 : isLowActive ? 3.5 : 0.2;
    this.model.laserProjectorMaterial.emissiveIntensity = isLaserHighActive ? 7.5 : isLowActive ? 2.5 : 0.3;

    this.model.laserBeamMaterials.forEach((mat) => {
      mat.opacity = this.currentBeamOpacity;
    });
  }

  // Mouse & Touch Drag Look-Around Handler
  public onPointerDrag(deltaX: number, deltaY: number) {
    this.isUserInteractingWithCamera = true;
    this.autoCenterIdleTimer = 0;

    const sens = (this.settings.mouseSensitivity || 1.0) * 0.005;

    this.orbitYaw -= deltaX * sens;
    this.orbitPitch -= deltaY * sens;

    // Apply limits based on camera mode
    if (this.cameraMode === 'cockpit') {
      // Driver can look left/right up to ~80 deg, and pitch up/down ~25 deg
      this.orbitYaw = THREE.MathUtils.clamp(this.orbitYaw, -Math.PI * 0.45, Math.PI * 0.45);
      this.orbitPitch = THREE.MathUtils.clamp(this.orbitPitch, -Math.PI * 0.15, Math.PI * 0.15);
    } else {
      // Chase camera can orbit full 360 horizontally, and pitch between -10 deg and 60 deg
      this.orbitPitch = THREE.MathUtils.clamp(this.orbitPitch, -Math.PI * 0.06, Math.PI * 0.35);
    }
  }

  public onPointerRelease() {
    this.isUserInteractingWithCamera = false;
    this.autoCenterIdleTimer = 0;
  }

  public reset(startX: number = 1.8) {
    this.position.set(startX, 0, 0);
    this.speedKmh = 0;
    this.velocityX = 0;
    this.steerAngle = 0;
    this.targetSteerAngle = 0;
    this.distanceTraveledM = 0;
    this.nitroRemaining = 100;
    this.isNitroActive = false;
    this.orbitYaw = 0;
    this.orbitPitch = 0;

    this.model.group.position.copy(this.position);
    this.model.group.rotation.set(0, 0, 0);
    this.model.nitroFlameMaterial.opacity = 0;

    this.currentCameraPos.set(startX, 2.3, 5.5);
    this.currentCameraLookAt.set(startX, 1.2, -10);
    this.setHeadlights(this.headlightsOn);
  }

  public update(delta: number, inputs: VehicleInputs) {
    const stats = computeEffectiveStats(this.carDef.baseStats, this.upgrades);

    // 0. Flashing Pulse Timer & Smooth Aozoom Lighting Transition
    if (this.flashPulsesRemaining > 0) {
      this.flashTimer += delta;
      if (this.flashTimer >= 0.09) {
        this.flashTimer = 0;
        this.flashPulsesRemaining--;
        if (this.flashPulsesRemaining <= 0) {
          this.isFlashing = false;
        }
        this.applyHeadlightsState();
      }
    } else {
      // Smooth Cos / Pha / Off transitions
      const isLaserHighActive = this.headlightMode === 'high';
      const isLowActive = this.headlightMode !== 'off';
      const targetLow = isLaserHighActive ? 25.0 : isLowActive ? 20.0 : 0.0;
      const targetLaser = isLaserHighActive ? 55.0 : 0.0;
      const targetBeam = isLaserHighActive ? 0.35 : isLowActive ? 0.12 : 0.0;

      const lerpSpeed = 12;
      this.currentLowIntensity = THREE.MathUtils.damp(this.currentLowIntensity, targetLow, lerpSpeed, delta);
      this.currentLaserIntensity = THREE.MathUtils.damp(this.currentLaserIntensity, targetLaser, lerpSpeed, delta);
      this.currentBeamOpacity = THREE.MathUtils.damp(this.currentBeamOpacity, targetBeam, lerpSpeed, delta);

      this.model.headlightSpots.forEach((spot) => {
        spot.intensity = this.currentLowIntensity;
      });
      this.model.laserSpotLights.forEach((spot) => {
        spot.intensity = this.currentLaserIntensity;
      });
      this.model.laserBeamMaterials.forEach((mat) => {
        mat.opacity = this.currentBeamOpacity;
      });
    }

    // 1. Horn
    if (inputs.horn) {
      soundEngine.playHorn();
    }

    // 2. Nitro Boost logic
    if (inputs.nitro && this.nitroRemaining > 0 && inputs.accelerate) {
      if (!this.isNitroActive) {
        soundEngine.startNitro();
      }
      this.isNitroActive = true;
      this.nitroRemaining = Math.max(0, this.nitroRemaining - 25 * delta);
    } else {
      if (this.isNitroActive) {
        soundEngine.stopNitro();
      }
      this.isNitroActive = false;
      this.nitroRemaining = Math.min(100, this.nitroRemaining + 4 * delta);
    }

    // Flame flare visibility & flicker
    if (this.isNitroActive) {
      this.model.nitroFlameMaterial.opacity = 0.8 + Math.random() * 0.2;
      this.model.nitroFlameMesh.scale.set(
        1 + Math.random() * 0.3,
        1 + Math.random() * 0.4,
        1 + Math.random() * 0.3
      );
    } else {
      this.model.nitroFlameMaterial.opacity = 0;
    }

    // 3. Longitudinal Acceleration & Braking with Rain Wet Road Physics
    const maxSpeed = stats.topSpeedKmh * (this.isNitroActive ? stats.nitroPower : 1.0);
    const accelRate = stats.acceleration * (this.isNitroActive ? 1.6 : 1.0) * 3.6;
    // Wet road extends braking distance slightly
    const rainBrakeFactor = this.isRaining ? 0.82 : 1.0;
    const brakeRate = stats.braking * 5.2 * 3.6 * rainBrakeFactor;
    const handbrakeRate = stats.braking * 7.8 * 3.6 * rainBrakeFactor;
    const rollingResistance = 12.0;

    if (inputs.accelerate) {
      if (this.speedKmh < maxSpeed) {
        const powerCurve = Math.max(0.25, 1.0 - (this.speedKmh / maxSpeed) * 0.72);
        this.speedKmh += accelRate * powerCurve * delta;
      }
    } else if (inputs.brake) {
      this.speedKmh -= brakeRate * delta;
    } else {
      this.speedKmh -= rollingResistance * delta;
    }

    if (inputs.handbrake) {
      this.speedKmh -= handbrakeRate * delta;
    }

    this.speedKmh = Math.max(0, Math.min(maxSpeed * 1.15, this.speedKmh));

    // 4. Brake lights
    const isBraking = inputs.brake || inputs.handbrake;
    if (isBraking && this.speedKmh > 5) {
      this.model.brakeLightsMaterial.emissiveIntensity = 3.8;
    } else {
      this.model.brakeLightsMaterial.emissiveIntensity = 0.35;
    }

    // 5. Lateral Steering (Tire grip reduced by ~22% in rain for realistic slick feel)
    let steerInput = 0;
    if (inputs.steerLeft) steerInput -= 1;
    if (inputs.steerRight) steerInput += 1;

    const rainGripFactor = this.isRaining ? 0.78 : 1.0;
    const speedFactor = Math.min(1.0, this.speedKmh / 45);
    const highSpeedDamp = Math.max(0.42, 1.0 - (this.speedKmh / 350) * 0.5);
    const maxTurnSpeed = stats.handling * (this.settings.steeringSensitivity || 1.0) * 1.5 * speedFactor * highSpeedDamp * rainGripFactor;

    this.targetSteerAngle = steerInput * 0.32;
    this.steerAngle = THREE.MathUtils.damp(this.steerAngle, this.targetSteerAngle, 12, delta);

    const targetVelX = steerInput * maxTurnSpeed;
    this.velocityX = THREE.MathUtils.damp(this.velocityX, targetVelX, 10, delta);

    this.position.x += this.velocityX * delta;

    if (this.position.x > this.ROAD_LIMIT_X) {
      this.position.x = this.ROAD_LIMIT_X;
      this.velocityX = -this.velocityX * 0.4;
      this.speedKmh *= 0.96;
    } else if (this.position.x < -this.ROAD_LIMIT_X) {
      this.position.x = -this.ROAD_LIMIT_X;
      this.velocityX = -this.velocityX * 0.4;
      this.speedKmh *= 0.96;
    }

    // 6. Longitudinal Movement
    const speedMs = this.speedKmh / 3.6;
    const distanceDelta = speedMs * delta;
    this.position.z -= distanceDelta;
    this.distanceTraveledM += distanceDelta;

    // 7. Update 3D Model position and rotations
    this.model.group.position.copy(this.position);

    const bodyRoll = -this.velocityX * 0.02;
    const bodyPitch = inputs.accelerate ? 0.015 : isBraking ? -0.025 : 0;
    const bodyYaw = -this.steerAngle * 0.25;

    this.model.group.rotation.set(bodyPitch, bodyYaw, bodyRoll);

    // Steer front wheels & interior steering wheel
    this.model.frontWheels.forEach((w) => {
      w.rotation.y = this.steerAngle;
    });

    if (this.model.steeringWheelMesh) {
      this.model.steeringWheelMesh.rotation.z = -this.steerAngle * 2.8;
    }

    // Wheel rolling rotation
    const wheelCircumference = 2 * Math.PI * 0.35;
    const wheelRotDelta = (distanceDelta / wheelCircumference) * (2 * Math.PI);
    this.model.allWheels.forEach((w) => {
      w.rotation.x -= wheelRotDelta;
    });

    // 8. Sound Engine
    soundEngine.updateEngine(this.speedKmh, inputs.accelerate, isBraking);

    // 9. Camera Smoothing, Mouse Drag & Auto-Center
    this.updateCamera(delta);
  }

  private updateCamera(delta: number) {
    // Auto-center camera back to neutral driving angle after 1.2s of inactivity
    if (!this.isUserInteractingWithCamera && this.settings.cameraAutoCenter) {
      this.autoCenterIdleTimer += delta;
      if (this.autoCenterIdleTimer > 1.2) {
        this.orbitYaw = THREE.MathUtils.damp(this.orbitYaw, 0, 4, delta);
        this.orbitPitch = THREE.MathUtils.damp(this.orbitPitch, 0, 4, delta);
      }
    }

    const isCockpit = this.cameraMode === 'cockpit';

    if (isCockpit) {
      const offset = this.model.cockpitCameraOffset;
      const eyePos = new THREE.Vector3(
        this.position.x + offset.x,
        this.position.y + offset.y,
        this.position.z + offset.z
      );

      this.currentCameraPos.copy(eyePos);

      // Compute look-at forward vector modified by orbit angles
      const lookDist = 40;
      const lookTarget = new THREE.Vector3(
        eyePos.x - Math.sin(this.orbitYaw) * lookDist,
        eyePos.y + Math.sin(this.orbitPitch) * lookDist * 0.6,
        eyePos.z - Math.cos(this.orbitYaw) * lookDist
      );

      this.currentCameraLookAt.lerp(lookTarget, 0.4);

      this.camera.position.copy(this.currentCameraPos);
      this.camera.lookAt(this.currentCameraLookAt);

      const baseFov = this.settings.fieldOfView || 70;
      const targetFov = baseFov + (this.speedKmh / 280) * 16 + (this.isNitroActive ? 10 : 0);
      this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 6, delta);
      this.camera.updateProjectionMatrix();

    } else {
      // Chase View with 360 orbit around the vehicle
      const offset = this.model.chaseCameraOffset;
      const radius = Math.sqrt(offset.y * offset.y + offset.z * offset.z);

      // Spherical coordinates from orbitYaw and orbitPitch
      const effectivePitch = Math.atan2(offset.y, offset.z) + this.orbitPitch;
      const camY = Math.sin(effectivePitch) * radius;
      const camDistHoriz = Math.cos(effectivePitch) * radius;

      const camX = this.position.x * 0.85 - Math.sin(this.orbitYaw) * camDistHoriz;
      const camZ = this.position.z + Math.cos(this.orbitYaw) * camDistHoriz;

      const targetPos = new THREE.Vector3(camX, this.position.y + camY, camZ);

      this.currentCameraPos.x = THREE.MathUtils.damp(this.currentCameraPos.x, targetPos.x, 9, delta);
      this.currentCameraPos.y = THREE.MathUtils.damp(this.currentCameraPos.y, targetPos.y, 10, delta);
      this.currentCameraPos.z = THREE.MathUtils.damp(this.currentCameraPos.z, targetPos.z, 14, delta);

      const carFocusPoint = new THREE.Vector3(
        this.position.x * 0.95,
        this.position.y + 1.1,
        this.position.z - (Math.cos(this.orbitYaw) > 0 ? 8 : -8)
      );
      this.currentCameraLookAt.lerp(carFocusPoint, 0.28);

      this.camera.position.copy(this.currentCameraPos);
      this.camera.lookAt(this.currentCameraLookAt);

      const baseFov = this.settings.fieldOfView || 60;
      const targetFov = baseFov + (this.speedKmh / 280) * 16 + (this.isNitroActive ? 8 : 0);
      this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 6, delta);
      this.camera.updateProjectionMatrix();
    }
  }

  public dispose() {
    this.scene.remove(this.model.group);
  }
}
