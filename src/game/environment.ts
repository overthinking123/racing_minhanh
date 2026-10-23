/**
 * City Rush 3D - Procedural Endless Road & Environment System
 * Handles road recycling, markings, streetlights, scenery props for 4 environments.
 */

import * as THREE from 'three';
import { EnvironmentType, GameMode } from './types';
import { ENVIRONMENTS } from './rules';

export const CHUNK_LENGTH = 70; // Length of each road chunk in meters
export const CHUNK_COUNT = 6;   // Number of active chunks kept in pool (420m visible)
export const ROAD_WIDTH = 15.6; // 4 lanes of 3.6m + shoulders
export const LANE_CENTERS = [-5.4, -1.8, 1.8, 5.4]; // X position for 4 lanes

export interface RoadChunk {
  group: THREE.Group;
  zCenter: number;
}

export class EnvironmentManager {
  private scene: THREE.Scene;
  private currentEnv: EnvironmentType;
  private currentMode: GameMode;
  private chunks: RoadChunk[] = [];
  private chunkPool: THREE.Group[] = [];
  private roadMaterial: THREE.MeshStandardMaterial;
  private shoulderMaterial: THREE.MeshStandardMaterial;
  private whiteMarkingMaterial: THREE.MeshBasicMaterial;
  private yellowMarkingMaterial: THREE.MeshBasicMaterial;
  private barrierMaterial: THREE.MeshStandardMaterial;
  private propMaterials: Record<string, THREE.Material> = {};

  // Rain Weather System
  public isRaining: boolean = false;
  private rainParticles: THREE.Points | null = null;
  private rainGeo: THREE.BufferGeometry | null = null;
  private rainPositions: Float32Array | null = null;
  private readonly RAIN_COUNT = 2400;

  // Lighting
  private dirLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;

