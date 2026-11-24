import { DoorConfig, TerminalPlacement, WallBox, ZoneId, ZoneMeta } from '../types/game';

export const ZONES: ZoneMeta[] = [
  {
    id: 'zone1',
    shortName: 'ZONE 1',
    name: '중앙 통제실',
    subtitle: '컴퓨팅 사고력 기초 및 패턴 인식',
    accentHex: '#0ea5e9',
    floorTintHex: '#e2f1fb',
    bounds: { minX: -11, maxX: 11, minZ: 6, maxZ: 26 },
    center: [0, 16],
  },
  {
    id: 'zone2',
    shortName: 'ZONE 2',
    name: '데이터 서버실',
    subtitle: '정보 분석 및 추상화',
    accentHex: '#10b981',
    floorTintHex: '#dff7ee',
    bounds: { minX: -34, maxX: -13, minZ: 4, maxZ: 24 },
    center: [-23.5, 14],
  },
  {
    id: 'zone3',
    shortName: 'ZONE 3',
    name: '알고리즘 실험실',
    subtitle: '알고리즘 및 논리적 사고',
    accentHex: '#f59e0b',
    floorTintHex: '#fcf3dc',
    bounds: { minX: 13, maxX: 34, minZ: 4, maxZ: 24 },
    center: [23.5, 14],
  },
  {
    id: 'zone4',
    shortName: 'ZONE 4',
    name: '오류 격리 구역',
    subtitle: '디버깅 및 문제 해결',
    accentHex: '#f97316',
    floorTintHex: '#fdece2',
    bounds: { minX: -22, maxX: 22, minZ: -18, maxZ: 2 },
    center: [0, -8],
  },
  {
    id: 'zone5',
    shortName: 'ZONE 5',
    name: '최종 시스템',
    subtitle: 'BLACK BOX 종합 추리 및 복구',
    accentHex: '#6366f1',
    floorTintHex: '#eaeafd',
    bounds: { minX: -14, maxX: 14, minZ: -42, maxZ: -20 },
    center: [0, -31],
  },
];

export const WALLS: WallBox[] = [
  // Zone 1 South & Wing Dividers
  { id: 'w-z1-south', minX: -13, maxX: 13, minZ: 26, maxZ: 28, height: 4.5, zoneColor: '#0ea5e9' },
  { id: 'w-z1-z2-s', minX: -13, maxX: -11, minZ: 4, maxZ: 14, height: 4.5, zoneColor: '#0ea5e9' },
  { id: 'w-z1-z2-n', minX: -13, maxX: -11, minZ: 18, maxZ: 26, height: 4.5, zoneColor: '#0ea5e9' },
  { id: 'w-z1-z3-s', minX: 11, maxX: 13, minZ: 4, maxZ: 14, height: 4.5, zoneColor: '#0ea5e9' },
  { id: 'w-z1-z3-n', minX: 11, maxX: 13, minZ: 18, maxZ: 26, height: 4.5, zoneColor: '#0ea5e9' },
  { id: 'w-z1-z4-l', minX: -13, maxX: -2, minZ: 2, maxZ: 6, height: 4.5, zoneColor: '#0ea5e9' },
  { id: 'w-z1-z4-r', minX: 2, maxX: 13, minZ: 2, maxZ: 6, height: 4.5, zoneColor: '#0ea5e9' },

  // Zone 2 Outer Walls
  { id: 'w-z2-west', minX: -36, maxX: -34, minZ: 2, maxZ: 26, height: 4.5, zoneColor: '#10b981' },
  { id: 'w-z2-south', minX: -36, maxX: -12, minZ: 24, maxZ: 26, height: 4.5, zoneColor: '#10b981' },
  { id: 'w-z2-z4-l', minX: -36, maxX: -20, minZ: 2, maxZ: 4, height: 4.5, zoneColor: '#10b981' },
  { id: 'w-z2-z4-r', minX: -16, maxX: -12, minZ: 2, maxZ: 4, height: 4.5, zoneColor: '#10b981' },

  // Zone 3 Outer Walls
  { id: 'w-z3-east', minX: 34, maxX: 36, minZ: 2, maxZ: 26, height: 4.5, zoneColor: '#f59e0b' },
  { id: 'w-z3-south', minX: 12, maxX: 36, minZ: 24, maxZ: 26, height: 4.5, zoneColor: '#f59e0b' },
  { id: 'w-z3-z4-l', minX: 12, maxX: 16, minZ: 2, maxZ: 4, height: 4.5, zoneColor: '#f59e0b' },
  { id: 'w-z3-z4-r', minX: 20, maxX: 36, minZ: 2, maxZ: 4, height: 4.5, zoneColor: '#f59e0b' },

  // Zone 4 Outer Walls
  { id: 'w-z4-west', minX: -24, maxX: -22, minZ: -20, maxZ: 4, height: 4.5, zoneColor: '#f97316' },
  { id: 'w-z4-east', minX: 22, maxX: 24, minZ: -20, maxZ: 4, height: 4.5, zoneColor: '#f97316' },
  { id: 'w-z4-z5-l', minX: -24, maxX: -2.2, minZ: -20, maxZ: -18, height: 4.5, zoneColor: '#f97316' },
  { id: 'w-z4-z5-r', minX: 2.2, maxX: 24, minZ: -20, maxZ: -18, height: 4.5, zoneColor: '#f97316' },

  // Zone 5 Outer Walls
  { id: 'w-z5-west', minX: -16, maxX: -14, minZ: -44, maxZ: -18, height: 5.2, zoneColor: '#6366f1' },
  { id: 'w-z5-east', minX: 14, maxX: 16, minZ: -44, maxZ: -18, height: 5.2, zoneColor: '#6366f1' },
  { id: 'w-z5-north', minX: -16, maxX: 16, minZ: -44, maxZ: -42, height: 5.2, zoneColor: '#6366f1' },
];

