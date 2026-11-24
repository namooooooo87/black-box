import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  DOORS,
  PROP_COLLIDERS,
  TERMINALS,
  WALLS,
  ZONES,
  getZoneAtPosition,
} from '../data/labLayout';
import { PUZZLES } from '../data/puzzles';
import {
  createExplorerBot,
  createLabDoor,
  createTerminalStation,
  createZoneDecor,
  DoorVisual,
  ExplorerBotRig,
  TerminalVisual,
} from '../three/models';
import {
  createContactShadowTexture,
  createHazardStripeTexture,
  createLabFloorTexture,
  createScreenTexture,
  createServerRackTexture,
} from '../three/textures';
import { TeamId, ZoneMeta } from '../types/game';

interface LabViewportProps {
  initialPosition: { x: number; z: number; rotY: number };
  teamId: TeamId;
  solvedPuzzleIds: string[];
  unlockedDoors: Record<string, boolean>;
  inputPaused: boolean;
  cameraResetSignal: number;
  explorationOnly?: boolean;
  autoOpenDoors?: boolean;
  onZoneChange: (zone: ZoneMeta) => void;
  onPositionUpdate: (pos: { x: number; z: number; rotY: number }) => void;
  onInteractPuzzle: (puzzleId: string) => void;
}

interface PromptState {
  visible: boolean;
  x: number;
  y: number;
  title: string;
  subtitle: string;
  kind: 'puzzle' | 'door';
  puzzleId?: string;
}

const _camTarget = new THREE.Vector3();
const _desiredCamPos = new THREE.Vector3();
const _screenVec = new THREE.Vector3();

function resolveCircleAABB(
  cx: number,
  cz: number,
  radius: number,
  box: { minX: number; maxX: number; minZ: number; maxZ: number }
): [number, number] {
  const closestX = Math.max(box.minX, Math.min(cx, box.maxX));
  const closestZ = Math.max(box.minZ, Math.min(cz, box.maxZ));
  const dx = cx - closestX;
  const dz = cz - closestZ;
  const distSq = dx * dx + dz * dz;

  if (distSq >= radius * radius) return [cx, cz];

  if (distSq > 0.00001) {
    const dist = Math.sqrt(distSq);
    const push = radius - dist;
    return [cx + (dx / dist) * push, cz + (dz / dist) * push];
  }

  // Center is inside AABB: push out along shallowest axis
  const left = Math.abs(cx - box.minX);
  const right = Math.abs(box.maxX - cx);
  const top = Math.abs(cz - box.minZ);
  const bottom = Math.abs(box.maxZ - cz);
  const minPen = Math.min(left, right, top, bottom);
  if (minPen === left) return [box.minX - radius, cz];
  if (minPen === right) return [box.maxX + radius, cz];
  if (minPen === top) return [cx, box.minZ - radius];
  return [cx, box.maxZ + radius];
}

