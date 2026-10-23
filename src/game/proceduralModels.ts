/**
 * City Rush 3D - Procedural 3D Car & Traffic Models (Update V2 - Fix Lần 2)
 * High-fidelity composite multi-part models for 8 player vehicles and 10 traffic vehicles.
 * Bi-Laser X-Light V30L Ultra projector headlights with Cos/Pha/Laser beams,
 * Turn indicators (xi-nhan), brake lights, and volumetric light cones.
 */

import * as THREE from 'three';
import { CarId, TrafficVehicleType } from './types';
export type { TrafficVehicleType };

export interface CarModelInstance {
  group: THREE.Group;
  frontWheels: THREE.Group[];
  allWheels: THREE.Group[];
  steeringWheelMesh?: THREE.Mesh;
  brakeLightsMaterial: THREE.MeshStandardMaterial;
  headlightsMaterial: THREE.MeshStandardMaterial;
  laserProjectorMaterial: THREE.MeshStandardMaterial;
  headlightSpots: THREE.SpotLight[];
  laserSpotLights: THREE.SpotLight[];
  laserBeamsGroup: THREE.Group;
  laserBeamMaterials: THREE.MeshBasicMaterial[];
  nitroFlameMesh: THREE.Mesh;
  nitroFlameMaterial: THREE.MeshBasicMaterial;
  bodyMesh: THREE.Mesh;
  spoilerGroup?: THREE.Group;
  cockpitCameraOffset: THREE.Vector3;
  chaseCameraOffset: THREE.Vector3;
  dimensions: { width: number; height: number; length: number };
}

export interface TrafficModelInstance {
  group: THREE.Group;
  wheels: THREE.Group[];
  dimensions: { width: number; height: number; length: number };
  brakeLightsMaterial: THREE.MeshStandardMaterial;
  headlightsMaterial: THREE.MeshStandardMaterial;
  blinkerLeftMaterial: THREE.MeshStandardMaterial;
  blinkerRightMaterial: THREE.MeshStandardMaterial;
}

// Cached shared materials for wheels, rims, and glass
const wheelRubberMat = new THREE.MeshStandardMaterial({
  color: 0x18181b,
  roughness: 0.9,
  metalness: 0.1,
});

const glassMat = new THREE.MeshPhysicalMaterial({
  color: 0x0f172a,
  roughness: 0.05,
  metalness: 0.9,
  transmission: 0.75,
  transparent: true,
  opacity: 0.85,
});

const trimDarkMat = new THREE.MeshStandardMaterial({
  color: 0x09090b,
  roughness: 0.7,
  metalness: 0.3,
});

const interiorDashMat = new THREE.MeshStandardMaterial({
  color: 0x18181b,
  roughness: 0.8,
  metalness: 0.1,
});

const interiorGaugeMat = new THREE.MeshBasicMaterial({
  color: 0x38bdf8,
});

const chromeMat = new THREE.MeshStandardMaterial({
  color: 0xf8fafc,
  roughness: 0.15,
  metalness: 0.95,
});

/**
 * Creates a detailed wheel with tire tread, rim, and center hub
 */
function createWheel(radius: number, width: number, rimColorHex: string | number): THREE.Group {
  const wheel = new THREE.Group();

  // Rubber tire
  const tireGeo = new THREE.CylinderGeometry(radius, radius, width, 18);
  tireGeo.rotateZ(Math.PI / 2);
  const tireMesh = new THREE.Mesh(tireGeo, wheelRubberMat);
  wheel.add(tireMesh);

  // Rim alloy
  const rimMat = new THREE.MeshStandardMaterial({
    color: typeof rimColorHex === 'string' ? new THREE.Color(rimColorHex) : rimColorHex,
    roughness: 0.3,
    metalness: 0.85,
  });
  const rimGeo = new THREE.CylinderGeometry(radius * 0.68, radius * 0.68, width * 1.02, 14);
  rimGeo.rotateZ(Math.PI / 2);
  const rimMesh = new THREE.Mesh(rimGeo, rimMat);
  wheel.add(rimMesh);

  // Rim spokes (5-spoke star)
  const spokeGeo = new THREE.BoxGeometry(width * 1.04, radius * 1.15, radius * 0.12);
  const spoke1 = new THREE.Mesh(spokeGeo, chromeMat);
  const spoke2 = new THREE.Mesh(spokeGeo, chromeMat);
  spoke2.rotation.x = Math.PI / 3;
  const spoke3 = new THREE.Mesh(spokeGeo, chromeMat);
  spoke3.rotation.x = (2 * Math.PI) / 3;
  wheel.add(spoke1, spoke2, spoke3);

  // Center hub cap
  const hubGeo = new THREE.CylinderGeometry(radius * 0.22, radius * 0.22, width * 1.08, 10);
  hubGeo.rotateZ(Math.PI / 2);
  const hubMesh = new THREE.Mesh(hubGeo, chromeMat);
  wheel.add(hubMesh);

  return wheel;
}

/**
 * Creates a slender two-wheeler tire and wheel (spoked or alloy)
 */
function createBikeWheel(
  radius: number,
  width: number,
  rimColorHex: string | number,
  isWireSpoke = false
): THREE.Group {
  const wheel = new THREE.Group();

  // Rubber tire
  const tireGeo = new THREE.CylinderGeometry(radius, radius, width, 16);
  tireGeo.rotateZ(Math.PI / 2);
  const tireMesh = new THREE.Mesh(tireGeo, wheelRubberMat);
  wheel.add(tireMesh);

  // Rim alloy
  const rimMat = new THREE.MeshStandardMaterial({
    color: typeof rimColorHex === 'string' ? new THREE.Color(rimColorHex) : rimColorHex,
    roughness: 0.25,
    metalness: 0.85,
  });
  const innerRadius = radius * (isWireSpoke ? 0.88 : 0.72);
  const rimGeo = new THREE.CylinderGeometry(innerRadius, innerRadius, width * 0.9, 14);
  rimGeo.rotateZ(Math.PI / 2);
  const rimMesh = new THREE.Mesh(rimGeo, rimMat);
  wheel.add(rimMesh);

  // Center hub
  const hubGeo = new THREE.CylinderGeometry(radius * 0.18, radius * 0.18, width * 1.25, 10);
  hubGeo.rotateZ(Math.PI / 2);
  const hub = new THREE.Mesh(hubGeo, chromeMat);
  wheel.add(hub);

  // Spokes
  const spokeCount = isWireSpoke ? 8 : 4;
  const spokeMat = isWireSpoke ? chromeMat : rimMat;
  for (let i = 0; i < spokeCount; i++) {
    const angle = (i * Math.PI) / spokeCount;
    const spoke = new THREE.Mesh(
      new THREE.BoxGeometry(width * 0.35, radius * 1.6, isWireSpoke ? 0.02 : 0.04),
      spokeMat
    );
    spoke.rotation.x = angle;
    wheel.add(spoke);
  }

  return wheel;
}