export const DOORS: DoorConfig[] = [
  {
    id: 'door-1-2',
    label: 'ZONE 2 데이터 서버실 게이트',
    x: -12,
    z: 16,
    axis: 'z',
    width: 4,
    unlockRuleText: 'ZONE 1 문제 2개 또는 비상 우회 단말 해결 시 개방',
  },
  {
    id: 'door-1-3',
    label: 'ZONE 3 알고리즘 실험실 게이트',
    x: 12,
    z: 16,
    axis: 'z',
    width: 4,
    unlockRuleText: 'ZONE 1 문제 2개 또는 비상 우회 단말 해결 시 개방',
  },
  {
    id: 'door-1-4',
    label: 'ZONE 4 중앙 직통 게이트',
    x: 0,
    z: 4,
    axis: 'x',
    width: 4,
    unlockRuleText: 'ZONE 2와 ZONE 3을 모두 통과하면 개방',
  },
  {
    id: 'door-2-4',
    label: 'ZONE 2→4 북쪽 연결 게이트',
    x: -18,
    z: 3,
    axis: 'x',
    width: 4,
    unlockRuleText: 'ZONE 2 문제 2개 또는 우회 단말 해결 시 개방',
  },
  {
    id: 'door-3-4',
    label: 'ZONE 3→4 북쪽 연결 게이트',
    x: 18,
    z: 3,
    axis: 'x',
    width: 4,
    unlockRuleText: 'ZONE 3 문제 2개 또는 우회 단말 해결 시 개방',
  },
  {
    id: 'door-4-5',
    label: 'ZONE 5 최종 시스템 보안 게이트',
    x: 0,
    z: -19,
    axis: 'x',
    width: 4.4,
    unlockRuleText: 'ZONE 4 문제 2개 또는 우회 단말 해결 시 개방',
  },
];

export const TERMINALS: TerminalPlacement[] = [
  // Zone 1 (Spawn at 0, 22)
  { puzzleId: 'z1-p1', zoneId: 'zone1', x: -5.5, z: 13.5, rotY: 0.45, kind: 'console' },
  { puzzleId: 'z1-p2', zoneId: 'zone1', x: 0, z: 11.5, rotY: 0, kind: 'pedestal' },
  { puzzleId: 'z1-p3', zoneId: 'zone1', x: 5.5, z: 13.5, rotY: -0.45, kind: 'console' },
  { puzzleId: 'z1-bypass', zoneId: 'zone1', x: -8.5, z: 20.5, rotY: 1.2, kind: 'bypass' },

  // Zone 2
  { puzzleId: 'z2-p1', zoneId: 'zone2', x: -29, z: 18, rotY: 0.7, kind: 'rack' },
  { puzzleId: 'z2-p2', zoneId: 'zone2', x: -23.5, z: 14, rotY: 0, kind: 'console' },
  { puzzleId: 'z2-p3', zoneId: 'zone2', x: -29, z: 9, rotY: 2.3, kind: 'rack' },
  { puzzleId: 'z2-bypass', zoneId: 'zone2', x: -15.5, z: 7.5, rotY: -0.6, kind: 'bypass' },

  // Zone 3
  { puzzleId: 'z3-p1', zoneId: 'zone3', x: 29, z: 18, rotY: -0.7, kind: 'pedestal' },
  { puzzleId: 'z3-p2', zoneId: 'zone3', x: 23.5, z: 14, rotY: 0, kind: 'console' },
  { puzzleId: 'z3-p3', zoneId: 'zone3', x: 29, z: 9, rotY: -2.3, kind: 'pedestal' },
  { puzzleId: 'z3-bypass', zoneId: 'zone3', x: 15.5, z: 7.5, rotY: 0.6, kind: 'bypass' },

  // Zone 4
  { puzzleId: 'z4-p1', zoneId: 'zone4', x: -13, z: -8, rotY: 0.5, kind: 'scanner' },
  { puzzleId: 'z4-p2', zoneId: 'zone4', x: 0, z: -8, rotY: 0, kind: 'console' },
  { puzzleId: 'z4-p3', zoneId: 'zone4', x: 13, z: -8, rotY: -0.5, kind: 'scanner' },
  { puzzleId: 'z4-bypass', zoneId: 'zone4', x: -4.5, z: -15.5, rotY: 0.3, kind: 'bypass' },

  // Zone 5
  { puzzleId: 'z5-p1', zoneId: 'zone5', x: -8.5, z: -28, rotY: 0.6, kind: 'console' },
  { puzzleId: 'z5-p2', zoneId: 'zone5', x: 0, z: -25.5, rotY: 0, kind: 'pedestal' },
  { puzzleId: 'z5-p3', zoneId: 'zone5', x: 8.5, z: -28, rotY: -0.6, kind: 'console' },
  { puzzleId: 'z5-final', zoneId: 'zone5', x: 0, z: -35.5, rotY: 0, kind: 'core' },
];

