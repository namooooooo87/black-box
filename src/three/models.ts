import * as THREE from 'three';
import { DoorConfig, TeamId, TerminalPlacement, ZoneId } from '../types/game';
import { createDoorSignTexture, createScreenTexture } from './textures';

export interface ExplorerBotRig {
  group: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  head: THREE.Group;
  antennaTip: THREE.Mesh;
  teamTrimMat: THREE.MeshStandardMaterial;
}

export function createExplorerBot(teamId: TeamId, shadowTex: THREE.CanvasTexture): ExplorerBotRig {
  const group = new THREE.Group();
  const teamColor = teamId === 'alpha' ? 0x0ea5e9 : 0xf43f5e;

  const ceramicMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    roughness: 0.35,
    metalness: 0.12,
  });
  const slateMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.55,
    metalness: 0.45,
  });
  const visorMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.12,
    metalness: 0.85,
  });
  const teamTrimMat = new THREE.MeshStandardMaterial({
    color: teamColor,
    emissive: teamColor,
    emissiveIntensity: 0.45,
    roughness: 0.3,
    metalness: 0.3,
  });
  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x38bdf8,
    emissiveIntensity: 1.4,
    roughness: 0.2,
  });

  // Ground contact shadow
  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(1.5, 1.5),
    new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
    })
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = 0.02;
  group.add(shadowPlane);

  // Legs (articulated at hip y = 0.52)
  const makeLeg = (offsetX: number) => {
    const legPivot = new THREE.Group();
    legPivot.position.set(offsetX, 0.52, 0);

    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.1, 0.36, 12), slateMat);
    thigh.position.y = -0.18;
    thigh.castShadow = true;
    legPivot.add(thigh);

    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.34), ceramicMat);
    boot.position.set(0, -0.44, 0.04);
    boot.castShadow = true;
    legPivot.add(boot);

    const sole = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.05, 0.36), teamTrimMat);
    sole.position.set(0, -0.495, 0.04);
    legPivot.add(sole);

    return legPivot;
  };

  const leftLeg = makeLeg(-0.18);
  const rightLeg = makeLeg(0.18);
  group.add(leftLeg, rightLeg);

  // Torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.68, 0.46), ceramicMat);
  torso.position.y = 0.9;
  torso.castShadow = true;
  group.add(torso);

  // Chest Core Plate
  const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.34, 0.08), slateMat);
  chestPlate.position.set(0, 0.92, 0.23);
  group.add(chestPlate);

  const chestCore = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.08, 16), teamTrimMat);
  chestCore.rotation.x = Math.PI / 2;
  chestCore.position.set(0, 0.92, 0.25);
  group.add(chestCore);

  // Backpack
  const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.5, 0.22), slateMat);
  backpack.position.set(0, 0.92, -0.32);
  backpack.castShadow = true;
  group.add(backpack);

  const packStripe = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.08, 0.24), teamTrimMat);
  packStripe.position.set(0, 1.02, -0.32);
  group.add(packStripe);

  // Arms (pivoted at shoulder y = 1.15)
  const makeArm = (offsetX: number) => {
    const armPivot = new THREE.Group();
    armPivot.position.set(offsetX, 1.15, 0);

    const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), teamTrimMat);
    armPivot.add(shoulder);

    const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.075, 0.44, 12), ceramicMat);
    forearm.position.y = -0.24;
    forearm.castShadow = true;
    armPivot.add(forearm);

    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), slateMat);
    hand.position.y = -0.48;
    armPivot.add(hand);

    return armPivot;
  };

  const leftArm = makeArm(-0.46);
  const rightArm = makeArm(0.46);
  group.add(leftArm, rightArm);

  // Head
  const head = new THREE.Group();
  head.position.set(0, 1.54, 0);

  const helmet = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.52, 0.54), ceramicMat);
  helmet.castShadow = true;
  head.add(helmet);

  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.28, 0.08), visorMat);
  visor.position.set(0, 0.0, 0.26);
  head.add(visor);

  const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 12), eyeMat);
  leftEye.position.set(-0.12, 0.02, 0.295);
  const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 12), eyeMat);
  rightEye.position.set(0.12, 0.02, 0.295);
  head.add(leftEye, rightEye);

  // Ear pods
  const earL = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.08, 12), teamTrimMat);
  earL.rotation.z = Math.PI / 2;
  earL.position.set(-0.33, 0, 0);
  const earR = earL.clone();
  earR.position.set(0.33, 0, 0);
  head.add(earL, earR);

  // Antenna
  const antennaStem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.24, 8), slateMat);
  antennaStem.position.set(0.16, 0.36, -0.05);
  head.add(antennaStem);

  const antennaTip = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), teamTrimMat);
  antennaTip.position.set(0.16, 0.49, -0.05);
  head.add(antennaTip);

  group.add(head);

  return {
    group,
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    head,
    antennaTip,
    teamTrimMat,
  };
}

