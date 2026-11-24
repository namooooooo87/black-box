import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const PORT = Number(process.env.PORT || 3000);
const isProd = process.env.NODE_ENV === 'production';
const STATE_FILE = path.resolve(process.cwd(), '.blackbox-scoreboard.json');

interface MemberRecord {
  playerId: string;
  playerName: string;
  teamId: 'alpha' | 'beta';
  totalScore: number;
  solvedCount: number;
  finalRestored: boolean;
  unlockedZones: string[];
  updatedAt: number;
}

interface PersistedScoreboard {
  members: Record<string, MemberRecord>;
}

let store: PersistedScoreboard = { members: {} };

try {
  if (fs.existsSync(STATE_FILE)) {
    const raw = fs.readFileSync(STATE_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as PersistedScoreboard;
    if (parsed && parsed.members) {
      store = parsed;
    }
  }
} catch {
  store = { members: {} };
}

function saveStore() {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch {
    // ignore write failures on read-only environments
  }
}

function buildScoreboardPayload() {
  const list = Object.values(store.members).sort((a, b) => b.totalScore - a.totalScore);
  let alphaTotal = 0;
  let betaTotal = 0;
  const alphaZones = new Set<string>(['zone1']);
  const betaZones = new Set<string>(['zone1']);

  for (const m of list) {
    if (m.teamId === 'alpha') {
      alphaTotal += m.totalScore;
      (m.unlockedZones || []).forEach((z) => alphaZones.add(z));
    } else {
      betaTotal += m.totalScore;
      (m.unlockedZones || []).forEach((z) => betaZones.add(z));
    }
  }

  return {
    alphaTotal,
    betaTotal,
    members: list,
    teamUnlockedZones: {
      alpha: Array.from(alphaZones),
      beta: Array.from(betaZones),
    },
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
  app.use(express.json());

  app.get('/api/scoreboard', (_req, res) => {
    res.json(buildScoreboardPayload());
  });

  app.post('/api/players/sync', (req, res) => {
    const body = req.body || {};
    const playerId = typeof body.playerId === 'string' ? body.playerId.trim() : '';
    const playerName = typeof body.playerName === 'string' ? body.playerName.trim() : '';
    const teamId = body.teamId === 'beta' ? 'beta' : 'alpha';

    if (!playerId || !playerName) {
      res.status(400).json({ error: 'Invalid player data' });
      return;
    }

    store.members[playerId] = {
      playerId,
      playerName: playerName.slice(0, 20),
      teamId,
      totalScore: Math.max(0, Number(body.totalScore) || 0),
      solvedCount: Math.max(0, Number(body.solvedCount) || 0),
      finalRestored: Boolean(body.finalRestored),
      unlockedZones: Array.isArray(body.unlockedZones)
        ? body.unlockedZones.filter((z: unknown): z is string => typeof z === 'string')
        : ['zone1'],
      updatedAt: Date.now(),
    };

    saveStore();
    res.json(buildScoreboardPayload());
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
