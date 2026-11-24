export type TeamId = 'alpha' | 'beta';

export type ZoneId = 'zone1' | 'zone2' | 'zone3' | 'zone4' | 'zone5';

export type PuzzleInputKind = 'choice' | 'text' | 'sequence';

export type DiagramSpec =
  | {
      type: 'sequence';
      items: string[];
      highlightLast?: boolean;
    }
  | {
      type: 'shape-matrix';
      rows: Array<Array<{ shape: 'circle' | 'triangle' | 'square'; count: number; color: string; rotation?: number } | null>>;
    }
  | {
      type: 'binary-leds';
      groups: Array<{ label: string; bits: number[] }>;
      note: string;
    }
  | {
      type: 'packet-table';
      headers: string[];
      rows: Array<{ id: string; cells: string[] }>;
      ruleSummary: string;
    }
  | {
      type: 'robot-grid';
      size: number;
      start: [number, number];
      goal: [number, number];
      obstacles: Array<[number, number]>;
      startDir: 'N' | 'E' | 'S' | 'W';
    }
  | {
      type: 'network-graph';
      nodes: Array<{ id: string; x: number; y: number; required?: boolean; label?: string }>;
      edges: Array<{ from: string; to: string; weight: number }>;
    }
  | {
      type: 'code-block';
      language: string;
      lines: Array<{ num: number; code: string }>;
    }
  | {
      type: 'logic-cards';
      cards: Array<{ title: string; items: string[] }>;
    };

export interface PuzzleData {
  id: string;
  zoneId: ZoneId;
  title: string;
  category: string;
  isBypass?: boolean;
  isFinalCore?: boolean;
  description: string;
  prompt: string;
  inputKind: PuzzleInputKind;
  options?: string[];
  sequencePool?: string[];
  answer: string;
  acceptedAnswers?: string[];
  diagram?: DiagramSpec;
  hints: [string, string, string];
  explanation: string;
  rewardClueId?: string;
}

export interface ClueData {
  id: string;
  zoneId: ZoneId;
  code: string;
  title: string;
  summary: string;
  valueText: string;
}

export interface ZoneMeta {
  id: ZoneId;
  shortName: string;
  name: string;
  subtitle: string;
  accentHex: string;
  floorTintHex: string;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  center: [number, number];
}

export interface WallBox {
  id: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  height: number;
  zoneColor?: string;
  isGlass?: boolean;
}

export interface DoorConfig {
  id: string;
  label: string;
  x: number;
  z: number;
  axis: 'x' | 'z'; // 'x' means doorway runs along X-axis (north/south barrier), 'z' means along Z-axis (east/west barrier)
  width: number;
  unlockRuleText: string;
}

export interface TerminalPlacement {
  puzzleId: string;
  zoneId: ZoneId;
  x: number;
  z: number;
  rotY: number;
  kind: 'console' | 'rack' | 'pedestal' | 'scanner' | 'bypass' | 'core';
}

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  source?: 'ai' | 'fallback';
  createdAt: number;
}

export interface PlayerProgressState {
  playerId: string;
  playerName: string;
  teamId: TeamId;
  solvedPuzzleIds: string[];
  puzzleScores: Record<string, number>;
  attemptsByPuzzle: Record<string, number>;
  hintsUsedByPuzzle: Record<string, number>; // 0, 1, 2, or 3
  aiHintsByPuzzle: Record<string, string[]>;
  aiChatByPuzzle?: Record<string, AiChatMessage[]>;
  discoveredClueIds: string[];
  finalRestored: boolean;
  totalScore: number;
  remainingSeconds: number;
  playerPosition: { x: number; z: number; rotY: number };
  syncedUnlockedZones?: ZoneId[];
  updatedAt: number;
}

export interface TeamScoreboardMember {
  playerId: string;
  playerName: string;
  teamId: TeamId;
  totalScore: number;
  solvedCount: number;
  finalRestored: boolean;
  updatedAt: number;
}

export interface ScoreboardResponse {
  alphaTotal: number;
  betaTotal: number;
  members: TeamScoreboardMember[];
  teamUnlockedZones: Record<TeamId, ZoneId[]>;
}

export interface AdminAiChatEntry {
  puzzleId: string;
  role: 'user' | 'assistant';
  text: string;
  source?: 'ai' | 'fallback';
  createdAt: number;
}

export interface AdminPlayerRecord extends TeamScoreboardMember {
  unlockedZones: string[];
  solvedPuzzleIds: string[];
  puzzleScores: Record<string, number>;
  attemptsByPuzzle: Record<string, number>;
  hintsUsedByPuzzle: Record<string, number>;
  discoveredClueIds: string[];
  remainingSeconds: number;
  currentZoneId: string;
  playerPosition: { x: number; z: number };
  aiChatCount: number;
  aiChatLogs: AdminAiChatEntry[];
  firstConnectedAt: number;
  isOnline: boolean;
}

export interface AdminActivityEvent {
  id: string;
  timestamp: number;
  playerId: string;
  playerName: string;
  teamId: TeamId;
  action: 'join' | 'progress' | 'restore' | 'reset';
  detail: string;
}

export interface AdminOverviewResponse {
  generatedAt: number;
  summary: {
    totalPlayers: number;
    onlinePlayers: number;
    alphaPlayers: number;
    betaPlayers: number;
    alphaTotalScore: number;
    betaTotalScore: number;
    finalRestoredCount: number;
    avgProgressPercent: number;
    totalHintsUsed: number;
    totalAiQuestions: number;
  };
  players: AdminPlayerRecord[];
  activityLog: AdminActivityEvent[];
}