/**
 * Creates a stylized humanoid rider sitting on the motorbike or bicycle
 */
function createRiderFigure(
  leanAngle: number,
  yOffset: number,
  zOffset: number,
  suitColorHex: number,
  helmetColorHex: number,
  isBicycle = false
): THREE.Group {
  const rider = new THREE.Group();
  rider.position.set(0, yOffset, zOffset);

  const suitMat = new THREE.MeshStandardMaterial({
    color: suitColorHex,
    roughness: 0.6,
    metalness: 0.2,
  });

  const helmetMat = new THREE.MeshStandardMaterial({
    color: helmetColorHex,
    roughness: 0.3,
    metalness: 0.6,
  });

  const visorMat = new THREE.MeshStandardMaterial({
    color: 0x09090b,
    roughness: 0.1,
    metalness: 0.9,
  });

  // Torso / Jacket
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.42, 0.22), suitMat);
  torso.rotation.x = leanAngle;
  torso.position.set(0, 0.26, 0);

  // Head / Helmet
  const helmet = new THREE.Mesh(
    isBicycle ? new THREE.BoxGeometry(0.2, 0.14, 0.26) : new THREE.SphereGeometry(0.13, 10, 8),
    helmetMat
  );
  const headZ = -Math.sin(leanAngle) * 0.28;
  const headY = 0.48 + Math.cos(leanAngle) * 0.14;
  helmet.position.set(0, headY, headZ);

  if (!isBicycle) {
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.07, 0.1), visorMat);
    visor.position.set(0, headY, headZ - 0.09);
    rider.add(visor);
  }

  // Arms gripping handlebar
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.34), suitMat);
  armL.position.set(-0.18, headY - 0.14, headZ - 0.16);
  armL.rotation.y = -0.16;
  armL.rotation.x = leanAngle * 0.6;

  const armR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.34), suitMat);
  armR.position.set(0.18, headY - 0.14, headZ - 0.16);
  armR.rotation.y = 0.16;
  armR.rotation.x = leanAngle * 0.6;

  // Legs
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.36, 0.18), trimDarkMat);
  legL.position.set(-0.16, 0.1, -0.04);
  legL.rotation.x = isBicycle ? 0.6 : 0.4;

  const legR = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.36, 0.18), trimDarkMat);
  legR.position.set(0.16, 0.1, -0.04);
  legR.rotation.x = isBicycle ? 0.3 : 0.4;

  rider.add(torso, helmet, armL, armR, legL, legR);
  return rider;
}

/**
 * Builds the player car model with composite meshes, interior and dual Bi-Laser spotlights
 */