export interface TerminalVisual {
  puzzleId: string;
  group: THREE.Group;
  beacon: THREE.Mesh;
  screenMesh: THREE.Mesh;
  ringMesh: THREE.Mesh;
  accentHex: string;
  kind: TerminalPlacement['kind'];
}

export function createTerminalStation(
  placement: TerminalPlacement,
  accentHex: string,
  solved: boolean,
  shadowTex: THREE.CanvasTexture,
  maxAnisotropy: number
): TerminalVisual {
  const group = new THREE.Group();
  group.position.set(placement.x, 0, placement.z);
  group.rotation.y = placement.rotY;

  const isBypass = placement.kind === 'bypass';
  const isCore = placement.kind === 'core';
  const activeHex = isBypass ? '#eab308' : accentHex;
  const colorNum = new THREE.Color(solved ? '#10b981' : activeHex).getHex();

  const bodyMat = new THREE.MeshStandardMaterial({
    color: isBypass ? 0x334155 : 0xe2e8f0,
    roughness: 0.4,
    metalness: 0.25,
  });
  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.45,
    metalness: 0.6,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: colorNum,
    emissive: colorNum,
    emissiveIntensity: 0.55,
    roughness: 0.25,
    metalness: 0.4,
  });

  // Contact shadow
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(isCore ? 4.2 : 2.1, isCore ? 4.2 : 2.1),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  group.add(shadow);

  // Base plinth
  const baseRadius = isCore ? 1.65 : 0.72;
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(baseRadius * 0.9, baseRadius, 0.22, isCore ? 8 : 6),
    darkMetalMat
  );
  base.position.y = 0.11;
  base.receiveShadow = true;
  base.castShadow = true;
  group.add(base);

  // Glowing floor ring
  const ringMesh = new THREE.Mesh(
    new THREE.RingGeometry(baseRadius + 0.12, baseRadius + 0.26, 24),
    new THREE.MeshBasicMaterial({
      color: colorNum,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65,
    })
  );
  ringMesh.rotation.x = -Math.PI / 2;
  ringMesh.position.y = 0.03;
  group.add(ringMesh);

  let screenMesh: THREE.Mesh;

  if (isCore) {
    // Grand BLACK BOX Quantum Core in Zone 5
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.75, 1.3, 8), bodyMat);
    pillar.position.y = 0.85;
    pillar.castShadow = true;
    group.add(pillar);

    const blackCube = new THREE.Mesh(
      new THREE.BoxGeometry(1.15, 1.15, 1.15),
      new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.18,
        metalness: 0.85,
      })
    );
    blackCube.position.y = 2.35;
    blackCube.castShadow = true;
    group.add(blackCube);

    const screenTex = createScreenTexture(activeHex, solved, maxAnisotropy);
    screenMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.9, 0.9),
      new THREE.MeshBasicMaterial({ map: screenTex })
    );
    screenMesh.position.set(0, 2.35, 0.59);
    group.add(screenMesh);

    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.05, 12, 36), accentMat);
    ring1.position.y = 2.35;
    ring1.rotation.x = Math.PI / 3;
    group.add(ring1);
  } else if (placement.kind === 'rack') {
    const tower = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.0, 0.7), darkMetalMat);
    tower.position.y = 1.22;
    tower.castShadow = true;
    group.add(tower);

    const trim = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.12, 0.74), accentMat);
    trim.position.y = 2.15;
    group.add(trim);

    const screenTex = createScreenTexture(activeHex, solved, maxAnisotropy);
    screenMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.76, 0.56),
      new THREE.MeshBasicMaterial({ map: screenTex })
    );
    screenMesh.position.set(0, 1.45, 0.36);
    group.add(screenMesh);
  } else {
    // Sleek angled sci-fi console / pedestal / scanner
    const stand = new THREE.Mesh(new THREE.BoxGeometry(0.58, 1.05, 0.44), bodyMat);
    stand.position.y = 0.74;
    stand.castShadow = true;
    group.add(stand);

    const headBox = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.68, 0.18), darkMetalMat);
    headBox.position.set(0, 1.44, 0.05);
    headBox.rotation.x = -0.35;
    headBox.castShadow = true;
    group.add(headBox);

    const screenTex = createScreenTexture(activeHex, solved, maxAnisotropy);
    screenMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.82, 0.54),
      new THREE.MeshBasicMaterial({ map: screenTex })
    );
    screenMesh.position.set(0, 1.44, 0.145);
    screenMesh.rotation.x = -0.35;
    group.add(screenMesh);

    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.08, 0.48), accentMat);
    strip.position.y = 0.95;
    group.add(strip);
  }

  // Floating diamond beacon above terminal
  const beacon = new THREE.Mesh(
    new THREE.OctahedronGeometry(isCore ? 0.34 : 0.22, 0),
    accentMat
  );
  beacon.position.y = isCore ? 3.8 : 2.55;
  group.add(beacon);

  // Invisible hit box for easy mouse raycasting
  const hitMesh = new THREE.Mesh(
    new THREE.BoxGeometry(isCore ? 3 : 1.6, 3.2, isCore ? 3 : 1.6),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hitMesh.position.y = 1.6;
  hitMesh.userData.puzzleId = placement.puzzleId;
  hitMesh.layers.set(1);
  group.add(hitMesh);

  return {
    puzzleId: placement.puzzleId,
    group,
    beacon,
    screenMesh,
    ringMesh,
    accentHex: activeHex,
    kind: placement.kind,
  };
}

