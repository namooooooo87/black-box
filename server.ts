import crypto from 'crypto';
import dotenv from 'dotenv';
import express, { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const PORT = Number(process.env.PORT || 3000);
const isProd = process.env.NODE_ENV === 'production';
const STATE_FILE = path.resolve(process.cwd(), '.blackbox-scoreboard.json');
const ADMIN_SESSION_SECRET =
  (process.env.ADMIN_SESSION_SECRET || '').trim() || crypto.randomBytes(32).toString('hex');
const ADMIN_TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const ONLINE_WINDOW_MS = 65 * 1000;
const TOTAL_PUZZLE_COUNT = 20;

interface AdminChatEntry {
  puzzleId: string;
  role: 'user' | 'assistant';
  text: string;
  source?: 'ai' | 'fallback';
  createdAt: number;
}

interface ActivityEvent {
  id: string;
  timestamp: number;
  playerId: string;
  playerName: string;
  teamId: 'alpha' | 'beta';
  action: 'join' | 'progress' | 'restore' | 'reset';
  detail: string;
}

interface MemberRecord {
  playerId: string;
  playerName: string;
  teamId: 'alpha' | 'beta';
  totalScore: number;
  solvedCount: number;
  finalRestored: boolean;
  unlockedZones: string[];
  solvedPuzzleIds?: string[];
  puzzleScores?: Record<string, number>;
  attemptsByPuzzle?: Record<string, number>;
  hintsUsedByPuzzle?: Record<string, number>;
  discoveredClueIds?: string[];
  remainingSeconds?: number;
  currentZoneId?: string;
  playerPosition?: { x: number; z: number };
  aiChatCount?: number;
  aiChatLogs?: AdminChatEntry[];
  firstConnectedAt?: number;
  updatedAt: number;
}

interface PersistedScoreboard {
  members: Record<string, MemberRecord>;
  activityLog?: ActivityEvent[];
  adminPasswordHash?: string;
}

let store: PersistedScoreboard = { members: {}, activityLog: [] };

try {
  if (fs.existsSync(STATE_FILE)) {
    const raw = fs.readFileSync(STATE_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as PersistedScoreboard;
    if (parsed && parsed.members) {
      store = {
        members: parsed.members,
        activityLog: Array.isArray(parsed.activityLog) ? parsed.activityLog : [],
        adminPasswordHash: typeof parsed.adminPasswordHash === 'string' ? parsed.adminPasswordHash : undefined,
      };
    }
  }
} catch {
  store = { members: {}, activityLog: [] };
}

function saveStore() {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch {
    // ignore write failures on read-only environments
  }
}

function getEnvAdminPasscode(): string {
  return (process.env.ADMIN_PASSCODE || '').trim();
}

function hashAdminPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyScryptPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  if (!salt || !keyHex) return false;
  try {
    const keyBuf = Buffer.from(keyHex, 'hex');
    const derived = crypto.scryptSync(password, salt, 64);
    if (keyBuf.length !== derived.length) return false;
    return crypto.timingSafeEqual(keyBuf, derived);
  } catch {
    return false;
  }
}

function safeEqualText(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, 'utf-8');
  const bBuf = Buffer.from(b, 'utf-8');
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function createAdminToken(): string {
  const payload = Buffer.from(
    JSON.stringify({ role: 'admin', iat: Date.now(), exp: Date.now() + ADMIN_TOKEN_TTL_MS })
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', ADMIN_SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyAdminToken(token: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payloadB64, sigB64] = parts;
  if (!payloadB64 || !sigB64) return false;
  const expectedSig = crypto
    .createHmac('sha256', ADMIN_SESSION_SECRET)
    .update(payloadB64)
    .digest('base64url');
  if (!safeEqualText(sigB64, expectedSig)) return false;
  try {
    const decoded = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8')) as {
      role?: string;
      exp?: number;
    };
    return decoded.role === 'admin' && typeof decoded.exp === 'number' && decoded.exp > Date.now();
  } catch {
    return false;
  }
}

function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: '관리자 인증이 필요합니다.' });
    return;
  }
  const token = authHeader.slice(7).trim();
  if (!verifyAdminToken(token)) {
    res.status(401).json({ error: '관리자 세션이 만료되었거나 유효하지 않습니다.' });
    return;
  }
  next();
}