export function buildPlayerCar(
  carId: CarId,
  paintColor: string,
  hasSpoiler: boolean,
  rimColor: string
): CarModelInstance {
  const group = new THREE.Group();
  const frontWheels: THREE.Group[] = [];
  const allWheels: THREE.Group[] = [];
  const headlightSpots: THREE.SpotLight[] = [];
  const laserSpotLights: THREE.SpotLight[] = [];
  const laserBeamsGroup = new THREE.Group();
  const laserBeamMaterials: THREE.MeshBasicMaterial[] = [];

  const bodyMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(paintColor),
    roughness: 0.2,
    metalness: 0.7,
  });

  const brakeLightsMat = new THREE.MeshStandardMaterial({
    color: 0x7f1d1d,
    emissive: 0xef4444,
    emissiveIntensity: 0.4,
    roughness: 0.2,
  });

  // Bi-Laser X-Light V30L Ultra daylight-white outer rings
  const headlightsMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    emissive: 0xe0f2fe,
    emissiveIntensity: 3.5,
    roughness: 0.1,
  });

  // Bi-Laser central projector lens (intense laser cyan-white core)
  const laserProjectorMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 4.5,
    roughness: 0.05,
    metalness: 0.9,
  });

  let length = 4.4;
  let width = 1.9;
  let height = 1.35;
  let wheelRadius = 0.36;
  let wheelWidth = 0.28;

  let cockpitCameraOffset = new THREE.Vector3(0, 1.25, -0.65);
  let chaseCameraOffset = new THREE.Vector3(0, 2.2, 5.6);

  let bodyMesh: THREE.Mesh;
  let spoilerGroup: THREE.Group | undefined;
  let steeringWheelMesh: THREE.Mesh | undefined;

  // Nitro flame
  const nitroGeo = new THREE.ConeGeometry(0.2, 0.9, 8);
  nitroGeo.rotateX(-Math.PI / 2);
  const nitroMat = new THREE.MeshBasicMaterial({
    color: 0x06b6d4,
    transparent: true,
    opacity: 0.0,
  });
  const nitroFlameMesh = new THREE.Mesh(nitroGeo, nitroMat);

  // Construct individual car shapes
  if (carId === 'compact') {
    length = 3.85;
    width = 1.78;
    height = 1.4;
    wheelRadius = 0.33;
    cockpitCameraOffset = new THREE.Vector3(0, 1.25, -0.65);
    chaseCameraOffset = new THREE.Vector3(0, 2.1, 5.2);

    bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(width, 0.52, length), bodyMat);
    bodyMesh.position.y = 0.46;
    group.add(bodyMesh);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(width * 0.88, 0.55, length * 0.58), glassMat);
    cabin.position.set(0, 0.88, 0.1);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(width * 0.85, 0.06, length * 0.52), bodyMat);
    roof.position.set(0, 1.17, 0.1);
    group.add(cabin, roof);

  } else if (carId === 'sedan') {
    length = 4.55;
    width = 1.88;
    height = 1.38;
    wheelRadius = 0.35;
    wheelWidth = 0.28;
    cockpitCameraOffset = new THREE.Vector3(0, 1.22, -0.65);
    chaseCameraOffset = new THREE.Vector3(0, 2.2, 5.6);

    bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(width, 0.5, length), bodyMat);
    bodyMesh.position.y = 0.45;
    group.add(bodyMesh);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(width * 0.86, 0.52, length * 0.52), glassMat);
    cabin.position.set(0, 0.85, 0.05);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(width * 0.84, 0.05, length * 0.44), bodyMat);
    roof.position.set(0, 1.12, 0.05);
    group.add(cabin, roof);

  } else if (carId === 'luxury_sedan') {
    // President Executive Saloon: Long-wheelbase, refined chrome trim, VIP tinted glass
    length = 4.98;
    width = 1.98;
    height = 1.40;
    wheelRadius = 0.37;
    wheelWidth = 0.30;
    cockpitCameraOffset = new THREE.Vector3(0, 1.24, -0.68);
    chaseCameraOffset = new THREE.Vector3(0, 2.25, 5.85);

    bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(width, 0.52, length), bodyMat);
    bodyMesh.position.y = 0.47;
    group.add(bodyMesh);

    // Front chrome prestige radiator grille
    const grille = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.32, 0.08), chromeMat);
    grille.position.set(0, 0.52, -length * 0.505);
    group.add(grille);

    // Side chrome window sill molding
    const trimL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, length * 0.56), chromeMat);
    trimL.position.set(-width * 0.44, 0.72, 0.06);
    const trimR = trimL.clone();
    trimR.position.x = width * 0.44;
    group.add(trimL, trimR);

    // Sleek executive cabin & elongated roof
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(width * 0.86, 0.54, length * 0.56), glassMat);
    cabin.position.set(0, 0.88, 0.06);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(width * 0.84, 0.06, length * 0.48), bodyMat);
    roof.position.set(0, 1.16, 0.06);
    group.add(cabin, roof);

    // Rear twin chrome exhaust tips
    const exhL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.12), chromeMat);
    exhL.position.set(-width * 0.32, 0.33, length * 0.505);
    const exhR = exhL.clone();
    exhR.position.x = width * 0.32;
    group.add(exhL, exhR);

  } else if (carId === 'suv') {
    length = 4.85;
    width = 2.10;
    height = 1.76;
    wheelRadius = 0.45;
    wheelWidth = 0.34;
    cockpitCameraOffset = new THREE.Vector3(0, 1.55, -0.7);
    chaseCameraOffset = new THREE.Vector3(0, 2.8, 6.2);

    bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(width, 0.75, length), bodyMat);
    bodyMesh.position.y = 0.72;
    group.add(bodyMesh);

    // Roof rails
    const railL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, length * 0.45), chromeMat);
    railL.position.set(-width * 0.42, 1.72, 0.15);
    const railR = railL.clone();
    railR.position.x = width * 0.42;
    group.add(railL, railR);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(width * 0.9, 0.7, length * 0.55), glassMat);
    cabin.position.set(0, 1.28, 0.15);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(width * 0.88, 0.08, length * 0.52), bodyMat);
    roof.position.set(0, 1.65, 0.15);
    group.add(cabin, roof);

  } else if (carId === 'pickup') {
    // Raptor Heavy 4x4: High lift clearance, crew cab, open cargo bed with roll bar & bumper bull-guard
    length = 5.25;
    width = 2.16;
    height = 1.82;
    wheelRadius = 0.46;
    wheelWidth = 0.38;
    cockpitCameraOffset = new THREE.Vector3(0, 1.62, -0.75);
    chaseCameraOffset = new THREE.Vector3(0, 2.9, 6.4);

    // Main heavy lower chassis
    bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(width, 0.65, length), bodyMat);
    bodyMesh.position.y = 0.68;
    group.add(bodyMesh);

    // Front offroad bull bar / brush guard
    const bullBar = new THREE.Mesh(new THREE.BoxGeometry(width * 0.86, 0.45, 0.18), trimDarkMat);
    bullBar.position.set(0, 0.62, -length * 0.51);
    group.add(bullBar);

    // Skid plate underneath
    const skidPlate = new THREE.Mesh(new THREE.BoxGeometry(width * 0.65, 0.08, 0.8), chromeMat);
    skidPlate.position.set(0, 0.34, -length * 0.42);
    group.add(skidPlate);

    // Crew cab (front half of vehicle)
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(width * 0.92, 0.72, length * 0.46), glassMat);
    cabin.position.set(0, 1.32, -length * 0.1);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(width * 0.9, 0.08, length * 0.42), bodyMat);
    roof.position.set(0, 1.70, -length * 0.1);
    group.add(cabin, roof);

    // Rear open cargo bed sides & floor liner
    const bedSideL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.48, length * 0.44), bodyMat);
    bedSideL.position.set(-width * 0.44, 1.15, length * 0.24);
    const bedSideR = bedSideL.clone();
    bedSideR.position.x = width * 0.44;

    const tailgate = new THREE.Mesh(new THREE.BoxGeometry(width * 0.88, 0.48, 0.12), bodyMat);
    tailgate.position.set(0, 1.15, length * 0.46);

    const bedLiner = new THREE.Mesh(new THREE.BoxGeometry(width * 0.82, 0.06, length * 0.42), trimDarkMat);
    bedLiner.position.set(0, 0.94, length * 0.24);
    group.add(bedSideL, bedSideR, tailgate, bedLiner);

    // Tubular roll bar behind crew cab
    const rollBar = new THREE.Mesh(new THREE.BoxGeometry(width * 0.84, 0.58, 0.1), chromeMat);
    rollBar.position.set(0, 1.45, length * 0.08);
    group.add(rollBar);

  } else if (carId === 'muscle') {
    length = 4.75;
    width = 2.02;
    height = 1.36;
    wheelRadius = 0.39;
    wheelWidth = 0.32;
    cockpitCameraOffset = new THREE.Vector3(0, 1.25, -0.7);
    chaseCameraOffset = new THREE.Vector3(0, 2.3, 5.8);

    bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(width, 0.56, length), bodyMat);
    bodyMesh.position.y = 0.48;
    group.add(bodyMesh);

    const scoop = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.16, 0.95), trimDarkMat);
    scoop.position.set(0, 0.82, -length * 0.25);
    group.add(scoop);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(width * 0.85, 0.5, length * 0.45), glassMat);
    cabin.position.set(0, 0.88, 0.25);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(width * 0.82, 0.06, length * 0.38), bodyMat);
    roof.position.set(0, 1.14, 0.22);
    group.add(cabin, roof);

  } else if (carId === 'coupe') {
    length = 4.45;
    width = 1.92;
    height = 1.25;
    wheelRadius = 0.36;
    wheelWidth = 0.30;
    cockpitCameraOffset = new THREE.Vector3(0, 1.15, -0.65);
    chaseCameraOffset = new THREE.Vector3(0, 2.05, 5.5);

    bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(width, 0.44, length), bodyMat);
    bodyMesh.position.y = 0.42;
    group.add(bodyMesh);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(width * 0.82, 0.46, length * 0.48), glassMat);
    cabin.position.set(0, 0.78, 0.12);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(width * 0.8, 0.05, length * 0.4), bodyMat);
    roof.position.set(0, 1.02, 0.12);
    group.add(cabin, roof);

  } else if (carId === 'rally') {
    length = 4.35;
    width = 1.95;
    height = 1.42;
    wheelRadius = 0.38;
    wheelWidth = 0.30;
    cockpitCameraOffset = new THREE.Vector3(0, 1.25, -0.65);
    chaseCameraOffset = new THREE.Vector3(0, 2.2, 5.4);

    bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(width, 0.52, length), bodyMat);
    bodyMesh.position.y = 0.48;
    group.add(bodyMesh);

    const roofAir = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.12, 0.4), trimDarkMat);
    roofAir.position.set(0, 1.25, 0);
    group.add(roofAir);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(width * 0.85, 0.52, length * 0.5), glassMat);
    cabin.position.set(0, 0.9, 0.1);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(width * 0.82, 0.06, length * 0.44), bodyMat);
    roof.position.set(0, 1.18, 0.1);
    group.add(cabin, roof);

  } else if (carId === 'supercar') {
    length = 4.65;
    width = 2.05;
    height = 1.16;
    wheelRadius = 0.37;
    wheelWidth = 0.32;
    cockpitCameraOffset = new THREE.Vector3(0, 1.08, -0.6);
    chaseCameraOffset = new THREE.Vector3(0, 1.95, 5.6);

    bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(width, 0.4, length), bodyMat);
    bodyMesh.position.y = 0.38;
    group.add(bodyMesh);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(width * 0.76, 0.45, length * 0.42), glassMat);
    cabin.position.set(0, 0.7, 0.1);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(width * 0.74, 0.05, length * 0.35), bodyMat);
    roof.position.set(0, 0.94, 0.08);
    group.add(cabin, roof);

  } else {
    // Hypercar (Phantom Vision)
    length = 4.8;
    width = 2.12;
    height = 1.12;
    wheelRadius = 0.38;
    wheelWidth = 0.35;
    cockpitCameraOffset = new THREE.Vector3(0, 1.05, -0.6);
    chaseCameraOffset = new THREE.Vector3(0, 1.9, 5.7);

    bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(width, 0.38, length), bodyMat);
    bodyMesh.position.y = 0.36;
    group.add(bodyMesh);

    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.35, 1.8), trimDarkMat);
    fin.position.set(0, 0.9, 0.8);
    group.add(fin);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(width * 0.72, 0.42, length * 0.44), glassMat);
    cabin.position.set(0, 0.68, 0.08);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(width * 0.7, 0.05, length * 0.36), bodyMat);
    roof.position.set(0, 0.9, 0.06);
    group.add(cabin, roof);
  }

  // Wheels placement (4 wheels)
  const halfW = width * 0.5 - wheelWidth * 0.4;
  const wheelZFront = -length * 0.32;
  const wheelZRear = length * 0.32;
  const wheelY = wheelRadius;

  const positions = [
    { x: -halfW, z: wheelZFront, isFront: true },
    { x: halfW, z: wheelZFront, isFront: true },
    { x: -halfW, z: wheelZRear, isFront: false },
    { x: halfW, z: wheelZRear, isFront: false },
  ];

  positions.forEach((pos) => {
    const wheelAnchor = new THREE.Group();
    wheelAnchor.position.set(pos.x, wheelY, pos.z);
    const wheelInstance = createWheel(wheelRadius, wheelWidth, rimColor);
    wheelAnchor.add(wheelInstance);

    group.add(wheelAnchor);
    allWheels.push(wheelInstance);
    if (pos.isFront) {
      frontWheels.push(wheelAnchor);
    }
  });

  // Cockpit Interior Details
  const dashGroup = new THREE.Group();
  const dashMesh = new THREE.Mesh(new THREE.BoxGeometry(width * 0.78, 0.28, 0.4), interiorDashMat);
  dashMesh.position.set(0, height * 0.62, -length * 0.08);
  dashGroup.add(dashMesh);

  const gaugeMesh = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.02), interiorGaugeMat);
  gaugeMesh.position.set(0, height * 0.66, -length * 0.08 + 0.21);
  dashGroup.add(gaugeMesh);

  const steerWheelGeo = new THREE.TorusGeometry(0.18, 0.025, 8, 20);
  steeringWheelMesh = new THREE.Mesh(steerWheelGeo, trimDarkMat);
  steeringWheelMesh.position.set(-0.25, height * 0.64, -length * 0.08 + 0.35);
  steeringWheelMesh.rotation.x = -Math.PI / 6;
  dashGroup.add(steeringWheelMesh);

  group.add(dashGroup);

  // AOZOOM BI-LED & BI-LASER HIGH-PERFORMANCE HEADLIGHT ASSEMBLY
  const hlW = 0.36;
  const hlH = 0.16;
  const hlD = 0.1;

  // Outer aerodynamic dark housing
  const hlGeo = new THREE.BoxGeometry(hlW, hlH, hlD);
  const hlL = new THREE.Mesh(hlGeo, headlightsMat);
  hlL.position.set(-width * 0.35, 0.48, -length * 0.505);
  const hlR = new THREE.Mesh(hlGeo, headlightsMat);
  hlR.position.set(width * 0.35, 0.48, -length * 0.505);
  group.add(hlL, hlR);

  // Aozoom Signature Blue AR Projector Lens Rings (Halo)
  const ringGeo = new THREE.TorusGeometry(0.065, 0.012, 8, 16);
  const ringL = new THREE.Mesh(ringGeo, laserProjectorMat);
  ringL.position.set(-width * 0.35, 0.48, -length * 0.518);
  const ringR = new THREE.Mesh(ringGeo, laserProjectorMat);
  ringR.position.set(width * 0.35, 0.48, -length * 0.518);
  group.add(ringL, ringR);

  // Dual Aozoom Bi-LED/Bi-Laser Projector Bulbs
  const projGeo = new THREE.CylinderGeometry(0.052, 0.052, 0.06, 14);
  projGeo.rotateX(Math.PI / 2);
  const projL = new THREE.Mesh(projGeo, laserProjectorMat);
  projL.position.set(-width * 0.35, 0.48, -length * 0.515);
  const projR = new THREE.Mesh(projGeo, laserProjectorMat);
  projR.position.set(width * 0.35, 0.48, -length * 0.515);
  group.add(projL, projR);

  // 1. Broad Aozoom Low-Beam (Cos) SpotLights (100m wide road illumination with sharp cut-off angle)
  const leftLowSpot = new THREE.SpotLight(0xf1f5f9, 20.0, 100, Math.PI / 4.4, 0.65, 1.1);
  leftLowSpot.position.set(-width * 0.35, 0.52, -length * 0.5);
  const leftLowTarget = new THREE.Object3D();
  leftLowTarget.position.set(-width * 0.35 - 1.2, 0.05, -length * 0.5 - 55);
  group.add(leftLowSpot, leftLowTarget);
  leftLowSpot.target = leftLowTarget;

  const rightLowSpot = new THREE.SpotLight(0xf1f5f9, 20.0, 100, Math.PI / 4.4, 0.65, 1.1);
  rightLowSpot.position.set(width * 0.35, 0.52, -length * 0.5);
  const rightLowTarget = new THREE.Object3D();
  rightLowTarget.position.set(width * 0.35 + 1.2, 0.05, -length * 0.5 - 55);
  group.add(rightLowSpot, rightLowTarget);
  rightLowSpot.target = rightLowTarget;

  headlightSpots.push(leftLowSpot, rightLowSpot);

  // 2. Focused Aozoom Bi-Laser High-Beam (Pha) SpotLights (280m high-intensity laser center hotspot)
  const leftLaserSpot = new THREE.SpotLight(0x38bdf8, 55.0, 280, Math.PI / 8.5, 0.3, 0.9);
  leftLaserSpot.position.set(-width * 0.35, 0.52, -length * 0.5);
  const leftLaserTarget = new THREE.Object3D();
  leftLaserTarget.position.set(-width * 0.35, 0.35, -length * 0.5 - 140);
  group.add(leftLaserSpot, leftLaserTarget);
  leftLaserSpot.target = leftLaserTarget;

  const rightLaserSpot = new THREE.SpotLight(0x38bdf8, 55.0, 280, Math.PI / 8.5, 0.3, 0.9);
  rightLaserSpot.position.set(width * 0.35, 0.52, -length * 0.5);
  const rightLaserTarget = new THREE.Object3D();
  rightLaserTarget.position.set(width * 0.35, 0.35, -length * 0.5 - 140);
  group.add(rightLaserSpot, rightLaserTarget);
  rightLaserSpot.target = rightLaserTarget;

  laserSpotLights.push(leftLaserSpot, rightLaserSpot);

  // 3. Volumetric Aozoom Light Cones with laser core
  const beamGeo = new THREE.ConeGeometry(3.6, 60, 14, 1, true);
  beamGeo.rotateX(Math.PI / 2);
  beamGeo.translate(0, 0, -30);

  const beamMatL = new THREE.MeshBasicMaterial({
    color: 0x7dd3fc,
    transparent: true,
    opacity: 0.18,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const beamMatR = beamMatL.clone();
  laserBeamMaterials.push(beamMatL, beamMatR);

  const beamMeshL = new THREE.Mesh(beamGeo, beamMatL);
  beamMeshL.position.set(-width * 0.35, 0.5, -length * 0.5);
  const beamMeshR = new THREE.Mesh(beamGeo, beamMatR);
  beamMeshR.position.set(width * 0.35, 0.5, -length * 0.5);

  laserBeamsGroup.add(beamMeshL, beamMeshR);
  group.add(laserBeamsGroup);

  // Emissive Brake / Taillights
  const blGeo = new THREE.BoxGeometry(0.35, 0.14, 0.08);
  const blL = new THREE.Mesh(blGeo, brakeLightsMat);
  blL.position.set(-width * 0.36, 0.55, length * 0.505);
  const blR = new THREE.Mesh(blGeo, brakeLightsMat);
  blR.position.set(width * 0.36, 0.55, length * 0.505);
  group.add(blL, blR);

  // Exhaust pipe & Nitro flame
  const exhaustGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.2, 8);
  exhaustGeo.rotateX(Math.PI / 2);
  const exhaustMesh = new THREE.Mesh(exhaustGeo, chromeMat);
  exhaustMesh.position.set(0, 0.32, length * 0.51);
  group.add(exhaustMesh);

  nitroFlameMesh.position.set(0, 0.32, length * 0.51 + 0.55);
  group.add(nitroFlameMesh);

  // Spoiler Wing
  if (hasSpoiler) {
    spoilerGroup = new THREE.Group();
    const wingGeo = new THREE.BoxGeometry(width * 0.88, 0.06, 0.34);
    const wingMesh = new THREE.Mesh(wingGeo, trimDarkMat);
    wingMesh.position.y = 0.36;

    const pillarGeo = new THREE.BoxGeometry(0.05, 0.36, 0.12);
    const p1 = new THREE.Mesh(pillarGeo, trimDarkMat);
    p1.position.set(-width * 0.28, 0.18, 0);
    const p2 = p1.clone();
    p2.position.x = width * 0.28;

    spoilerGroup.add(wingMesh, p1, p2);
    spoilerGroup.position.set(0, 0.55, length * 0.42);
    group.add(spoilerGroup);
  }

  return {
    group,
    frontWheels,
    allWheels,
    steeringWheelMesh,
    brakeLightsMaterial: brakeLightsMat,
    headlightsMaterial: headlightsMat,
    laserProjectorMaterial: laserProjectorMat,
    headlightSpots,
    laserSpotLights,
    laserBeamsGroup,
    laserBeamMaterials,
    nitroFlameMesh,
    nitroFlameMaterial: nitroMat,
    bodyMesh,
    spoilerGroup,
    cockpitCameraOffset,
    chaseCameraOffset,
    dimensions: { width, height, length },
  };
}