  constructor(scene: THREE.Scene, envType: EnvironmentType, mode: GameMode, initialRain: boolean = false) {
    this.scene = scene;
    this.currentEnv = envType;
    this.currentMode = mode;
    this.isRaining = initialRain;

    // Materials
    this.roadMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e242c,
      roughness: initialRain ? 0.22 : 0.85,
      metalness: initialRain ? 0.45 : 0.1,
    });

    this.shoulderMaterial = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.9,
    });

    this.whiteMarkingMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.yellowMarkingMaterial = new THREE.MeshBasicMaterial({ color: 0xfacc15 });

    this.barrierMaterial = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.7,
      roughness: 0.35,
    });

    // Lights
    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.7);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xffffff, 1.3);
    this.dirLight.position.set(20, 45, -30);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.bias = -0.0005;
    this.scene.add(this.dirLight);

    this.setupEnvironmentTheme();
    this.initRoadChunks();
    if (this.isRaining) {
      this.initRain();
    }
  }

  public setRain(raining: boolean) {
    this.isRaining = raining;
    if (raining) {
      this.roadMaterial.roughness = 0.22;
      this.roadMaterial.metalness = 0.45;
      if (!this.rainParticles) {
        this.initRain();
      } else {
        this.rainParticles.visible = true;
      }
    } else {
      this.roadMaterial.roughness = 0.85;
      this.roadMaterial.metalness = 0.1;
      if (this.rainParticles) {
        this.rainParticles.visible = false;
      }
    }
  }

  private initRain() {
    this.rainGeo = new THREE.BufferGeometry();
    this.rainPositions = new Float32Array(this.RAIN_COUNT * 3);

    for (let i = 0; i < this.RAIN_COUNT; i++) {
      this.rainPositions[i * 3] = (Math.random() - 0.5) * 44;     // X: spanning road & sides
      this.rainPositions[i * 3 + 1] = Math.random() * 32;          // Y: 0 to 32m height
      this.rainPositions[i * 3 + 2] = -Math.random() * 120 + 20;   // Z: around player
    }

    this.rainGeo.setAttribute('position', new THREE.BufferAttribute(this.rainPositions, 3));

    const rainMat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.28,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.rainParticles = new THREE.Points(this.rainGeo, rainMat);
    this.scene.add(this.rainParticles);
  }

  public setEnvironment(envType: EnvironmentType, mode: GameMode) {
    this.currentEnv = envType;
    this.currentMode = mode;
    this.setupEnvironmentTheme();
    this.rebuildAllChunks();
  }

  private setupEnvironmentTheme() {
    const envDef = ENVIRONMENTS.find((e) => e.id === this.currentEnv) || ENVIRONMENTS[0];

    const fogColor = new THREE.Color(envDef.fogColor);
    this.scene.background = fogColor;
    this.scene.fog = new THREE.FogExp2(fogColor, this.currentEnv === 'night' ? 0.0075 : 0.0045);

    if (this.currentEnv === 'city') {
      this.hemiLight.color.setHex(0xdbeafe);
      this.hemiLight.groundColor.setHex(0x334155);
      this.hemiLight.intensity = 0.9;
      this.dirLight.color.setHex(0xfffaf0);
      this.dirLight.intensity = 1.4;
      this.dirLight.position.set(30, 50, -40);
    } else if (this.currentEnv === 'highway') {
      this.hemiLight.color.setHex(0xfef3c7);
      this.hemiLight.groundColor.setHex(0x78350f);
      this.hemiLight.intensity = 0.8;
      this.dirLight.color.setHex(0xfb923c);
      this.dirLight.intensity = 1.6;
      this.dirLight.position.set(-40, 30, -50);
    } else if (this.currentEnv === 'night') {
      this.hemiLight.color.setHex(0x0f172a);
      this.hemiLight.groundColor.setHex(0x020617);
      this.hemiLight.intensity = 0.22;
      this.dirLight.color.setHex(0x38bdf8);
      this.dirLight.intensity = 0.25;
      this.dirLight.position.set(10, 40, -20);
    } else if (this.currentEnv === 'coastal') {
      this.hemiLight.color.setHex(0xe0f2fe);
      this.hemiLight.groundColor.setHex(0x0c4a6e);
      this.hemiLight.intensity = 1.0;
      this.dirLight.color.setHex(0xffedd5);
      this.dirLight.intensity = 1.5;
      this.dirLight.position.set(40, 40, -30);
    }
  }

  private initRoadChunks() {
    // Spawn initial continuous chunks starting at z = 30 and extending forward to -390
    for (let i = 0; i < CHUNK_COUNT; i++) {
      const zCenter = 20 - i * CHUNK_LENGTH;
      const chunkGroup = this.buildSingleChunk(zCenter);
      this.scene.add(chunkGroup);
      this.chunks.push({
        group: chunkGroup,
        zCenter,
      });
    }
  }

  private buildSingleChunk(zCenter: number): THREE.Group {
    const chunk = new THREE.Group();
    chunk.position.set(0, 0, zCenter);

    // 1. Road Surface
    const roadGeo = new THREE.PlaneGeometry(ROAD_WIDTH, CHUNK_LENGTH);
    roadGeo.rotateX(-Math.PI / 2);
    const road = new THREE.Mesh(roadGeo, this.roadMaterial);
    road.position.y = 0;
    chunk.add(road);

    // 2. Shoulders / curbs (left & right)
    const curbGeo = new THREE.BoxGeometry(1.5, 0.15, CHUNK_LENGTH);
    const curbL = new THREE.Mesh(curbGeo, this.shoulderMaterial);
    curbL.position.set(-ROAD_WIDTH * 0.5 - 0.75, 0.05, 0);
    const curbR = new THREE.Mesh(curbGeo, this.shoulderMaterial);
    curbR.position.set(ROAD_WIDTH * 0.5 + 0.75, 0.05, 0);
    chunk.add(curbL, curbR);

    // 3. Guard Rails
    const railGeo = new THREE.BoxGeometry(0.2, 0.6, CHUNK_LENGTH);
    const railL = new THREE.Mesh(railGeo, this.barrierMaterial);
    railL.position.set(-ROAD_WIDTH * 0.5 - 1.4, 0.45, 0);
    const railR = new THREE.Mesh(railGeo, this.barrierMaterial);
    railR.position.set(ROAD_WIDTH * 0.5 + 1.4, 0.45, 0);
    chunk.add(railL, railR);

    // 4. Road Markings
    // Outer solid white edges
    const edgeMarkGeo = new THREE.PlaneGeometry(0.2, CHUNK_LENGTH);
    edgeMarkGeo.rotateX(-Math.PI / 2);
    const edgeL = new THREE.Mesh(edgeMarkGeo, this.whiteMarkingMaterial);
    edgeL.position.set(-ROAD_WIDTH * 0.5 + 0.25, 0.015, 0);
    const edgeR = new THREE.Mesh(edgeMarkGeo, this.whiteMarkingMaterial);
    edgeR.position.set(ROAD_WIDTH * 0.5 - 0.25, 0.015, 0);
    chunk.add(edgeL, edgeR);

    // Center divider (Two yellow lines in two_way, or single dashed in one_way)
    if (this.currentMode === 'two_way') {
      const yellowLine1 = new THREE.Mesh(edgeMarkGeo, this.yellowMarkingMaterial);
      yellowLine1.position.set(-0.25, 0.015, 0);
      const yellowLine2 = new THREE.Mesh(edgeMarkGeo, this.yellowMarkingMaterial);
      yellowLine2.position.set(0.25, 0.015, 0);
      chunk.add(yellowLine1, yellowLine2);
    } else {
      // Dashed white center line
      this.addDashedLine(chunk, 0, this.whiteMarkingMaterial);
    }

    // Lane divider dashed lines (at X = -3.6 and X = 3.6)
    this.addDashedLine(chunk, -3.6, this.whiteMarkingMaterial);
    this.addDashedLine(chunk, 3.6, this.whiteMarkingMaterial);

    // 5. Street lamps (every ~35m on sides)
    [-CHUNK_LENGTH * 0.25, CHUNK_LENGTH * 0.25].forEach((lampZ) => {
      this.addStreetLamp(chunk, -ROAD_WIDTH * 0.5 - 1.6, lampZ, true);
      this.addStreetLamp(chunk, ROAD_WIDTH * 0.5 + 1.6, lampZ, false);
    });

    // 6. Environment Props
    this.addEnvironmentProps(chunk);

    return chunk;
  }

  private addDashedLine(parent: THREE.Group, xPos: number, material: THREE.Material) {
    const dashLength = 4.0;
    const gapLength = 4.0;
    const totalDashes = Math.floor(CHUNK_LENGTH / (dashLength + gapLength));
    const dashGeo = new THREE.PlaneGeometry(0.18, dashLength);
    dashGeo.rotateX(-Math.PI / 2);

    for (let i = 0; i < totalDashes; i++) {
      const z = -CHUNK_LENGTH * 0.5 + i * (dashLength + gapLength) + dashLength * 0.5 + 2;
      const dash = new THREE.Mesh(dashGeo, material);
      dash.position.set(xPos, 0.015, z);
      parent.add(dash);
    }
  }

  private addStreetLamp(parent: THREE.Group, x: number, z: number, isLeft: boolean) {
    const poleGeo = new THREE.CylinderGeometry(0.08, 0.12, 6.5, 6);
    const poleMat = this.barrierMaterial;
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(x, 3.25, z);

    // Lamp arm
    const armGeo = new THREE.BoxGeometry(1.8, 0.08, 0.1);
    const arm = new THREE.Mesh(armGeo, poleMat);
    arm.position.set(isLeft ? x + 0.9 : x - 0.9, 6.4, z);

    // Glowing bulb
    const bulbMat = new THREE.MeshStandardMaterial({
      color: 0xffedd5,
      emissive: 0xfbbf24,
      emissiveIntensity: this.currentEnv === 'night' ? 3.0 : 0.8,
    });
    const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 0.3), bulbMat);
    bulb.position.set(isLeft ? x + 1.6 : x - 1.6, 6.3, z);

    parent.add(pole, arm, bulb);
  }

  private addEnvironmentProps(chunk: THREE.Group) {
    const env = this.currentEnv;

    if (env === 'city' || env === 'night') {
      // Modern City Skyscrapers / Neon towers along both sides
      const buildingColors = [0x1e293b, 0x0f172a, 0x334155, 0x1e1e24];
      const neonColors = [0x06b6d4, 0xf43f5e, 0x8b5cf6, 0x10b981, 0xf59e0b];

      [-CHUNK_LENGTH * 0.3, 0, CHUNK_LENGTH * 0.3].forEach((zOffset, idx) => {
        // Left side skyscraper
        const hL = 25 + Math.random() * 40;
        const wL = 12 + Math.random() * 8;
        const dL = 14 + Math.random() * 10;
        const bL = new THREE.Mesh(
          new THREE.BoxGeometry(wL, hL, dL),
          new THREE.MeshStandardMaterial({
            color: buildingColors[idx % buildingColors.length],
            roughness: 0.4,
            metalness: 0.6,
          })
        );
        bL.position.set(-ROAD_WIDTH * 0.5 - 12 - wL * 0.5, hL * 0.5, zOffset);
        chunk.add(bL);

        // Right side skyscraper
        const hR = 20 + Math.random() * 35;
        const wR = 14 + Math.random() * 8;
        const dR = 12 + Math.random() * 10;
        const bR = new THREE.Mesh(
          new THREE.BoxGeometry(wR, hR, dR),
          new THREE.MeshStandardMaterial({
            color: buildingColors[(idx + 1) % buildingColors.length],
            roughness: 0.4,
            metalness: 0.6,
          })
        );
        bR.position.set(ROAD_WIDTH * 0.5 + 12 + wR * 0.5, hR * 0.5, zOffset);
        chunk.add(bR);

        // Neon Billboard on rooftops or road verge
        if (idx === 1) {
          const boardW = 8;
          const boardH = 3.5;
          const boardColor = neonColors[Math.floor(Math.random() * neonColors.length)];
          const billboard = new THREE.Mesh(
            new THREE.BoxGeometry(boardW, boardH, 0.4),
            new THREE.MeshStandardMaterial({
              color: 0x000000,
              emissive: boardColor,
              emissiveIntensity: env === 'night' ? 2.5 : 1.2,
            })
          );
          billboard.position.set(ROAD_WIDTH * 0.5 + 4, 5.5, zOffset);
          const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 4), this.barrierMaterial);
          pole.position.set(ROAD_WIDTH * 0.5 + 4, 2, zOffset);
          chunk.add(billboard, pole);
        }
      });
    } else if (env === 'highway') {
      // Desert sand terrain + red rock plateaus
      const terrainGeo = new THREE.PlaneGeometry(60, CHUNK_LENGTH);
      terrainGeo.rotateX(-Math.PI / 2);
      const sandMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.95 });
      const sandL = new THREE.Mesh(terrainGeo, sandMat);
      sandL.position.set(-ROAD_WIDTH * 0.5 - 30, -0.05, 0);
      const sandR = new THREE.Mesh(terrainGeo, sandMat);
      sandR.position.set(ROAD_WIDTH * 0.5 + 30, -0.05, 0);
      chunk.add(sandL, sandR);

      // Rock formations
      [-CHUNK_LENGTH * 0.25, CHUNK_LENGTH * 0.25].forEach((zOff) => {
        const rockH = 8 + Math.random() * 12;
        const rockGeo = new THREE.ConeGeometry(7, rockH, 6);
        const rockMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.9 });
        const rock = new THREE.Mesh(rockGeo, rockMat);
        rock.position.set(-ROAD_WIDTH * 0.5 - 15 - Math.random() * 10, rockH * 0.5, zOff);
        chunk.add(rock);
      });
    } else if (env === 'coastal') {
      // Ocean water plane on right side, palm trees on left side
      const oceanGeo = new THREE.PlaneGeometry(80, CHUNK_LENGTH);
      oceanGeo.rotateX(-Math.PI / 2);
      const oceanMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        roughness: 0.15,
        metalness: 0.8,
      });
      const ocean = new THREE.Mesh(oceanGeo, oceanMat);
      ocean.position.set(ROAD_WIDTH * 0.5 + 40, -0.2, 0);
      chunk.add(ocean);

      // Palm trees on left side
      [-CHUNK_LENGTH * 0.3, 0, CHUNK_LENGTH * 0.3].forEach((zOff) => {
        const treeGroup = new THREE.Group();
        const trunkGeo = new THREE.CylinderGeometry(0.18, 0.28, 6, 7);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = 3;
        trunk.rotation.z = -0.08;

        const leavesGeo = new THREE.ConeGeometry(2.4, 2.0, 7);
        const leavesMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 });
        const leaves = new THREE.Mesh(leavesGeo, leavesMat);
        leaves.position.set(-0.25, 6, 0);

        treeGroup.add(trunk, leaves);
        treeGroup.position.set(-ROAD_WIDTH * 0.5 - 3.5, 0, zOff);
        chunk.add(treeGroup);
      });
    }
  }

  /**
   * Updates chunks positions and rain particle simulation as player moves
   */
  public update(playerZ: number, delta: number = 0.016, speedKmh: number = 0) {
    // Keep chunks ahead of player:
    const frontChunk = this.chunks.reduce((min, c) => (c.zCenter < min.zCenter ? c : min), this.chunks[0]);
    const rearThreshold = playerZ + CHUNK_LENGTH * 1.2;

    this.chunks.forEach((chunk) => {
      if (chunk.zCenter > rearThreshold) {
        // Move chunk to the very front
        const newZ = frontChunk.zCenter - CHUNK_LENGTH;
        chunk.zCenter = newZ;
        chunk.group.position.z = newZ;
      }
    });

    // Update light position to follow player so shadows and highlights are always crisp
    this.dirLight.position.z = playerZ - 30;
    this.dirLight.target.position.set(0, 0, playerZ - 15);
    this.dirLight.target.updateMatrixWorld();

    // 3D Rain Particle Animation
    if (this.isRaining && this.rainPositions && this.rainGeo && this.rainParticles && this.rainParticles.visible) {
      const speedMs = speedKmh / 3.6;
      const fallSpeed = 30.0; // m/s downwards
      const count = this.RAIN_COUNT;

      for (let i = 0; i < count; i++) {
        // Y moves down
        this.rainPositions[i * 3 + 1] -= fallSpeed * delta;
        // Z moves back relative to car speed
        this.rainPositions[i * 3 + 2] += speedMs * delta * 0.35;

        // Recycle raindrop if hits ground or falls too far behind player
        const relZ = this.rainPositions[i * 3 + 2] - playerZ;
        if (this.rainPositions[i * 3 + 1] <= 0.05 || relZ > 25 || relZ < -110) {
          this.rainPositions[i * 3] = (Math.random() - 0.5) * 44;
          this.rainPositions[i * 3 + 1] = 22 + Math.random() * 12;
          this.rainPositions[i * 3 + 2] = playerZ - Math.random() * 95 - 5;
        }
      }

      this.rainGeo.attributes.position.needsUpdate = true;
    }
  }

  private rebuildAllChunks() {
    this.chunks.forEach((c) => this.scene.remove(c.group));
    this.chunks = [];
    this.initRoadChunks();
  }

  public dispose() {
    this.chunks.forEach((c) => this.scene.remove(c.group));
    this.chunks = [];
    if (this.rainParticles) {
      this.scene.remove(this.rainParticles);
      this.rainGeo?.dispose();
    }
    this.scene.remove(this.hemiLight, this.dirLight);
  }
}