function sanitizeStringArray(input: unknown, maxItems = 40, maxLen = 40): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((v: unknown): v is string => typeof v === 'string' && v.trim().length > 0)
    .slice(0, maxItems)
    .map((v) => v.trim().slice(0, maxLen));
}

function sanitizeNumberMap(input: unknown, maxEntries = 40): Record<string, number> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(input).slice(0, maxEntries)) {
    if (typeof k === 'string' && k.length > 0 && k.length <= 40) {
      const num = Number(v);
      if (Number.isFinite(num) && num >= 0) {
        out[k] = Math.round(num);
      }
    }
  }
  return out;
}

function sanitizeChatLogs(input: unknown): AdminChatEntry[] {
  if (!Array.isArray(input)) return [];
  const out: AdminChatEntry[] = [];
  for (const item of input.slice(-40)) {
    if (!item || typeof item !== 'object') continue;
    const raw = item as Record<string, unknown>;
    const puzzleId = typeof raw.puzzleId === 'string' ? raw.puzzleId.slice(0, 40) : '';
    const role = raw.role === 'user' ? 'user' : raw.role === 'assistant' ? 'assistant' : null;
    const text = typeof raw.text === 'string' ? raw.text.slice(0, 500) : '';
    const source = raw.source === 'ai' ? 'ai' : raw.source === 'fallback' ? 'fallback' : undefined;
    const createdAt = Number(raw.createdAt) || Date.now();
    if (puzzleId && role && text) {
      out.push({ puzzleId, role, text, ...(source ? { source } : {}), createdAt });
    }
  }
  return out;
}

function pushActivity(event: Omit<ActivityEvent, 'id' | 'timestamp'>) {
  const list = store.activityLog || [];
  list.unshift({
    id: `evt-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`,
    timestamp: Date.now(),
    ...event,
  });
  store.activityLog = list.slice(0, 200);
}

function buildScoreboardPayload() {
  const rawList = Object.values(store.members).sort((a, b) => b.totalScore - a.totalScore);
  let alphaTotal = 0;
  let betaTotal = 0;
  const alphaZones = new Set<string>(['zone1']);
  const betaZones = new Set<string>(['zone1']);

  const members = rawList.map((m) => {
    if (m.teamId === 'alpha') {
      alphaTotal += m.totalScore;
      (m.unlockedZones || []).forEach((z) => alphaZones.add(z));
    } else {
      betaTotal += m.totalScore;
      (m.unlockedZones || []).forEach((z) => betaZones.add(z));
    }
    return {
      playerId: m.playerId,
      playerName: m.playerName,
      teamId: m.teamId,
      totalScore: m.totalScore,
      solvedCount: m.solvedCount,
      finalRestored: m.finalRestored,
      updatedAt: m.updatedAt,
    };
  });

  return {
    alphaTotal,
    betaTotal,
    members,
    teamUnlockedZones: {
      alpha: Array.from(alphaZones),
      beta: Array.from(betaZones),
    },
  };
}