/**
 * Creates 10 distinct AI traffic vehicles with working turn blinkers and brake lights
 */
export function buildTrafficVehicle(type: TrafficVehicleType): TrafficModelInstance {
  const group = new THREE.Group();
  const wheels: THREE.Group[] = [];

  let length = 4.4;
  let width = 1.9;
  let height = 1.4;
  let wheelRadius = 0.35;
  let wheelWidth = 0.25;

  const brakeLightsMat = new THREE.MeshStandardMaterial({
    color: 0x7f1d1d,
    emissive: 0xef4444,
    emissiveIntensity: 0.8,
  });

  const headlightsMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xfef08a,
    emissiveIntensity: 1.8,
  });

  const blinkerLeftMat = new THREE.MeshStandardMaterial({
    color: 0x78350f,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.1,
  });

  const blinkerRightMat = new THREE.MeshStandardMaterial({
    color: 0x78350f,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.1,
  });

  // Check if two-wheeler (7 Motorbikes + 1 Bicycle)
  const isTwoWheeler = type.startsWith('moto_') || type === 'bicycle';

  if (isTwoWheeler) {
    let frontRadius = 0.33;
    let rearRadius = 0.33;
    let wheelW = 0.14;

    if (type === 'moto_sport') {
      length = 2.15;
      width = 0.78;
      height = 1.25;
      frontRadius = 0.32;
      rearRadius = 0.32;
      wheelW = 0.12;

      const fairingMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.2, metalness: 0.7 });
      const tank = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.38, 0.76), fairingMat);
      tank.position.set(0, 0.58, -0.05);

      const nose = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.65, 4), fairingMat);
      nose.rotation.x = Math.PI / 2;
      nose.position.set(0, 0.68, -0.72);

      const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, 0.28), glassMat);
      windshield.position.set(0, 0.88, -0.55);

      const clipOns = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.05, 0.08), chromeMat);
      clipOns.position.set(0, 0.82, -0.52);

      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.24, 0.54), fairingMat);
      tail.position.set(0, 0.72, 0.46);

      const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.45, 8), chromeMat);
      exhaust.rotation.x = Math.PI / 2.3;
      exhaust.position.set(0.24, 0.38, 0.42);

      const rider = createRiderFigure(0.65, 0.62, 0.02, 0xef4444, 0x18181b);
      group.add(tank, nose, windshield, clipOns, tail, exhaust, rider);

    } else if (type === 'moto_naked') {
      length = 2.12;
      width = 0.82;
      height = 1.22;
      frontRadius = 0.32;
      rearRadius = 0.32;
      wheelW = 0.14;

      const trellisMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.3, metalness: 0.6 });
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.34, 0.72), trellisMat);
      frame.position.set(0, 0.58, -0.05);

      const engine = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.32, 0.42), trimDarkMat);
      engine.position.set(0, 0.36, -0.05);

      const handlebar = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.05, 0.08), chromeMat);
      handlebar.position.set(0, 0.86, -0.42);

      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.18, 0.44), trellisMat);
      tail.position.set(0, 0.68, 0.44);

      const rider = createRiderFigure(0.35, 0.64, 0.02, 0x27272a, 0xf97316);
      group.add(frame, engine, handlebar, tail, rider);

    } else if (type === 'moto_touring') {
      length = 2.4;
      width = 0.94;
      height = 1.42;
      frontRadius = 0.34;
      rearRadius = 0.34;
      wheelW = 0.16;

      const tourMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.25, metalness: 0.6 });
      const fairing = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.65, 0.7), tourMat);
      fairing.position.set(0, 0.8, -0.45);

      const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.44, 0.06), glassMat);
      windshield.position.set(0, 1.15, -0.48);

      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.24, 0.72), trimDarkMat);
      seat.position.set(0, 0.66, 0.08);

      const pannierL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.36, 0.65), tourMat);
      pannierL.position.set(-0.36, 0.65, 0.48);
      const pannierR = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.36, 0.65), tourMat);
      pannierR.position.set(0.36, 0.65, 0.48);

      const topBox = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.32, 0.38), tourMat);
      topBox.position.set(0, 0.92, 0.75);

      const rider = createRiderFigure(0.22, 0.72, 0.0, 0x1e3a8a, 0xe2e8f0);
      group.add(fairing, windshield, seat, pannierL, pannierR, topBox, rider);

    } else if (type === 'moto_cruiser') {
      length = 2.45;
      width = 0.88;
      height = 1.15;
      frontRadius = 0.36;
      rearRadius = 0.31;
      wheelW = 0.16;

      const cruiserMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.2, metalness: 0.8 });
      const tank = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.28, 0.62), cruiserMat);
      tank.position.set(0, 0.6, -0.15);

      const seatMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.8 });
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.16, 0.42), seatMat);
      seat.position.set(0, 0.52, 0.15);

      const forkL = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.9, 8), chromeMat);
      forkL.rotation.x = -0.35;
      forkL.position.set(-0.14, 0.58, -0.6);
      const forkR = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.9, 8), chromeMat);
      forkR.rotation.x = -0.35;
      forkR.position.set(0.14, 0.58, -0.6);

      const pipes = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.85, 8), chromeMat);
      pipes.rotation.x = Math.PI / 2;
      pipes.position.set(0.24, 0.32, 0.32);

      const rider = createRiderFigure(0.14, 0.54, -0.05, 0x18181b, 0x44403c);
      group.add(tank, seat, forkL, forkR, pipes, rider);

    } else if (type === 'moto_adventure') {
      length = 2.32;
      width = 0.9;
      height = 1.5;
      frontRadius = 0.36;
      rearRadius = 0.33;
      wheelW = 0.14;

      const advMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4, metalness: 0.4 });
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.44, 0.8), advMat);
      body.position.set(0, 0.72, -0.05);

      const beak = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.48, 4), advMat);
      beak.rotation.x = Math.PI / 2;
      beak.position.set(0, 0.75, -0.72);

      const screen = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.48, 0.05), glassMat);
      screen.position.set(0, 1.15, -0.45);

      const alumMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.3, metalness: 0.85 });
      const pannierL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.4, 0.58), alumMat);
      pannierL.position.set(-0.38, 0.75, 0.48);
      const pannierR = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.4, 0.58), alumMat);
      pannierR.position.set(0.38, 0.75, 0.48);

      const rider = createRiderFigure(0.28, 0.78, 0.02, 0xd97706, 0xf59e0b);
      group.add(body, beak, screen, pannierL, pannierR, rider);

    } else if (type === 'moto_scooter') {
      length = 1.98;
      width = 0.74;
      height = 1.2;
      frontRadius = 0.24;
      rearRadius = 0.24;
      wheelW = 0.11;

      const scootMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.3, metalness: 0.5 });
      const apron = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.58, 0.45), scootMat);
      apron.position.set(0, 0.62, -0.42);

      const floor = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.12, 0.5), trimDarkMat);
      floor.position.set(0, 0.26, -0.05);

      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.28, 0.76), trimDarkMat);
      seat.position.set(0, 0.58, 0.24);

      const rider = createRiderFigure(0.12, 0.64, 0.02, 0x0284c7, 0xf8fafc);
      group.add(apron, floor, seat, rider);

    } else if (type === 'moto_sport_touring') {
      length = 2.26;
      width = 0.84;
      height = 1.34;
      frontRadius = 0.33;
      rearRadius = 0.33;
      wheelW = 0.14;

      const stMat = new THREE.MeshStandardMaterial({ color: 0x881337, roughness: 0.25, metalness: 0.65 });
      const fairing = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.52, 0.68), stMat);
      fairing.position.set(0, 0.72, -0.32);

      const screen = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.32, 0.06), glassMat);
      screen.position.set(0, 1.02, -0.4);

      const cases = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.3, 0.55), stMat);
      cases.position.set(0, 0.65, 0.42);

      const rider = createRiderFigure(0.48, 0.66, 0.02, 0x881337, 0x1e1b4b);
      group.add(fairing, screen, cases, rider);

    } else {
      // Bicycle (Modern Urban Road Bike)
      length = 1.76;
      width = 0.58;
      height = 1.1;
      frontRadius = 0.35;
      rearRadius = 0.35;
      wheelW = 0.04;

      const bikeFrameMat = new THREE.MeshStandardMaterial({ color: 0x84cc16, roughness: 0.3, metalness: 0.6 });
      const topTube = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.72, 8), bikeFrameMat);
      topTube.rotation.x = Math.PI / 2;
      topTube.position.set(0, 0.72, -0.05);

      const downTube = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.78, 8), bikeFrameMat);
      downTube.rotation.x = -0.65;
      downTube.position.set(0, 0.54, -0.15);

      const seatTube = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.58, 8), bikeFrameMat);
      seatTube.position.set(0, 0.58, 0.2);

      const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.22), trimDarkMat);
      saddle.position.set(0, 0.82, 0.2);

      const handlebars = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.03, 0.06), chromeMat);
      handlebars.position.set(0, 0.86, -0.38);

      const rider = createRiderFigure(0.55, 0.76, -0.02, 0x84cc16, 0x0284c7, true);
      group.add(topTube, downTube, seatTube, saddle, handlebars, rider);
    }

    // Attach front & rear wheels
    const isWire = type === 'bicycle' || type === 'moto_adventure';
    const rimColor = type === 'moto_naked' ? 0xf97316 : 0x94a3b8;
    const frontWheel = createBikeWheel(frontRadius, wheelW, rimColor, isWire);
    frontWheel.position.set(0, frontRadius, -length * 0.36);
    const rearWheel = createBikeWheel(rearRadius, wheelW, rimColor, isWire);
    rearWheel.position.set(0, rearRadius, length * 0.36);

    group.add(frontWheel, rearWheel);
    wheels.push(frontWheel, rearWheel);

    // Front Headlight (safety LED or dual bi-projectors)
    const hlW = type === 'bicycle' ? 0.1 : 0.32;
    const hlH = type === 'bicycle' ? 0.08 : 0.12;
    const hlY = type === 'bicycle' ? 0.86 : 0.72;
    const hl = new THREE.Mesh(new THREE.BoxGeometry(hlW, hlH, 0.08), headlightsMat);
    hl.position.set(0, hlY, -length * 0.44);

    // Rear Taillight / Safety Blinker
    const tlW = type === 'bicycle' ? 0.08 : 0.22;
    const tlH = type === 'bicycle' ? 0.08 : 0.09;
    const tlY = type === 'bicycle' ? 0.78 : 0.75;
    const tl = new THREE.Mesh(new THREE.BoxGeometry(tlW, tlH, 0.08), brakeLightsMat);
    tl.position.set(0, tlY, length * 0.45);

    // Turn Blinkers on stalks
    const blinkerGeo = new THREE.BoxGeometry(0.08, 0.06, 0.06);
    const blFL = new THREE.Mesh(blinkerGeo, blinkerLeftMat);
    blFL.position.set(-width * 0.38, hlY - 0.05, -length * 0.38);
    const blRL = new THREE.Mesh(blinkerGeo, blinkerLeftMat);
    blRL.position.set(-width * 0.38, tlY - 0.05, length * 0.42);

    const blFR = new THREE.Mesh(blinkerGeo, blinkerRightMat);
    blFR.position.set(width * 0.38, hlY - 0.05, -length * 0.38);
    const blRR = new THREE.Mesh(blinkerGeo, blinkerRightMat);
    blRR.position.set(width * 0.38, tlY - 0.05, length * 0.42);

    group.add(hl, tl, blFL, blRL, blFR, blRR);

  } else {
    // 10 Distinct Vehicle Archetypes (Cars, SUVs, Trucks, Buses)
    if (type === 'sedan') {
      length = 4.5;
      width = 1.88;
      height = 1.38;
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.3, metalness: 0.6 });
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(width, 0.5, length), bodyMat);
      chassis.position.y = 0.45;
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(width * 0.86, 0.52, length * 0.52), glassMat);
      cabin.position.set(0, 0.85, 0.05);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(width * 0.84, 0.05, length * 0.44), bodyMat);
      roof.position.set(0, 1.12, 0.05);
      group.add(chassis, cabin, roof);

    } else if (type === 'taxi') {
      length = 4.45;
      width = 1.86;
      height = 1.48;
      const taxiMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.25, metalness: 0.4 });
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(width, 0.5, length), taxiMat);
      chassis.position.y = 0.45;
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(width * 0.86, 0.5, length * 0.5), glassMat);
      cabin.position.set(0, 0.82, 0.1);
      const sign = new THREE.Mesh(
        new THREE.BoxGeometry(0.65, 0.16, 0.28),
        new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfef08a, emissiveIntensity: 1.2 })
      );
      sign.position.set(0, 1.16, 0.1);
      group.add(chassis, cabin, sign);

    } else if (type === 'coupe') {
      length = 4.35;
      width = 1.92;
      height = 1.22;
      const coupeMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.2, metalness: 0.7 });
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(width, 0.42, length), coupeMat);
      chassis.position.y = 0.4;
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(width * 0.82, 0.44, length * 0.46), glassMat);
      cabin.position.set(0, 0.74, 0.12);
      group.add(chassis, cabin);

    } else if (type === 'muscle') {
      length = 4.7;
      width = 2.0;
      height = 1.34;
      const muscleMat = new THREE.MeshStandardMaterial({ color: 0xc2410c, roughness: 0.35, metalness: 0.5 });
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(width, 0.54, length), muscleMat);
      chassis.position.y = 0.46;
      const scoop = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.15, 0.8), trimDarkMat);
      scoop.position.set(0, 0.78, -length * 0.22);
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(width * 0.84, 0.48, length * 0.46), glassMat);
      cabin.position.set(0, 0.84, 0.2);
      group.add(chassis, scoop, cabin);

    } else if (type === 'suv') {
      length = 4.75;
      width = 2.05;
      height = 1.72;
      wheelRadius = 0.42;
      const suvMat = new THREE.MeshStandardMaterial({ color: 0x065f46, roughness: 0.35, metalness: 0.4 });
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(width, 0.72, length), suvMat);
      chassis.position.y = 0.68;
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(width * 0.88, 0.68, length * 0.56), glassMat);
      cabin.position.set(0, 1.22, 0.12);
      group.add(chassis, cabin);

    } else if (type === 'truck') {
      length = 8.6;
      width = 2.45;
      height = 3.3;
      wheelRadius = 0.5;
      wheelWidth = 0.32;
      const cabMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.4, metalness: 0.3 });
      const cab = new THREE.Mesh(new THREE.BoxGeometry(width, 2.2, 2.5), cabMat);
      cab.position.set(0, 1.45, -length * 0.35);
      const cabGlass = new THREE.Mesh(new THREE.BoxGeometry(width * 0.92, 0.85, 0.2), glassMat);
      cabGlass.position.set(0, 1.85, -length * 0.35 - 1.2);
      const cargoMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.5, metalness: 0.2 });
      const cargo = new THREE.Mesh(new THREE.BoxGeometry(width * 1.04, 2.8, length * 0.66), cargoMat);
      cargo.position.set(0, 1.75, length * 0.14);
      group.add(cab, cabGlass, cargo);

    } else if (type === 'bus') {
      length = 10.8;
      width = 2.55;
      height = 3.1;
      wheelRadius = 0.52;
      wheelWidth = 0.32;
      const busMat = new THREE.MeshStandardMaterial({ color: 0x047857, roughness: 0.3, metalness: 0.3 });
      const busBody = new THREE.Mesh(new THREE.BoxGeometry(width, 2.45, length), busMat);
      busBody.position.y = 1.62;
      const winMesh = new THREE.Mesh(new THREE.BoxGeometry(width * 1.02, 0.85, length * 0.9), glassMat);
      winMesh.position.set(0, 1.85, 0);
      group.add(busBody, winMesh);

    } else if (type === 'van') {
      length = 5.2;
      width = 2.05;
      height = 2.1;
      wheelRadius = 0.4;
      const vanMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4, metalness: 0.3 });
      const body = new THREE.Mesh(new THREE.BoxGeometry(width, 1.35, length), vanMat);
      body.position.y = 1.05;
      const windshield = new THREE.Mesh(new THREE.BoxGeometry(width * 0.9, 0.6, 0.2), glassMat);
      windshield.position.set(0, 1.35, -length * 0.42);
      group.add(body, windshield);

    } else if (type === 'wagon') {
      length = 4.8;
      width = 1.88;
      height = 1.44;
      const wagonMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.3, metalness: 0.5 });
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(width, 0.52, length), wagonMat);
      chassis.position.y = 0.48;
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(width * 0.86, 0.54, length * 0.68), glassMat);
      cabin.position.set(0, 0.9, 0.18);
      group.add(chassis, cabin);

    } else {
      // Heavy 4x4 Pickup Truck
      length = 5.4;
      width = 2.15;
      height = 1.82;
      wheelRadius = 0.46;
      wheelWidth = 0.32;
      const pickupMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.45, metalness: 0.4 });
      const cab = new THREE.Mesh(new THREE.BoxGeometry(width, 0.8, length * 0.55), pickupMat);
      cab.position.set(0, 0.8, -length * 0.18);
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(width * 0.88, 0.65, length * 0.42), glassMat);
      cabin.position.set(0, 1.38, -length * 0.15);
      const bed = new THREE.Mesh(new THREE.BoxGeometry(width, 0.55, length * 0.45), pickupMat);
      bed.position.set(0, 0.7, length * 0.26);
      group.add(cab, cabin, bed);
    }

    // 4-Wheel car wheel attachments
    const zOffsets = length > 7 ? [-length * 0.35, length * 0.1, length * 0.35] : [-length * 0.32, length * 0.32];
    zOffsets.forEach((z) => {
      [-width * 0.46, width * 0.46].forEach((x) => {
        const w = createWheel(wheelRadius, wheelWidth, 0x64748b);
        w.position.set(x, wheelRadius, z);
        group.add(w);
        wheels.push(w);
      });
    });

    // Emissive Headlights
    const hl = new THREE.Mesh(
      new THREE.BoxGeometry(width * 0.82, 0.14, 0.06),
      headlightsMat
    );
    hl.position.set(0, 0.58, -length * 0.505);

    // Emissive Brake Lights
    const tl = new THREE.Mesh(
      new THREE.BoxGeometry(width * 0.82, 0.14, 0.06),
      brakeLightsMat
    );
    tl.position.set(0, 0.58, length * 0.505);

    // Left & Right Turn Blinkers (Front & Rear)
    const blinkerGeo = new THREE.BoxGeometry(0.18, 0.1, 0.08);

    const blFL = new THREE.Mesh(blinkerGeo, blinkerLeftMat);
    blFL.position.set(-width * 0.44, 0.58, -length * 0.505);
    const blRL = new THREE.Mesh(blinkerGeo, blinkerLeftMat);
    blRL.position.set(-width * 0.44, 0.58, length * 0.505);

    const blFR = new THREE.Mesh(blinkerGeo, blinkerRightMat);
    blFR.position.set(width * 0.44, 0.58, -length * 0.505);
    const blRR = new THREE.Mesh(blinkerGeo, blinkerRightMat);
    blRR.position.set(width * 0.44, 0.58, length * 0.505);

    group.add(hl, tl, blFL, blRL, blFR, blRR);
  }

  return {
    group,
    wheels,
    dimensions: { width, height, length },
    brakeLightsMaterial: brakeLightsMat,
    headlightsMaterial: headlightsMat,
    blinkerLeftMaterial: blinkerLeftMat,
    blinkerRightMaterial: blinkerRightMat,
  };
}