export interface DoorVisual {
  config: DoorConfig;
  group: THREE.Group;
  leftLeaf: THREE.Mesh;
  rightLeaf: THREE.Mesh;
  lightMat: THREE.MeshStandardMaterial;
  openProgress: number; // 0 = closed, 1 = open
}

export function createLabDoor(config: DoorConfig, maxAnisotropy = 1): DoorVisual {
  const group = new THREE.Group();
  group.position.set(config.x, 0, config.z);
  if (config.axis === 'z') {
    group.rotation.y = Math.PI / 2;
  }

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.45,
    metalness: 0.55,
  });
  const leafMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    roughness: 0.3,
    metalness: 0.4,
  });
  const lightMat = new THREE.MeshStandardMaterial({
    color: 0xf97316,
    emissive: 0xf97316,
    emissiveIntensity: 0.9,
    roughness: 0.2,
  });

  const halfW = config.width / 2;
  // Side pillars + lintel
  const pillarGeo = new THREE.BoxGeometry(0.45, 4.3, 0.9);
  const leftPillar = new THREE.Mesh(pillarGeo, frameMat);
  leftPillar.position.set(-halfW - 0.2, 2.15, 0);
  const rightPillar = new THREE.Mesh(pillarGeo, frameMat);
  rightPillar.position.set(halfW + 0.2, 2.15, 0);
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(config.width + 0.9, 0.7, 0.95), frameMat);
  lintel.position.set(0, 3.95, 0);
  const statusBar = new THREE.Mesh(new THREE.BoxGeometry(config.width * 0.75, 0.16, 1.02), lightMat);
  statusBar.position.set(0, 3.78, 0);
  group.add(leftPillar, rightPillar, lintel, statusBar);

  // Overhead doorway sign (both sides)
  const signTex = createDoorSignTexture(config.label, maxAnisotropy);
  const signMat = new THREE.MeshBasicMaterial({ map: signTex });
  const signGeo = new THREE.PlaneGeometry(config.width * 0.78, 0.48);
  const frontSign = new THREE.Mesh(signGeo, signMat);
  frontSign.position.set(0, 4.05, 0.49);
  const backSign = new THREE.Mesh(signGeo, signMat);
  backSign.position.set(0, 4.05, -0.49);
  backSign.rotation.y = Math.PI;
  group.add(frontSign, backSign);

  // Sliding leaves
  const leafW = config.width / 2;
  const leafGeo = new THREE.BoxGeometry(leafW, 3.55, 0.35);
  const leftLeaf = new THREE.Mesh(leafGeo, leafMat);
  leftLeaf.position.set(-leafW / 2, 1.78, 0);
  leftLeaf.castShadow = true;

  const rightLeaf = new THREE.Mesh(leafGeo, leafMat);
  rightLeaf.position.set(leafW / 2, 1.78, 0);
  rightLeaf.castShadow = true;

  group.add(leftLeaf, rightLeaf);

  return {
    config,
    group,
    leftLeaf,
    rightLeaf,
    lightMat,
    openProgress: 0,
  };
}