function buildAdminOverviewPayload() {
  const now = Date.now();
  const list = Object.values(store.members).sort((a, b) => b.updatedAt - a.updatedAt);

  let onlinePlayers = 0;
  let alphaPlayers = 0;
  let betaPlayers = 0;
  let alphaTotalScore = 0;
  let betaTotalScore = 0;
  let finalRestoredCount = 0;
  let progressSum = 0;
  let totalHintsUsed = 0;
  let totalAiQuestions = 0;

  const players = list.map((m) => {
    const isOnline = now - m.updatedAt < ONLINE_WINDOW_MS;
    if (isOnline) onlinePlayers++;
    if (m.teamId === 'alpha') {
      alphaPlayers++;
      alphaTotalScore += m.totalScore;
    } else {
      betaPlayers++;
      betaTotalScore += m.totalScore;
    }
    if (m.finalRestored) finalRestoredCount++;

    const solvedPuzzleIds = m.solvedPuzzleIds || [];
    const hintsMap = m.hintsUsedByPuzzle || {};
    const playerHints = Object.values(hintsMap).reduce((s, n) => s + (Number(n) || 0), 0);
    totalHintsUsed += playerHints;

    const aiLogs = m.aiChatLogs || [];
    const aiChatCount =
      typeof m.aiChatCount === 'number'
        ? m.aiChatCount
        : aiLogs.filter((l) => l.role === 'user').length;
    totalAiQuestions += aiChatCount;

    const solvedCount = Math.max(m.solvedCount, solvedPuzzleIds.length);
    progressSum += Math.min(100, Math.round((solvedCount / TOTAL_PUZZLE_COUNT) * 100));

    return {
      playerId: m.playerId,
      playerName: m.playerName,
      teamId: m.teamId,
      totalScore: m.totalScore,
      solvedCount,
      finalRestored: m.finalRestored,
      updatedAt: m.updatedAt,
      unlockedZones: m.unlockedZones || ['zone1'],
      solvedPuzzleIds,
      puzzleScores: m.puzzleScores || {},
      attemptsByPuzzle: m.attemptsByPuzzle || {},
      hintsUsedByPuzzle: hintsMap,
      discoveredClueIds: m.discoveredClueIds || [],
      remainingSeconds: typeof m.remainingSeconds === 'number' ? m.remainingSeconds : 45 * 60,
      currentZoneId: m.currentZoneId || 'zone1',
      playerPosition: m.playerPosition || { x: 0, z: 22 },
      aiChatCount,
      aiChatLogs: aiLogs,
      firstConnectedAt: m.firstConnectedAt || m.updatedAt,
      isOnline,
    };
  });

  return {
    generatedAt: now,
    summary: {
      totalPlayers: players.length,
      onlinePlayers,
      alphaPlayers,
      betaPlayers,
      alphaTotalScore,
      betaTotalScore,
      finalRestoredCount,
      avgProgressPercent: players.length > 0 ? Math.round(progressSum / players.length) : 0,
      totalHintsUsed,
      totalAiQuestions,
    },
    players,
    activityLog: store.activityLog || [],
  };
}