// Decorative / physical prop obstacles for collision (so player doesn't walk through central pillars or terminals)
export const PROP_COLLIDERS: Array<{ id: string; minX: number; maxX: number; minZ: number; maxZ: number }> = [
  // Central Zone 1 holographic table
  { id: 'prop-z1-hub', minX: -1.6, maxX: 1.6, minZ: 16.4, maxZ: 19.6 },
  // Zone 2 decorative server towers
  { id: 'prop-z2-s1', minX: -32.2, maxX: -30.2, minZ: 12.2, maxZ: 15.8 },
  { id: 'prop-z2-s2', minX: -25, maxX: -22, minZ: 6.5, maxZ: 8.5 },
  // Zone 3 decorative algorithm table
  { id: 'prop-z3-t1', minX: 22, maxX: 25, minZ: 6.5, maxZ: 8.5 },
  { id: 'prop-z3-t2', minX: 30.2, maxX: 32.2, minZ: 12.2, maxZ: 15.8 },
  // Zone 4 quarantine pods
  { id: 'prop-z4-pod1', minX: -8.2, maxX: -5.8, minZ: -12.2, maxZ: -9.8 },
  { id: 'prop-z4-pod2', minX: 5.8, maxX: 8.2, minZ: -12.2, maxZ: -9.8 },
  // Zone 5 Quantum Core pedestal
  { id: 'prop-z5-core', minX: -1.5, maxX: 1.5, minZ: -37.0, maxZ: -34.0 },
  // Terminal plinth colliders (tight around terminal base so player stands comfortably at 1.4-3.4m)
  ...TERMINALS.filter((t) => t.kind !== 'core').map((t) => ({
    id: `term-col-${t.puzzleId}`,
    minX: t.x - 0.75,
    maxX: t.x + 0.75,
    minZ: t.z - 0.75,
    maxZ: t.z + 0.75,
  })),
];

export function getZoneAtPosition(x: number, z: number): ZoneMeta {
  for (const zone of ZONES) {
    if (
      x >= zone.bounds.minX - 1 &&
      x <= zone.bounds.maxX + 1 &&
      z >= zone.bounds.minZ - 1 &&
      z <= zone.bounds.maxZ + 1
    ) {
      return zone;
    }
  }
  return ZONES[0];
}

export function computeUnlockedDoors(
  solvedPuzzleIds: string[],
  syncedZones: ZoneId[] = []
): Record<string, boolean> {
  const solved = new Set(solvedPuzzleIds);
  const synced = new Set(syncedZones);

  const countInZone = (zoneId: ZoneId, ids: string[]) =>
    ids.filter((id) => solved.has(id)).length;

  const z1Done =
    synced.has('zone2') ||
    synced.has('zone3') ||
    solved.has('z1-bypass') ||
    countInZone('zone1', ['z1-p1', 'z1-p2', 'z1-p3']) >= 2;

  const z2Done =
    synced.has('zone4') ||
    solved.has('z2-bypass') ||
    countInZone('zone2', ['z2-p1', 'z2-p2', 'z2-p3']) >= 2;

  const z3Done =
    synced.has('zone4') ||
    solved.has('z3-bypass') ||
    countInZone('zone3', ['z3-p1', 'z3-p2', 'z3-p3']) >= 2;

  const z4Done =
    synced.has('zone5') ||
    solved.has('z4-bypass') ||
    countInZone('zone4', ['z4-p1', 'z4-p2', 'z4-p3']) >= 2;

  return {
    'door-1-2': z1Done,
    'door-1-3': z1Done,
    'door-2-4': z2Done,
    'door-3-4': z3Done,
    'door-1-4': z2Done && z3Done,
    'door-4-5': z4Done,
  };
}