export const LabViewport: React.FC<LabViewportProps> = ({
  initialPosition,
  teamId,
  solvedPuzzleIds,
  unlockedDoors,
  inputPaused,
  cameraResetSignal,
  explorationOnly = false,
  autoOpenDoors = false,
  onZoneChange,
  onPositionUpdate,
  onInteractPuzzle,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [prompt, setPrompt] = useState<PromptState>({
    visible: false,
    x: 0,
    y: 0,
    title: '',
    subtitle: '',
    kind: 'puzzle',
  });

  // Mutable refs so React state updates never recreate WebGL context
  const solvedRef = useRef<Set<string>>(new Set(solvedPuzzleIds));
  const doorsRef = useRef<Record<string, boolean>>(unlockedDoors);
  const pausedRef = useRef<boolean>(inputPaused);
  const explorationOnlyRef = useRef<boolean>(explorationOnly);
  const autoOpenDoorsRef = useRef<boolean>(autoOpenDoors);
  const teamRef = useRef<TeamId>(teamId);
  const callbacksRef = useRef({
    onZoneChange,
    onPositionUpdate,
    onInteractPuzzle,
  });

  const cameraAnglesRef = useRef({ yaw: 0, pitch: 0.48, dist: 9.2 });
  const playerStateRef = useRef({
    x: initialPosition.x,
    z: initialPosition.z,
    rotY: initialPosition.rotY,
  });

  const terminalVisualsRef = useRef<TerminalVisual[]>([]);
  const maxAnisoRef = useRef(1);
  const botRigRef = useRef<ExplorerBotRig | null>(null);
  const keysRef = useRef<Record<string, boolean>>({});
  const isDraggingRef = useRef<boolean>(false);

  useEffect(() => {
    solvedRef.current = new Set(solvedPuzzleIds);
    // Update terminal textures and beacon colors
    for (const tv of terminalVisualsRef.current) {
      const isSolved = solvedRef.current.has(tv.puzzleId);
      const col = new THREE.Color(isSolved ? '#10b981' : tv.accentHex);
      const beaconMat = tv.beacon.material as THREE.MeshStandardMaterial;
      beaconMat.color.copy(col);
      beaconMat.emissive.copy(col);

      const ringMat = tv.ringMesh.material as THREE.MeshBasicMaterial;
      ringMat.color.copy(col);

      const screenMat = tv.screenMesh.material as THREE.MeshBasicMaterial;
      if (screenMat.map) screenMat.map.dispose();
      screenMat.map = createScreenTexture(tv.accentHex, isSolved, maxAnisoRef.current);
      screenMat.needsUpdate = true;
    }
  }, [solvedPuzzleIds]);

  useEffect(() => {
    doorsRef.current = unlockedDoors;
  }, [unlockedDoors]);

  useEffect(() => {
    pausedRef.current = inputPaused;
    if (inputPaused) {
      for (const k of Object.keys(keysRef.current)) {
        keysRef.current[k] = false;
      }
      isDraggingRef.current = false;
      setPrompt((prev) => (prev.visible ? { ...prev, visible: false } : prev));
    }
  }, [inputPaused]);

  useEffect(() => {
    explorationOnlyRef.current = explorationOnly;
  }, [explorationOnly]);

  useEffect(() => {
    autoOpenDoorsRef.current = autoOpenDoors;
  }, [autoOpenDoors]);

  useEffect(() => {
    teamRef.current = teamId;
    if (botRigRef.current) {
      const col = teamId === 'alpha' ? 0x0ea5e9 : 0xf43f5e;
      botRigRef.current.teamTrimMat.color.setHex(col);
      botRigRef.current.teamTrimMat.emissive.setHex(col);
    }
  }, [teamId]);

  useEffect(() => {
    callbacksRef.current = { onZoneChange, onPositionUpdate, onInteractPuzzle };
  }, [onZoneChange, onPositionUpdate, onInteractPuzzle]);

  useEffect(() => {
    if (cameraResetSignal > 0) {
      cameraAnglesRef.current = { yaw: 0, pitch: 0.48, dist: 9.2 };
    }
  }, [cameraResetSignal]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xdce6f2);
    scene.fog = new THREE.Fog(0xdce6f2, 32, 85);

    const camera = new THREE.PerspectiveCamera(52, width / height, 0.2, 140);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    maxAnisoRef.current = maxAniso;

    container.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTex = pmremGenerator.fromScene(roomEnv, 0.04).texture;
    scene.environment = envTex;
    roomEnv.dispose();
    pmremGenerator.dispose();

    // Balanced 3-point bright sci-fi lab lighting
    const hemiLight = new THREE.HemisphereLight(0xf0f9ff, 0x94a3b8, 0.9);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 1.35);
    keyLight.position.set(18, 34, 24);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.left = -45;
    keyLight.shadow.camera.right = 45;
    keyLight.shadow.camera.top = 45;
    keyLight.shadow.camera.bottom = -45;
    keyLight.shadow.camera.near = 5;
    keyLight.shadow.camera.far = 90;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xbae6fd, 0.55);
    rimLight.position.set(-24, 18, -32);
    scene.add(rimLight);

    const disposableTextures: THREE.Texture[] = [];
    const shadowTex = createContactShadowTexture();
    const serverTex = createServerRackTexture(maxAniso);
    const hazardTex = createHazardStripeTexture(maxAniso);
    disposableTextures.push(shadowTex, serverTex, hazardTex);

    // Outer sub-floor slab
    const outerSlab = new THREE.Mesh(
      new THREE.PlaneGeometry(140, 140),
      new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.8, metalness: 0.05 })
    );
    outerSlab.rotation.x = -Math.PI / 2;
    outerSlab.position.y = -0.04;
    outerSlab.receiveShadow = true;
    scene.add(outerSlab);

    // Zone floors with distinct bright tint & crisp procedural tile texture
    for (const zMeta of ZONES) {
      const w = zMeta.bounds.maxX - zMeta.bounds.minX + 2;
      const d = zMeta.bounds.maxZ - zMeta.bounds.minZ + 2;
      const cx = (zMeta.bounds.minX + zMeta.bounds.maxX) / 2;
      const cz = (zMeta.bounds.minZ + zMeta.bounds.maxZ) / 2;

      const floorTex = createLabFloorTexture(zMeta.floorTintHex, zMeta.accentHex, maxAniso);
      floorTex.repeat.set(Math.round(w / 2.5), Math.round(d / 2.5));
      disposableTextures.push(floorTex);

      const floorMat = new THREE.MeshStandardMaterial({
        map: floorTex,
        roughness: 0.65,
        metalness: 0.08,
      });
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(w, d), floorMat);
      floor.rotation.x = -Math.PI / 2;
      floor.position.set(cx, 0, cz);
      floor.receiveShadow = true;
      scene.add(floor);

      const decor = createZoneDecor(zMeta.id, serverTex, hazardTex);
      scene.add(decor);

      // Sleek ceiling light panel per zone
      const lightPanel = new THREE.Mesh(
        new THREE.BoxGeometry(Math.min(8, w * 0.45), 0.14, 1.4),
        new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: new THREE.Color(zMeta.accentHex),
          emissiveIntensity: 0.45,
          roughness: 0.2,
        })
      );
      lightPanel.position.set(cx, 4.35, cz);
      scene.add(lightPanel);
    }

    // Build architectural walls with top accent trim
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.45,
      metalness: 0.1,
    });
    const wallBaseMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.6,
      metalness: 0.3,
    });

    for (const w of WALLS) {
      const widthX = w.maxX - w.minX;
      const depthZ = w.maxZ - w.minZ;
      const cx = (w.minX + w.maxX) / 2;
      const cz = (w.minZ + w.maxZ) / 2;

      const body = new THREE.Mesh(new THREE.BoxGeometry(widthX, w.height, depthZ), wallMat);
      body.position.set(cx, w.height / 2, cz);
      body.castShadow = true;
      body.receiveShadow = true;
      scene.add(body);

      const plinth = new THREE.Mesh(new THREE.BoxGeometry(widthX + 0.06, 0.28, depthZ + 0.06), wallBaseMat);
      plinth.position.set(cx, 0.14, cz);
      scene.add(plinth);

      if (w.zoneColor) {
        const trimMat = new THREE.MeshStandardMaterial({
          color: w.zoneColor,
          emissive: w.zoneColor,
          emissiveIntensity: 0.35,
          roughness: 0.3,
        });
        const trim = new THREE.Mesh(new THREE.BoxGeometry(widthX + 0.06, 0.12, depthZ + 0.06), trimMat);
        trim.position.set(cx, w.height - 0.3, cz);
        scene.add(trim);
      }
    }

    // Build sliding security doors
    const doorVisuals: DoorVisual[] = DOORS.map((dCfg) => {
      const dv = createLabDoor(dCfg, maxAniso);
      scene.add(dv.group);
      return dv;
    });

    // Build interactive terminals
    const terminals: TerminalVisual[] = TERMINALS.map((tp) => {
      const zMeta = ZONES.find((z) => z.id === tp.zoneId)!;
      const tv = createTerminalStation(
        tp,
        zMeta.accentHex,
        solvedRef.current.has(tp.puzzleId),
        shadowTex,
        maxAniso
      );
      scene.add(tv.group);
      return tv;
    });
    terminalVisualsRef.current = terminals;

    // Build player Explorer Bot
    const botRig = createExplorerBot(teamRef.current, shadowTex);
    botRig.group.position.set(playerStateRef.current.x, 0, playerStateRef.current.z);
    botRig.group.rotation.y = playerStateRef.current.rotY;
    scene.add(botRig.group);
    botRigRef.current = botRig;

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Input state
    const keys = keysRef.current;
    let nearestPuzzleId: string | null = null;
    let pointerDownPos = { x: 0, y: 0 };
    let prevPointerPos = { x: 0, y: 0 };
    let lastZoneId = '';
    let lastSaveTime = 0;

    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);
    const mouseNdc = new THREE.Vector2();

    const triggerNearestInteract = () => {
      if (pausedRef.current) return;
      if (nearestPuzzleId) {
        callbacksRef.current.onInteractPuzzle(nearestPuzzleId);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (pausedRef.current) return;
      keys[e.code] = true;
      if (e.code === 'KeyE' || e.code === 'Space') {
        if (nearestPuzzleId) {
          e.preventDefault();
          triggerNearestInteract();
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };

    const canvasEl = renderer.domElement;

    const onPointerDown = (e: PointerEvent) => {
      if (pausedRef.current) return;
      isDraggingRef.current = true;
      pointerDownPos = { x: e.clientX, y: e.clientY };
      prevPointerPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current || pausedRef.current) return;
      const dx = e.clientX - prevPointerPos.x;
      const dy = e.clientY - prevPointerPos.y;
      prevPointerPos = { x: e.clientX, y: e.clientY };

      cameraAnglesRef.current.yaw -= dx * 0.006;
      cameraAnglesRef.current.pitch = THREE.MathUtils.clamp(
        cameraAnglesRef.current.pitch + dy * 0.005,
        0.22,
        1.12
      );
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;

      if (pausedRef.current) return;
      const moveDist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      if (moveDist < 6) {
        const rect = canvasEl.getBoundingClientRect();
        mouseNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouseNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouseNdc, camera);
        const hits = raycaster.intersectObjects(scene.children, true);
        if (hits.length > 0) {
          const pId = hits[0].object.userData.puzzleId as string | undefined;
          if (pId) {
            const term = TERMINALS.find((t) => t.puzzleId === pId);
            if (term) {
              const d = Math.hypot(term.x - playerStateRef.current.x, term.z - playerStateRef.current.z);
              if (d <= 6.2) {
                callbacksRef.current.onInteractPuzzle(pId);
              }
            }
          }
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (pausedRef.current) return;
      cameraAnglesRef.current.dist = THREE.MathUtils.clamp(
        cameraAnglesRef.current.dist + e.deltaY * 0.006,
        5.5,
        15
      );
    };

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('resize', onResize);
    canvasEl.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    canvasEl.addEventListener('wheel', onWheel, { passive: true });

    // Initialize camera at spawn immediately
    const camInit = cameraAnglesRef.current;
    camera.position.set(
      playerStateRef.current.x + Math.sin(camInit.yaw) * Math.cos(camInit.pitch) * camInit.dist,
      1.6 + Math.sin(camInit.pitch) * camInit.dist,
      playerStateRef.current.z + Math.cos(camInit.yaw) * Math.cos(camInit.pitch) * camInit.dist
    );
    camera.lookAt(playerStateRef.current.x, 1.3, playerStateRef.current.z);

    let frameId = 0;
    let disposed = false;
    const clock = new THREE.Clock();
    let walkPhase = 0;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    const tick = () => {
      if (disposed) return;
      const dt = Math.min(clock.getDelta(), 0.08);
      const elapsed = clock.getElapsedTime();

      // Keyboard camera rotation (J/L or Q/C or [/])
      if (!pausedRef.current) {
        if (keys['KeyJ'] || keys['BracketLeft']) cameraAnglesRef.current.yaw += 1.9 * dt;
        if (keys['KeyL'] || keys['BracketRight']) cameraAnglesRef.current.yaw -= 1.9 * dt;
      }

      // Player movement relative to camera yaw
      let moveX = 0;
      let moveZ = 0;
      if (!pausedRef.current) {
        const forward = (keys['KeyW'] || keys['ArrowUp'] ? 1 : 0) - (keys['KeyS'] || keys['ArrowDown'] ? 1 : 0);
        const strafe = (keys['KeyD'] || keys['ArrowRight'] ? 1 : 0) - (keys['KeyA'] || keys['ArrowLeft'] ? 1 : 0);
        if (forward !== 0 || strafe !== 0) {
          const yaw = cameraAnglesRef.current.yaw;
          const fx = -Math.sin(yaw);
          const fz = -Math.cos(yaw);
          const rx = Math.cos(yaw);
          const rz = -Math.sin(yaw);
          moveX = fx * forward + rx * strafe;
          moveZ = fz * forward + rz * strafe;
          const len = Math.hypot(moveX, moveZ);
          if (len > 0) {
            moveX /= len;
            moveZ /= len;
          }
        }
      }

      const isMoving = moveX !== 0 || moveZ !== 0;
      const speed = keys['ShiftLeft'] || keys['ShiftRight'] ? 9.4 : 6.4;

      if (isMoving) {
        let nx = playerStateRef.current.x + moveX * speed * dt;
        let nz = playerStateRef.current.z + moveZ * speed * dt;

        const playerRadius = 0.52;
        for (const w of WALLS) {
          [nx, nz] = resolveCircleAABB(nx, nz, playerRadius, w);
        }
        for (const p of PROP_COLLIDERS) {
          [nx, nz] = resolveCircleAABB(nx, nz, playerRadius, p);
        }
        // Collide with locked doors (in explorationOnly mode, doors open automatically on approach)
        for (const dv of doorVisuals) {
          const nearDoor =
            (explorationOnlyRef.current || autoOpenDoorsRef.current) &&
            Math.hypot(dv.config.x - nx, dv.config.z - nz) < 4.4;
          const isOpen = nearDoor || !!doorsRef.current[dv.config.id];
          if (!isOpen) {
            const hw = dv.config.axis === 'x' ? dv.config.width / 2 : 0.45;
            const hd = dv.config.axis === 'z' ? dv.config.width / 2 : 0.45;
            [nx, nz] = resolveCircleAABB(nx, nz, playerRadius, {
              minX: dv.config.x - hw,
              maxX: dv.config.x + hw,
              minZ: dv.config.z - hd,
              maxZ: dv.config.z + hd,
            });
          }
        }

        // Safety clamp inside outer lab bounds so player never leaves the floor
        playerStateRef.current.x = THREE.MathUtils.clamp(nx, -34, 34);
        playerStateRef.current.z = THREE.MathUtils.clamp(nz, -42, 26);

        const targetRot = Math.atan2(moveX, moveZ);
        let diff = targetRot - playerStateRef.current.rotY;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        playerStateRef.current.rotY += diff * (1 - Math.exp(-14 * dt));

        walkPhase += dt * (keys['ShiftLeft'] ? 14 : 10);
      } else {
        walkPhase = 0;
      }

      // Apply bot rig animation (always grounded at y >= 0)
      botRig.group.position.set(playerStateRef.current.x, 0, playerStateRef.current.z);
      botRig.group.rotation.y = playerStateRef.current.rotY;
      const swing = isMoving ? Math.sin(walkPhase) * 0.55 : 0;
      botRig.leftLeg.rotation.x = THREE.MathUtils.damp(botRig.leftLeg.rotation.x, swing, 12, dt);
      botRig.rightLeg.rotation.x = THREE.MathUtils.damp(botRig.rightLeg.rotation.x, -swing, 12, dt);
      botRig.leftArm.rotation.x = THREE.MathUtils.damp(botRig.leftArm.rotation.x, -swing * 0.8, 12, dt);
      botRig.rightArm.rotation.x = THREE.MathUtils.damp(botRig.rightArm.rotation.x, swing * 0.8, 12, dt);
      botRig.group.position.y = isMoving ? Math.abs(Math.sin(walkPhase)) * 0.06 : Math.sin(elapsed * 2.2) * 0.015;

      // Animate doors smoothly (auto-open near player in explorationOnly mode)
      for (const dv of doorVisuals) {
        const nearDoor =
          (explorationOnlyRef.current || autoOpenDoorsRef.current) &&
          Math.hypot(dv.config.x - playerStateRef.current.x, dv.config.z - playerStateRef.current.z) < 4.4;
        const isOpen = nearDoor || !!doorsRef.current[dv.config.id];
        dv.openProgress = THREE.MathUtils.damp(dv.openProgress, isOpen ? 1 : 0, 5.5, dt);
        const leafW = dv.config.width / 2;
        const slide = dv.openProgress * (leafW * 0.92);
        dv.leftLeaf.position.x = -leafW / 2 - slide;
        dv.rightLeaf.position.x = leafW / 2 + slide;
        const targetColor = isOpen ? 0x10b981 : 0xf97316;
        dv.lightMat.color.setHex(targetColor);
        dv.lightMat.emissive.setHex(targetColor);
      }

      // Animate beacons & zone props
      for (const tv of terminals) {
        tv.beacon.rotation.y += dt * 1.8;
        tv.beacon.position.y = (tv.kind === 'core' ? 3.8 : 2.55) + Math.sin(elapsed * 2.5 + tv.group.position.x) * 0.12;
      }

      scene.traverse((obj) => {
        if (obj.userData.spinY) {
          obj.rotation.y += dt * (obj.userData.spinY as number);
        }
      });

      // Smooth 3rd-person camera follow
      const { yaw, pitch, dist } = cameraAnglesRef.current;
      _desiredCamPos.set(
        playerStateRef.current.x + Math.sin(yaw) * Math.cos(pitch) * dist,
        Math.max(1.6, 1.3 + Math.sin(pitch) * dist),
        playerStateRef.current.z + Math.cos(yaw) * Math.cos(pitch) * dist
      );
      camera.position.x = THREE.MathUtils.damp(camera.position.x, _desiredCamPos.x, 8, dt);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, _desiredCamPos.y, 8, dt);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, _desiredCamPos.z, 8, dt);
      _camTarget.set(playerStateRef.current.x, 1.35, playerStateRef.current.z);
      camera.lookAt(_camTarget);

      // Update zone detection & periodic save
      const curZone = getZoneAtPosition(playerStateRef.current.x, playerStateRef.current.z);
      if (curZone.id !== lastZoneId) {
        lastZoneId = curZone.id;
        callbacksRef.current.onZoneChange(curZone);
      }
      if (elapsed - lastSaveTime > 1.2) {
        lastSaveTime = elapsed;
        callbacksRef.current.onPositionUpdate({
          x: Number(playerStateRef.current.x.toFixed(2)),
          z: Number(playerStateRef.current.z.toFixed(2)),
          rotY: Number(playerStateRef.current.rotY.toFixed(2)),
        });
      }

      // Find nearest interactable terminal or locked door
      let bestTerm: TerminalPlacementInfo | null = null;
      let bestDist = 4.5;

      interface TerminalPlacementInfo {
        puzzleId: string;
        x: number;
        z: number;
        kind: string;
      }

      for (const tp of TERMINALS) {
        const d = Math.hypot(tp.x - playerStateRef.current.x, tp.z - playerStateRef.current.z);
        const maxTrigger = tp.kind === 'core' ? 4.4 : 3.5;
        if (d < maxTrigger && d < bestDist) {
          bestDist = d;
          bestTerm = tp;
        }
      }

      if (bestTerm && !pausedRef.current) {
        nearestPuzzleId = bestTerm.puzzleId;
        const puzzle = PUZZLES.find((p) => p.id === bestTerm!.puzzleId);
        const isSolved = solvedRef.current.has(bestTerm.puzzleId);
        _screenVec.set(bestTerm.x, bestTerm.kind === 'core' ? 3.5 : 2.4, bestTerm.z);
        _screenVec.project(camera);
        const sx = ((_screenVec.x + 1) / 2) * canvasEl.clientWidth;
        const sy = (-(_screenVec.y - 1) / 2) * canvasEl.clientHeight;
        setPrompt({
          visible: _screenVec.z < 1,
          x: sx,
          y: Math.max(85, Math.min(canvasEl.clientHeight - 100, sy)),
          title: puzzle ? puzzle.title : '단말기',
          subtitle: explorationOnlyRef.current
            ? 'E 키를 눌러 조사하기'
            : isSolved
            ? '[E / 클릭] 문제 다시 보기 (해결됨)'
            : 'E 키를 눌러 조사하기',
          kind: 'puzzle',
          puzzleId: bestTerm.puzzleId,
        });
      } else {
        nearestPuzzleId = null;
        // Check nearest locked door (skipped when explorationOnly auto-opens doors)
        let lockedDoor: DoorVisual | null = null;
        let doorDist = 3.2;
        if (!explorationOnlyRef.current && !autoOpenDoorsRef.current) {
          for (const dv of doorVisuals) {
            if (!doorsRef.current[dv.config.id]) {
              const d = Math.hypot(dv.config.x - playerStateRef.current.x, dv.config.z - playerStateRef.current.z);
              if (d < doorDist) {
                doorDist = d;
                lockedDoor = dv;
              }
            }
          }
        }
        if (lockedDoor && !pausedRef.current) {
          _screenVec.set(lockedDoor.config.x, 2.8, lockedDoor.config.z);
          _screenVec.project(camera);
          const sx = ((_screenVec.x + 1) / 2) * canvasEl.clientWidth;
          const sy = (-(_screenVec.y - 1) / 2) * canvasEl.clientHeight;
          setPrompt({
            visible: _screenVec.z < 1,
            x: sx,
            y: Math.max(85, Math.min(canvasEl.clientHeight - 100, sy)),
            title: `${lockedDoor.config.label} (잠김)`,
            subtitle: lockedDoor.config.unlockRuleText,
            kind: 'door',
          });
        } else {
          setPrompt((prev) => (prev.visible ? { ...prev, visible: false } : prev));
        }
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('resize', onResize);
      canvasEl.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      canvasEl.removeEventListener('wheel', onWheel);

      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const m = obj as THREE.Mesh;
          m.geometry.dispose();
          if (Array.isArray(m.material)) {
            m.material.forEach((mat) => mat.dispose());
          } else {
            m.material.dispose();
          }
        }
      });
      disposableTextures.forEach((t) => t.dispose());
      envTex.dispose();
      renderer.dispose();
      if (canvasEl.parentNode === container) {
        container.removeChild(canvasEl);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      {prompt.visible && (
        <div
          style={{
            left: `${prompt.x}px`,
            top: `${prompt.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
          className="absolute z-20 pointer-events-auto"
        >
          {prompt.kind === 'puzzle' && prompt.puzzleId ? (
            <button
              onClick={() => onInteractPuzzle(prompt.puzzleId!)}
              className="px-4 py-2 rounded-xl bg-slate-900/95 border border-sky-400/70 text-left shadow-xl hover:bg-slate-800 transition-colors"
            >
              <div className="text-xs font-bold text-white whitespace-nowrap">{prompt.title}</div>
              <div className="text-[11px] font-medium text-sky-300 whitespace-nowrap">{prompt.subtitle}</div>
            </button>
          ) : (
            <div className="px-4 py-2 rounded-xl bg-slate-900/95 border border-amber-400/70 text-left shadow-xl">
              <div className="text-xs font-bold text-amber-300 whitespace-nowrap">{prompt.title}</div>
              <div className="text-[11px] text-slate-200 whitespace-nowrap">{prompt.subtitle}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