const aiClient = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '256kb' }));

  app.get('/api/scoreboard', (_req, res) => {
    res.json(buildScoreboardPayload());
  });

  app.post('/api/players/sync', (req, res) => {
    const body = req.body || {};
    const playerId = typeof body.playerId === 'string' ? body.playerId.trim().slice(0, 64) : '';
    const playerName = typeof body.playerName === 'string' ? body.playerName.trim().slice(0, 20) : '';
    const teamId = body.teamId === 'beta' ? 'beta' : 'alpha';

    if (!playerId || !playerName) {
      res.status(400).json({ error: 'Invalid player data' });
      return;
    }

    const prev = store.members[playerId];
    const now = Date.now();
    const solvedPuzzleIds = sanitizeStringArray(body.solvedPuzzleIds, 30, 32);
    const solvedCount = Math.max(0, Number(body.solvedCount) || solvedPuzzleIds.length);
    const totalScore = Math.max(0, Number(body.totalScore) || 0);
    const finalRestored = Boolean(body.finalRestored);
    const unlockedZones = sanitizeStringArray(body.unlockedZones, 10, 20);
    const puzzleScores = sanitizeNumberMap(body.puzzleScores, 30);
    const attemptsByPuzzle = sanitizeNumberMap(body.attemptsByPuzzle, 30);
    const hintsUsedByPuzzle = sanitizeNumberMap(body.hintsUsedByPuzzle, 30);
    const discoveredClueIds = sanitizeStringArray(body.discoveredClueIds, 20, 32);
    const remainingSeconds = Math.max(0, Math.min(7200, Number(body.remainingSeconds) || 0));
    const currentZoneId =
      typeof body.currentZoneId === 'string' ? body.currentZoneId.slice(0, 20) : 'zone1';
    const rawPos = body.playerPosition as Record<string, unknown> | undefined;
    const playerPosition =
      rawPos && typeof rawPos === 'object'
        ? {
            x: Number.isFinite(Number(rawPos.x)) ? Number(Number(rawPos.x).toFixed(2)) : 0,
            z: Number.isFinite(Number(rawPos.z)) ? Number(Number(rawPos.z).toFixed(2)) : 22,
          }
        : prev?.playerPosition || { x: 0, z: 22 };
    const aiChatLogs = sanitizeChatLogs(body.aiChatLogs);
    const aiChatCount =
      typeof body.aiChatCount === 'number'
        ? Math.max(0, Math.round(body.aiChatCount))
        : aiChatLogs.filter((l) => l.role === 'user').length;

    // Track significant activity transitions for the Admin dashboard
    if (!prev) {
      pushActivity({
        playerId,
        playerName,
        teamId,
        action: 'join',
        detail: `${teamId === 'alpha' ? '알파 팀' : '베타 팀'}으로 연구소 접속`,
      });
    } else {
      if (!prev.finalRestored && finalRestored) {
        pushActivity({
          playerId,
          playerName,
          teamId,
          action: 'restore',
          detail: `최종 시스템 복구 완료 (${totalScore}점)`,
        });
      } else if (solvedCount > prev.solvedCount) {
        const newlySolved = solvedPuzzleIds.filter((id) => !(prev.solvedPuzzleIds || []).includes(id));
        pushActivity({
          playerId,
          playerName,
          teamId,
          action: 'progress',
          detail:
            newlySolved.length > 0
              ? `문제 해결 (${newlySolved.join(', ')}) · 누적 ${totalScore}점`
              : `해결 문제 ${solvedCount}개 달성 · 누적 ${totalScore}점`,
        });
      } else if (prev.solvedCount > 0 && solvedCount === 0 && totalScore === 0) {
        pushActivity({
          playerId,
          playerName,
          teamId,
          action: 'reset',
          detail: '처음부터 다시 시작 (진행 초기화)',
        });
      }
    }

    store.members[playerId] = {
      playerId,
      playerName,
      teamId,
      totalScore,
      solvedCount,
      finalRestored,
      unlockedZones: unlockedZones.length > 0 ? unlockedZones : ['zone1'],
      solvedPuzzleIds,
      puzzleScores,
      attemptsByPuzzle,
      hintsUsedByPuzzle,
      discoveredClueIds,
      remainingSeconds,
      currentZoneId,
      playerPosition,
      aiChatCount,
      aiChatLogs,
      firstConnectedAt: prev?.firstConnectedAt || now,
      updatedAt: now,
    };

    saveStore();
    res.json(buildScoreboardPayload());
  });

  // Admin Authentication & Monitoring Routes
  app.get('/api/admin/status', (_req, res) => {
    const envConfigured = Boolean(getEnvAdminPasscode());
    const needsSetup = !envConfigured && !store.adminPasswordHash;
    res.json({ needsSetup, envConfigured });
  });

  app.post('/api/admin/setup', (req, res) => {
    const envConfigured = Boolean(getEnvAdminPasscode());
    if (envConfigured || store.adminPasswordHash) {
      res.status(409).json({ error: '관리자 비밀번호가 이미 설정되어 있습니다.' });
      return;
    }
    const passcode = typeof req.body?.passcode === 'string' ? req.body.passcode.trim() : '';
    if (passcode.length < 4 || passcode.length > 64) {
      res.status(400).json({ error: '비밀번호는 4자 이상 64자 이하로 설정해 주세요.' });
      return;
    }
    store.adminPasswordHash = hashAdminPassword(passcode);
    saveStore();
    res.json({ token: createAdminToken() });
  });

  app.post('/api/admin/login', (req, res) => {
    const passcode = typeof req.body?.passcode === 'string' ? req.body.passcode.trim() : '';
    if (!passcode) {
      res.status(400).json({ error: '관리자 비밀번호를 입력해 주세요.' });
      return;
    }
    const envPasscode = getEnvAdminPasscode();
    let valid = false;
    if (envPasscode) {
      valid = safeEqualText(passcode, envPasscode);
    } else if (store.adminPasswordHash) {
      valid = verifyScryptPassword(passcode, store.adminPasswordHash);
    } else {
      res.status(409).json({ error: '최초 관리자 비밀번호 설정이 필요합니다.' });
      return;
    }

    if (!valid) {
      res.status(401).json({ error: '비밀번호가 일치하지 않습니다.' });
      return;
    }
    res.json({ token: createAdminToken() });
  });

  app.get('/api/admin/overview', requireAdminAuth, (_req, res) => {
    res.json(buildAdminOverviewPayload());
  });

  app.delete('/api/admin/players/:playerId', requireAdminAuth, (req, res) => {
    const rawId = typeof req.params.playerId === 'string' ? req.params.playerId.trim() : '';
    if (!rawId || !store.members[rawId]) {
      res.status(404).json({ error: '해당 학생 데이터를 찾을 수 없습니다.' });
      return;
    }
    delete store.members[rawId];
    saveStore();
    res.json(buildAdminOverviewPayload());
  });

  app.post('/api/admin/reset-all', requireAdminAuth, (_req, res) => {
    store.members = {};
    store.activityLog = [];
    saveStore();
    res.json(buildAdminOverviewPayload());
  });

  async function generateTextWithFallback(params: {
    route: string;
    contents: string;
    systemInstruction: string;
    fallbackText: string;
  }): Promise<{ text: string; source: 'ai' | 'fallback'; fallbackReason?: string }> {
    if (!aiClient) {
      return { text: params.fallbackText, source: 'fallback', fallbackReason: 'API_KEY_NOT_CONFIGURED' };
    }

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await aiClient.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: params.contents,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            systemInstruction: params.systemInstruction,
          },
        });
        const text = response.text?.trim();
        if (text) {
          return { text, source: 'ai' };
        }
        return { text: params.fallbackText, source: 'fallback', fallbackReason: 'EMPTY_RESPONSE' };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[${params.route}] Gemini attempt ${attempt + 1} failed:`, msg);
        if (attempt === 0) {
          await new Promise((r) => setTimeout(r, 700));
        }
      }
    }

    return { text: params.fallbackText, source: 'fallback', fallbackReason: 'UPSTREAM_ERROR' };
  }

  app.post('/api/hint', async (req, res) => {
    const body = req.body || {};
    const title = typeof body.title === 'string' ? body.title.slice(0, 120) : '';
    const category = typeof body.category === 'string' ? body.category.slice(0, 80) : '';
    const description = typeof body.description === 'string' ? body.description.slice(0, 400) : '';
    const prompt = typeof body.prompt === 'string' ? body.prompt.slice(0, 800) : '';
    const diagramSummary = typeof body.diagramSummary === 'string' ? body.diagramSummary.slice(0, 1200) : '';
    const tier = Math.min(3, Math.max(1, Number(body.tier) || 1));
    const fallbackHint =
      typeof body.fallbackHint === 'string' && body.fallbackHint.trim()
        ? body.fallbackHint.trim()
        : '문제의 규칙과 조건을 단계별로 나누어 살펴보세요.';

    if (!prompt) {
      res.json({ hintText: fallbackHint, source: 'fallback', fallbackReason: 'MISSING_PROMPT' });
      return;
    }

    const tierGuide =
      tier === 1
        ? 'HINT 1 (방향 제시): 정답이나 구체적 수치는 말하지 말고, 문제를 어떤 관점으로 바라보아야 하는지 1~2문장으로 방향만 제시하세요.'
        : tier === 2
        ? 'HINT 2 (핵심 규칙·단서): 정답은 직접 말하지 말고, 문제에 숨어 있는 핵심 규칙이나 중요 단서(비교 조건, 패턴 구조 등)를 2~3문장으로 구체화하세요.'
        : 'HINT 3 (구체적 풀이 안내): 중학생이 스스로 풀이를 마무리할 수 있도록 풀이 절차와 사고 과정을 단계별로 구체적으로 안내하세요. 단, 정답 자체를 임의로 바꾸거나 채점을 판정하지는 마세요.';

    const result = await generateTextWithFallback({
      route: 'api/hint',
      contents: [
        `문제 제목: ${title}`,
        `분류: ${category}`,
        description ? `배경: ${description}` : '',
        `문제 내용: ${prompt}`,
        diagramSummary ? `참고 자료:\n${diagramSummary}` : '',
        `검증된 기본 힌트 참고: ${fallbackHint}`,
        `요청 단계: ${tierGuide}`,
      ]
        .filter(Boolean)
        .join('\n\n'),
      systemInstruction:
        '당신은 중학생 대상 컴퓨팅 사고력 추리 게임 BLACK BOX의 친절한 AI 튜터입니다. 한국어로 명확하고 격려하는 말투로 힌트를 제공하세요. 절대 문제의 정답을 변경하거나 채점 판정을 내리지 마세요.',
      fallbackText: fallbackHint,
    });

    res.json({
      hintText: result.text,
      source: result.source,
      ...(result.fallbackReason ? { fallbackReason: result.fallbackReason } : {}),
    });
  });

  app.post('/api/ai-guide', async (req, res) => {
    const body = req.body || {};
    const title = typeof body.title === 'string' ? body.title.slice(0, 120) : '';
    const category = typeof body.category === 'string' ? body.category.slice(0, 80) : '';
    const description = typeof body.description === 'string' ? body.description.slice(0, 400) : '';
    const prompt = typeof body.prompt === 'string' ? body.prompt.slice(0, 800) : '';
    const diagramSummary = typeof body.diagramSummary === 'string' ? body.diagramSummary.slice(0, 1200) : '';
    const question = typeof body.question === 'string' ? body.question.trim().slice(0, 400) : '';
    const hintsUsed = Math.min(3, Math.max(0, Number(body.hintsUsed) || 0));

    const fallbackHints = Array.isArray(body.fallbackHints)
      ? body.fallbackHints.filter((h: unknown): h is string => typeof h === 'string' && h.trim().length > 0)
      : [];
    const safeIdx = hintsUsed <= 0 ? 0 : Math.min(hintsUsed - 1, Math.max(0, fallbackHints.length - 1));
    const chosenHint =
      fallbackHints[safeIdx] || '문제의 조건과 규칙을 작은 단계로 나누어 하나씩 확인해 보세요.';
    const fallbackReply = `[저장된 기본 힌트 ${safeIdx + 1}단계 기반 안내]\n\n${chosenHint}\n\n이 단서를 바탕으로 첫 번째 조건부터 직접 확인해 볼까요?`;

    if (!question) {
      res.status(400).json({ error: '질문 내용을 입력해 주세요.' });
      return;
    }

    if (!prompt) {
      res.json({ reply: fallbackReply, source: 'fallback', fallbackReason: 'MISSING_PROMPT' });
      return;
    }

    const rawHistory: unknown[] = Array.isArray(body.history) ? body.history.slice(-6) : [];
    const historyText = rawHistory
      .filter(
        (m: unknown): m is { role: 'user' | 'assistant'; text: string } =>
          Boolean(m) &&
          typeof (m as { text?: unknown }).text === 'string' &&
          ((m as { role?: unknown }).role === 'user' || (m as { role?: unknown }).role === 'assistant')
      )
      .map((m: { role: 'user' | 'assistant'; text: string }) => `${m.role === 'user' ? '학생' : 'AI 안내자'}: ${m.text.slice(0, 300)}`)
      .join('\n');

    const result = await generateTextWithFallback({
      route: 'api/ai-guide',
      contents: [
        `[현재 문제 정보]`,
        `제목: ${title} (${category})`,
        description ? `설명: ${description}` : '',
        `문제: ${prompt}`,
        diagramSummary ? `자료:\n${diagramSummary}` : '',
        `현재까지 공개된 기본 힌트 수: ${hintsUsed}단계`,
        `참고용 1단계 방향 힌트: ${fallbackHints[0] || chosenHint}`,
        historyText ? `[이전 대화]\n${historyText}` : '',
        `[학생 질문]\n${question}`,
      ]
        .filter(Boolean)
        .join('\n\n'),
      systemInstruction: [
        '당신은 중학생을 위한 컴퓨팅 사고력 추리 게임 BLACK BOX의 소크라테스식 AI 안내자입니다.',
        '규칙 1: 학생이 정답을 직접 요구하더라도 최종 정답이나 선택지 번호를 절대 직접 알려주지 마세요.',
        '규칙 2: 대신 문제의 원리나 접근 방법을 2~4문장 이내로 쉽게 설명하고, 학생이 스스로 다음 단계를 생각해 볼 수 있는 질문을 1개 던지세요.',
        '규칙 3: 문제의 정답, 보기, 점수, 채점 결과를 절대 임의로 수정하거나 확정 판정하지 마세요.',
        '규칙 4: 항상 친절하고 격려하는 한국어 존댓말을 사용하세요.',
      ].join('\n'),
      fallbackText: fallbackReply,
    });

    res.json({
      reply: result.text,
      source: result.source,
      ...(result.fallbackReason ? { fallbackReason: result.fallbackReason } : {}),
    });
  });

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BLACK BOX server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