export function createZoneDecor(
  zoneId: ZoneId,
  serverTex: THREE.CanvasTexture,
  hazardTex: THREE.CanvasTexture
): THREE.Group {
  const group = new THREE.Group();
  const ceramic = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.35, metalness: 0.15 });
  const darkMetal = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.45, metalness: 0.55 });

  if (zoneId === 'zone1') {
    // Central holographic briefing table
    const tableBase = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.45, 0.9, 8), ceramic);
    tableBase.position.set(0, 0.45, 18);
    tableBase.castShadow = true;
    tableBase.receiveShadow = true;
    group.add(tableBase);

    const holoRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.9, 0.04, 10, 32),
      new THREE.MeshStandardMaterial({ color: 0x0ea5e9, emissive: 0x0ea5e9, emissiveIntensity: 0.8 })
    );
    holoRing.rotation.x = Math.PI / 2;
    holoRing.position.set(0, 1.05, 18);
    group.add(holoRing);

    const holoGlobe = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.45, 1),
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.6,
        wireframe: true,
      })
    );
    holoGlobe.position.set(0, 1.65, 18);
    holoGlobe.userData.spinY = 0.7;
    group.add(holoGlobe);
  }

  if (zoneId === 'zone2') {
    const rackMat = [
      darkMetal,
      darkMetal,
      darkMetal,
      darkMetal,
      new THREE.MeshStandardMaterial({ map: serverTex, roughness: 0.4, metalness: 0.3 }),
      new THREE.MeshStandardMaterial({ map: serverTex, roughness: 0.4, metalness: 0.3 }),
    ];
    const r1 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.9, 3.2), rackMat);
    r1.position.set(-31.2, 1.45, 14);
    r1.castShadow = true;
    const r2 = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.7, 1.6), rackMat);
    r2.position.set(-23.5, 1.35, 7.5);
    r2.castShadow = true;
    group.add(r1, r2);
  }

  if (zoneId === 'zone3') {
    // Algorithm lab robotic gantry & grid workbench
    const bench = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.95, 1.6), ceramic);
    bench.position.set(23.5, 0.48, 7.5);
    bench.castShadow = true;
    const armCol = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 1.6, 12), darkMetal);
    armCol.position.set(23.5, 1.5, 7.5);
    const armTop = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.16, 0.16),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3, metalness: 0.4 })
    );
    armTop.position.set(23.9, 2.25, 7.5);
    armTop.userData.spinY = 0.5;
    group.add(bench, armCol, armTop);

    const rack2 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.2, 3.2), ceramic);
    rack2.position.set(31.2, 1.1, 14);
    rack2.castShadow = true;
    group.add(rack2);
  }

  if (zoneId === 'zone4') {
    const hazardMat = new THREE.MeshStandardMaterial({ map: hazardTex, roughness: 0.5 });
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xfdba74,
      transparent: true,
      opacity: 0.38,
      roughness: 0.15,
      depthWrite: false,
    });

    for (const px of [-7, 7]) {
      const podBase = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.15, 0.45, 12), hazardMat);
      podBase.position.set(px, 0.225, -11);
      podBase.castShadow = true;

      const podGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 2.0, 16), glassMat);
      podGlass.position.set(px, 1.45, -11);

      const podCap = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 0.9, 0.3, 12), darkMetal);
      podCap.position.set(px, 2.6, -11);

      const coreCrystal = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.35, 0),
        new THREE.MeshStandardMaterial({ color: 0xf97316, emissive: 0xf97316, emissiveIntensity: 0.8 })
      );
      coreCrystal.position.set(px, 1.45, -11);
      coreCrystal.userData.spinY = 1.1;

      group.add(podBase, podGlass, podCap, coreCrystal);
    }
  }

  return group;
}
