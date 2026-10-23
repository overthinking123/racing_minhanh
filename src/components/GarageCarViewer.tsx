/**
 * City Rush 3D - Interactive 3D Garage Viewer Component (Update V2 - Fix Lần 2)
 * High-performance Three.js 3D viewport for inspecting vehicles with drag-to-rotate 360°,
 * zoom, auto-rotation, studio showroom lighting and reflective floor.
 */

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CarId } from '../game/types';
import { buildPlayerCar, CarModelInstance } from '../game/proceduralModels';
import { Lock, Move3d } from 'lucide-react';

interface GarageCarViewerProps {
  carId: CarId;
  color: string;
  spoiler: boolean;
  rimColor: string;
  isUnlocked: boolean;
  price: number;
}

export const GarageCarViewer: React.FC<GarageCarViewerProps> = ({
  carId,
  color,
  spoiler,
  rimColor,
  isUnlocked,
  price,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const carModelRef = useRef<CarModelInstance | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Rotation and zoom state
  const rotYRef = useRef<number>(Math.PI * 0.25);
  const rotXRef = useRef<number>(0.12);
  const zoomDistRef = useRef<number>(5.6);
  const isDraggingRef = useRef<boolean>(false);
  const lastPointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const idleTimerRef = useRef<number>(0);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 380;
    const height = container.clientHeight || 240;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // 4. Showroom Lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x18181b, 0.9);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(6, 8, 6);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 2.5);
    rimLight.position.set(-6, 4, -6);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0xfef08a, 1.2);
    fillLight.position.set(0, 5, -8);
    scene.add(fillLight);

    // 5. Studio Floor Grid
    const floorGeo = new THREE.CylinderGeometry(4.8, 4.8, 0.1, 32);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x09090b,
      roughness: 0.2,
      metalness: 0.85,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.05;
    scene.add(floor);

    // Showroom ring light on floor
    const ringGeo = new THREE.RingGeometry(3.6, 3.75, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 0.01;
    scene.add(ring);

    // 6. Build Car Model
    const model = buildPlayerCar(carId, color, spoiler, rimColor);
    model.headlightSpots.forEach((s) => (s.intensity = 6.0));
    model.laserSpotLights.forEach((s) => (s.intensity = 12.0));
    model.laserBeamMaterials.forEach((m) => (m.opacity = 0.08));
    model.brakeLightsMaterial.emissiveIntensity = 2.2;
    scene.add(model.group);
    carModelRef.current = model;

    // 7. Mouse and Mobile Touch Events for 360 Orbit & Pinch-To-Zoom
    const dom = renderer.domElement;
    dom.style.touchAction = 'none';

    let initialPinchDist = 0;
    let initialPinchZoom = zoomDistRef.current;

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return; // Handled by touch events for multi-touch pinch
      isDraggingRef.current = true;
      idleTimerRef.current = 0;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch' || !isDraggingRef.current) return;
      const dx = e.clientX - lastPointerRef.current.x;
      const dy = e.clientY - lastPointerRef.current.y;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };

      rotYRef.current += dx * 0.012;
      rotXRef.current = THREE.MathUtils.clamp(rotXRef.current + dy * 0.008, 0.02, Math.PI * 0.35);
      idleTimerRef.current = 0;
    };

    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      isDraggingRef.current = false;
    };

    const onTouchStart = (e: TouchEvent) => {
      idleTimerRef.current = 0;
      if (e.touches.length === 1) {
        isDraggingRef.current = true;
        lastPointerRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        isDraggingRef.current = false;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialPinchDist = Math.hypot(dx, dy);
        initialPinchZoom = zoomDistRef.current;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      idleTimerRef.current = 0;
      if (e.touches.length === 1 && isDraggingRef.current) {
        const dx = e.touches[0].clientX - lastPointerRef.current.x;
        const dy = e.touches[0].clientY - lastPointerRef.current.y;
        lastPointerRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };

        rotYRef.current += dx * 0.012;
        rotXRef.current = THREE.MathUtils.clamp(rotXRef.current + dy * 0.008, 0.02, Math.PI * 0.35);
      } else if (e.touches.length === 2 && initialPinchDist > 0) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const currentDist = Math.hypot(dx, dy);
        if (currentDist > 0) {
          const scale = initialPinchDist / currentDist;
          zoomDistRef.current = THREE.MathUtils.clamp(initialPinchZoom * scale, 3.8, 8.5);
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        isDraggingRef.current = false;
        initialPinchDist = 0;
      } else if (e.touches.length === 1) {
        isDraggingRef.current = true;
        lastPointerRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        initialPinchDist = 0;
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomDistRef.current = THREE.MathUtils.clamp(zoomDistRef.current + e.deltaY * 0.004, 3.8, 8.5);
    };

    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    dom.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchEnd, { passive: true });
    dom.addEventListener('wheel', onWheel, { passive: false });

    // 8. Animation Render Loop
    let lastTime = performance.now();
    const animate = (time: number) => {
      const delta = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // Auto-rotation when user is idle
      if (!isDraggingRef.current) {
        idleTimerRef.current += delta;
        if (idleTimerRef.current > 0.8) {
          rotYRef.current += delta * 0.35;
        }
      }

      // Update camera spherical position
      const dist = zoomDistRef.current;
      const pitch = rotXRef.current;
      const yaw = rotYRef.current;

      const camY = Math.sin(pitch) * dist + 0.6;
      const camH = Math.cos(pitch) * dist;
      const camX = Math.sin(yaw) * camH;
      const camZ = Math.cos(yaw) * camH;

      camera.position.set(camX, camY, camZ);
      camera.lookAt(0, 0.65, 0);

      renderer.render(scene, camera);
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    // Resize handler
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      dom.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
      dom.removeEventListener('wheel', onWheel);

      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (carModelRef.current) {
        scene.remove(carModelRef.current.group);
      }
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [carId, color, spoiler, rimColor]);

  return (
    <div className="relative w-full h-56 sm:h-64 rounded-2xl overflow-hidden border border-white/15 bg-gradient-to-b from-zinc-900 to-black shadow-inner my-2 touch-none">
      {/* 3D Three.js Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing touch-none" />

      {/* Floating 3D Interaction Hint */}
      <div className="absolute top-2.5 left-3 flex items-center space-x-1.5 bg-black/60 border border-white/10 px-2.5 py-1 rounded-lg text-[10px] text-zinc-300 pointer-events-none">
        <Move3d className="w-3.5 h-3.5 text-cyan-400" />
        <span>Chạm vuốt xoay 360° | 2 ngón phóng to</span>
      </div>

      {/* Locked Overlay */}
      {!isUnlocked && (
        <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center text-amber-400 space-y-1.5 pointer-events-none">
          <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-2xl">
            <Lock className="w-7 h-7 text-amber-400" />
          </div>
          <span className="font-extrabold text-sm tracking-wider">CHƯA SỞ HỮU XE</span>
          <span className="text-xs text-zinc-300 font-semibold bg-white/10 px-3 py-1 rounded-full">
            Mở khóa: {price.toLocaleString()} Xu
          </span>
        </div>
      )}
    </div>
  );
};
