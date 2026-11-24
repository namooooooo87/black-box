import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ClueNotebookModal } from './components/ClueNotebookModal';
import { HudOverlay } from './components/HudOverlay';
import { LabViewport } from './components/LabViewport';
import { ProblemModal } from './components/ProblemModal';
import { ScoreboardModal } from './components/ScoreboardModal';
import { TutorialModal } from './components/TutorialModal';
import { TerminalInspectModal } from './components/TerminalInspectModal';
import { VictoryModal } from './components/VictoryModal';
import { computeUnlockedDoors, DOORS, TERMINALS, ZONES } from './data/labLayout';
import { CLUES, PUZZLES } from './data/puzzles';
import {
  AiChatMessage,
  ClueData,
  PlayerProgressState,
  ScoreboardResponse,
  TeamId,
  ZoneId,
  ZoneMeta,
} from './types/game';
import { calculatePuzzleScore, gradePuzzleAnswer } from './utils/grading';
import { buildFallbackGuideReply, formatDiagramSummary } from './utils/hintContext';
import { soundFX } from './utils/sound';

const ACTIVE_PLAYER_KEY = 'blackbox_active_player_v1';
const PROFILES_KEY = 'blackbox_profiles_v1';
const DEFAULT_DURATION_SECONDS = 45 * 60; // 45분 목표 플레이 시간
const PHASE_1_EXPLORATION_ONLY = false;
const FREE_ZONE_ACCESS = true;

function createFreshProfile(
  playerName: string,
  teamId: TeamId,
  syncedZones: ZoneId[] = []
): PlayerProgressState {
  const slug = `${teamId}-${playerName.trim().toLowerCase().replace(/[^a-z0-9가-힣]/g, '') || 'explorer'}-${Date.now().toString(36).slice(-4)}`;
  return {
    playerId: slug,
    playerName: playerName.trim() || '탐험가',
    teamId,
    solvedPuzzleIds: [],
    puzzleScores: {},
    attemptsByPuzzle: {},
    hintsUsedByPuzzle: {},
    aiHintsByPuzzle: {},
    aiChatByPuzzle: {},
    discoveredClueIds: [],
    finalRestored: false,
    totalScore: 0,
    remainingSeconds: DEFAULT_DURATION_SECONDS,
    playerPosition: { x: 0, z: 22, rotY: Math.PI },
    syncedUnlockedZones: syncedZones,
    updatedAt: Date.now(),
  };
}

function loadInitialProfile(): { profile: PlayerProgressState | null; profiles: Record<string, PlayerProgressState> } {
  try {
    const rawProfiles = localStorage.getItem(PROFILES_KEY);
    const profiles: Record<string, PlayerProgressState> = rawProfiles ? JSON.parse(rawProfiles) : {};
    const activeId = localStorage.getItem(ACTIVE_PLAYER_KEY);
    if (activeId && profiles[activeId]) {
      return { profile: profiles[activeId], profiles };
    }
    return { profile: null, profiles };
  } catch {
    return { profile: null, profiles: {} };
  }
}

export default function App() {
  const initial = useMemo(() => loadInitialProfile(), []);
  const [player, setPlayer] = useState<PlayerProgressState | null>(initial.profile);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(!initial.profile);
  const [showTutorialHelp, setShowTutorialHelp] = useState<boolean>(false);
  const [activePuzzleId, setActivePuzzleId] = useState<string | null>(null);
  const [inspectedTerminalId, setInspectedTerminalId] = useState<string | null>(null);
  const [showCluesModal, setShowCluesModal] = useState<boolean>(false);
  const [showScoreboard, setShowScoreboard] = useState<boolean>(false);
  const [showVictory, setShowVictory] = useState<boolean>(false);
  const [hudCollapsed, setHudCollapsed] = useState<boolean>(false);
  const [muted, setMuted] = useState<boolean>(false);
  const [cameraResetSignal, setCameraResetSignal] = useState<number>(0);
  const [runEpoch, setRunEpoch] = useState<number>(0);
  const [currentZone, setCurrentZone] = useState<ZoneMeta>(ZONES[0]);
  const [toastBanner, setToastBanner] = useState<string | null>(null);

  const [scoreboard, setScoreboard] = useState<ScoreboardResponse>({
    alphaTotal: 0,
    betaTotal: 0,
    members: [],
    teamUnlockedZones: { alpha: [], beta: [] },
  });

  const toastTimerRef = useRef<number | null>(null);
  const showToast = useCallback((msg: string) => {
    setToastBanner(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToastBanner(null), 4200);
  }, []);

  // Save active player to localStorage whenever state updates
  useEffect(() => {
    if (!player) return;
    try {
      const rawProfiles = localStorage.getItem(PROFILES_KEY);
      const profiles: Record<string, PlayerProgressState> = rawProfiles ? JSON.parse(rawProfiles) : {};
      profiles[player.playerId] = player;
      localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
      localStorage.setItem(ACTIVE_PLAYER_KEY, player.playerId);
    } catch {
      // ignore storage quota errors
    }
  }, [player]);

  const fetchScoreboard = useCallback(async () => {
    try {
      const res = await fetch('/api/scoreboard');
      if (res.ok) {
        const data: ScoreboardResponse = await res.json();
        setScoreboard(data);
      }
    } catch {
      // offline/fallback quietly ignored
    }
  }, []);

  const syncPlayerToServer = useCallback(async (p: PlayerProgressState) => {
    try {
      const unlockedDoors = computeUnlockedDoors(p.solvedPuzzleIds, p.syncedUnlockedZones);
      const unlockedZones: ZoneId[] = ['zone1'];
      if (unlockedDoors['door-1-2']) unlockedZones.push('zone2');
      if (unlockedDoors['door-1-3']) unlockedZones.push('zone3');
      if (unlockedDoors['door-2-4'] || unlockedDoors['door-3-4'] || unlockedDoors['door-1-4']) {
        unlockedZones.push('zone4');
      }
      if (unlockedDoors['door-4-5']) unlockedZones.push('zone5');

      const res = await fetch('/api/players/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: p.playerId,
          playerName: p.playerName,
          teamId: p.teamId,
          totalScore: p.totalScore,
          solvedCount: p.solvedPuzzleIds.length,
          finalRestored: p.finalRestored,
          unlockedZones,
        }),
      });
      if (res.ok) {
        const data: ScoreboardResponse = await res.json();
        setScoreboard(data);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchScoreboard();
    const interval = window.setInterval(fetchScoreboard, 12000);
    return () => window.clearInterval(interval);
  }, [fetchScoreboard]);

  useEffect(() => {
    if (player) {
      syncPlayerToServer(player);
    }
  }, [player?.playerId, player?.totalScore, player?.solvedPuzzleIds.length, player?.finalRestored, syncPlayerToServer]);

  // Countdown timer (ticks when playing)
  useEffect(() => {
    if (!player || showOnboarding) return;
    const timer = window.setInterval(() => {
      setPlayer((prev) => {
        if (!prev || prev.remainingSeconds <= 0 || prev.finalRestored) return prev;
        return { ...prev, remainingSeconds: prev.remainingSeconds - 1 };
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [!!player, showOnboarding]);

  // Keyboard shortcut H to toggle bottom dock, Escape to close active modals
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.code === 'KeyH' &&
        !activePuzzleId &&
        !inspectedTerminalId &&
        !showOnboarding &&
        !showScoreboard &&
        !showCluesModal
      ) {
        setHudCollapsed((v) => !v);
      }
      if (e.code === 'Escape') {
        if (inspectedTerminalId) setInspectedTerminalId(null);
        else if (activePuzzleId) setActivePuzzleId(null);
        else if (showVictory) setShowVictory(false);
        else if (showCluesModal) setShowCluesModal(false);
        else if (showScoreboard) setShowScoreboard(false);
        else if (showTutorialHelp) setShowTutorialHelp(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activePuzzleId, inspectedTerminalId, showOnboarding, showVictory, showScoreboard, showCluesModal, showTutorialHelp]);

  const unlockedDoors = useMemo(() => {
    if (!player) return computeUnlockedDoors([]);
    return computeUnlockedDoors(player.solvedPuzzleIds, player.syncedUnlockedZones);
  }, [player?.solvedPuzzleIds, player?.syncedUnlockedZones]);

  const handleStartGame = (
    playerName: string,
    teamId: TeamId,
    joinMode: 'fresh' | 'sync-team'
  ) => {
    const syncedZones =
      joinMode === 'sync-team' ? scoreboard.teamUnlockedZones[teamId] || [] : [];
    const fresh = createFreshProfile(playerName, teamId, syncedZones);
    setPlayer(fresh);
    setShowOnboarding(false);
    setShowScoreboard(false);
    setActivePuzzleId(null);
    soundFX.playInteract();
    if (!PHASE_1_EXPLORATION_ONLY) {
      syncPlayerToServer(fresh);
    }
    if (PHASE_1_EXPLORATION_ONLY) {
      showToast('중앙 통제실(ZONE 1)에 도착했습니다! WASD·방향키로 이동하고 마우스 드래그로 둘러보세요.');
    } else if (syncedZones.length > 1) {
      showToast(`${teamId === 'alpha' ? '알파' : '베타'} 팀의 열린 구역 상태와 동기화되어 시작합니다!`);
    } else {
      showToast('중앙 통제실(ZONE 1)에서 탐험을 시작하세요! 단말기 근처에서 E 키를 누르세요.');
    }
  };

  const handlePositionUpdate = useCallback((pos: { x: number; z: number; rotY: number }) => {
    setPlayer((prev) => {
      if (!prev) return prev;
      return { ...prev, playerPosition: pos, updatedAt: Date.now() };
    });
  }, []);

  const handleInteractPuzzle = useCallback((puzzleId: string) => {
    soundFX.playInteract();
    if (PHASE_1_EXPLORATION_ONLY) {
      setInspectedTerminalId(puzzleId);
      return;
    }
    setActivePuzzleId(puzzleId);
  }, []);

  const handleRequestHint = useCallback(
    async (puzzleId: string, tier: 1 | 2 | 3) => {
      const puzzle = PUZZLES.find((p) => p.id === puzzleId);
      if (!puzzle) return;

      const fallbackText = puzzle.hints[tier - 1];
      let finalHint = fallbackText;

      try {
        const res = await fetch('/api/hint', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            puzzleId: puzzle.id,
            title: puzzle.title,
            category: puzzle.category,
            description: puzzle.description,
            prompt: puzzle.prompt,
            diagramSummary: formatDiagramSummary(puzzle.diagram),
            tier,
            fallbackHint: fallbackText,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.hintText && typeof data.hintText === 'string') {
            finalHint = data.hintText;
          }
        }
      } catch {
        finalHint = fallbackText;
      }

      setPlayer((prev) => {
        if (!prev) return prev;
        const currentTier = prev.hintsUsedByPuzzle[puzzleId] ?? 0;
        const nextTier = Math.max(currentTier, tier);
        const existingArr = [...(prev.aiHintsByPuzzle[puzzleId] || [])];
        existingArr[tier - 1] = finalHint;
        return {
          ...prev,
          hintsUsedByPuzzle: { ...prev.hintsUsedByPuzzle, [puzzleId]: nextTier },
          aiHintsByPuzzle: { ...prev.aiHintsByPuzzle, [puzzleId]: existingArr },
          updatedAt: Date.now(),
        };
      });
    },
    []
  );

  const handleSendAiChat = useCallback(
    async (puzzleId: string, question: string) => {
      const puzzle = PUZZLES.find((p) => p.id === puzzleId);
      const trimmed = question.trim();
      if (!puzzle || !trimmed) return;

      const userMsg: AiChatMessage = {
        id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        role: 'user',
        text: trimmed,
        createdAt: Date.now(),
      };

      let historySnapshot: AiChatMessage[] = [];
      let hintsUsedSnapshot = 0;

      setPlayer((prev) => {
        if (!prev) return prev;
        const prevList = prev.aiChatByPuzzle?.[puzzleId] || [];
        historySnapshot = prevList.slice(-6);
        hintsUsedSnapshot = prev.hintsUsedByPuzzle[puzzleId] ?? 0;
        return {
          ...prev,
          aiChatByPuzzle: {
            ...(prev.aiChatByPuzzle || {}),
            [puzzleId]: [...prevList, userMsg],
          },
          updatedAt: Date.now(),
        };
      });

      let replyText = buildFallbackGuideReply(puzzle.hints, hintsUsedSnapshot);
      let replySource: 'ai' | 'fallback' = 'fallback';

      try {
        const res = await fetch('/api/ai-guide', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            puzzleId: puzzle.id,
            title: puzzle.title,
            category: puzzle.category,
            description: puzzle.description,
            prompt: puzzle.prompt,
            diagramSummary: formatDiagramSummary(puzzle.diagram),
            question: trimmed,
            history: historySnapshot.map((m) => ({ role: m.role, text: m.text })),
            fallbackHints: puzzle.hints,
            hintsUsed: hintsUsedSnapshot,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.reply && typeof data.reply === 'string') {
            replyText = data.reply;
            replySource = data.source === 'ai' ? 'ai' : 'fallback';
          }
        }
      } catch {
        replyText = buildFallbackGuideReply(puzzle.hints, hintsUsedSnapshot);
        replySource = 'fallback';
      }

      const aiMsg: AiChatMessage = {
        id: `a-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        role: 'assistant',
        text: replyText,
        source: replySource,
        createdAt: Date.now(),
      };

      setPlayer((prev) => {
        if (!prev) return prev;
        const prevList = prev.aiChatByPuzzle?.[puzzleId] || [];
        return {
          ...prev,
          aiChatByPuzzle: {
            ...(prev.aiChatByPuzzle || {}),
            [puzzleId]: [...prevList, aiMsg],
          },
          updatedAt: Date.now(),
        };
      });
    },
    []
  );

  const handleSubmitAnswer = useCallback(
    (puzzleId: string, userAnswer: string) => {
      const puzzle = PUZZLES.find((p) => p.id === puzzleId);
      if (!puzzle || !player) {
        return { correct: false, awardedPoints: 0, unlockedDoorLabels: [] };
      }

      const grade = gradePuzzleAnswer(puzzle, userAnswer);
      const isCorrect = grade.correct;

      const prevAttempts = player.attemptsByPuzzle[puzzleId] ?? 0;
      const nextAttempts = prevAttempts + 1;

      if (!isCorrect) {
        setPlayer((prev) =>
          prev
            ? {
                ...prev,
                attemptsByPuzzle: { ...prev.attemptsByPuzzle, [puzzleId]: nextAttempts },
              }
            : prev
        );
        return { correct: false, awardedPoints: 0, unlockedDoorLabels: [] };
      }

      // Already solved guard
      if (player.solvedPuzzleIds.includes(puzzleId)) {
        return {
          correct: true,
          awardedPoints: 0,
          unlockedDoorLabels: [],
        };
      }

      // Deterministic score calculation
      const hintsUsed = player.hintsUsedByPuzzle[puzzleId] ?? 0;
      const awardedPoints = calculatePuzzleScore({
        hintsUsed,
        prevAttempts,
        isFinalCore: puzzle.isFinalCore,
      });

      const nextSolved = [...player.solvedPuzzleIds, puzzleId];
      const prevDoors = computeUnlockedDoors(player.solvedPuzzleIds, player.syncedUnlockedZones);
      const nextDoors = computeUnlockedDoors(nextSolved, player.syncedUnlockedZones);

      const newlyOpenedLabels = DOORS.filter(
        (d) => !prevDoors[d.id] && nextDoors[d.id]
      ).map((d) => d.label);

      let newClue: ClueData | undefined;
      const nextClues = [...player.discoveredClueIds];
      if (puzzle.rewardClueId && !nextClues.includes(puzzle.rewardClueId)) {
        nextClues.push(puzzle.rewardClueId);
        newClue = CLUES.find((c) => c.id === puzzle.rewardClueId);
      }

      const nextScore = Math.max(0, player.totalScore + awardedPoints);
      const nextFinal = player.finalRestored || Boolean(puzzle.isFinalCore);

      setPlayer((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          solvedPuzzleIds: nextSolved,
          puzzleScores: { ...prev.puzzleScores, [puzzleId]: awardedPoints },
          attemptsByPuzzle: { ...prev.attemptsByPuzzle, [puzzleId]: nextAttempts },
          discoveredClueIds: nextClues,
          finalRestored: nextFinal,
          totalScore: nextScore,
          updatedAt: Date.now(),
        };
      });

      if (!FREE_ZONE_ACCESS && newlyOpenedLabels.length > 0) {
        showToast(`보안 문 개방: ${newlyOpenedLabels.join(', ')}`);
      }
      if (puzzle.isFinalCore) {
        window.setTimeout(() => {
          setActivePuzzleId(null);
          setShowVictory(true);
        }, 1800);
      }

      return {
        correct: true,
        awardedPoints,
        unlockedDoorLabels: FREE_ZONE_ACCESS ? [] : newlyOpenedLabels,
        newClue,
      };
    },
    [player, showToast]
  );

  const handleRestartGame = () => {
    if (!player) return;
    const resetProfile: PlayerProgressState = {
      ...player,
      solvedPuzzleIds: [],
      puzzleScores: {},
      attemptsByPuzzle: {},
      hintsUsedByPuzzle: {},
      aiHintsByPuzzle: {},
      aiChatByPuzzle: {},
      discoveredClueIds: [],
      finalRestored: false,
      totalScore: 0,
      remainingSeconds: DEFAULT_DURATION_SECONDS,
      playerPosition: { x: 0, z: 22, rotY: Math.PI },
      syncedUnlockedZones: [],
      updatedAt: Date.now(),
    };
    setPlayer(resetProfile);
    setRunEpoch((e) => e + 1);
    setShowVictory(false);
    setShowTutorialHelp(false);
    setShowCluesModal(false);
    setShowScoreboard(false);
    setActivePuzzleId(null);
    setCurrentZone(ZONES[0]);
    syncPlayerToServer(resetProfile);
    soundFX.playInteract();
    showToast('진행 기록을 초기화하고 처음부터 다시 시작합니다!');
  };

  const handleOpenNewProfile = () => {
    setShowTutorialHelp(false);
    setShowVictory(false);
    setShowOnboarding(true);
  };

  const activePuzzle = useMemo(
    () => PUZZLES.find((p) => p.id === activePuzzleId) || null,
    [activePuzzleId]
  );

  const inputPaused =
    showOnboarding ||
    showTutorialHelp ||
    Boolean(activePuzzle) ||
    Boolean(inspectedTerminalId) ||
    showCluesModal ||
    showScoreboard ||
    showVictory;

  const hasTeamProgress: Record<TeamId, boolean> = {
    alpha: (scoreboard.teamUnlockedZones.alpha?.length ?? 0) > 1,
    beta: (scoreboard.teamUnlockedZones.beta?.length ?? 0) > 1,
  };

  const totalHintsUsed = useMemo(() => {
    if (!player) return 0;
    return Object.values(player.hintsUsedByPuzzle).reduce((acc, n) => acc + (Number(n) || 0), 0);
  }, [player]);

  const effectiveScoreboard: ScoreboardResponse = useMemo(() => {
    if (!player) return scoreboard;
    const exists = scoreboard.members.some((m) => m.playerId === player.playerId);
    if (exists) return scoreboard;
    const selfMember = {
      playerId: player.playerId,
      playerName: player.playerName,
      teamId: player.teamId,
      totalScore: player.totalScore,
      solvedCount: player.solvedPuzzleIds.length,
      finalRestored: player.finalRestored,
      updatedAt: player.updatedAt,
    };
    return {
      ...scoreboard,
      alphaTotal: scoreboard.alphaTotal + (player.teamId === 'alpha' ? player.totalScore : 0),
      betaTotal: scoreboard.betaTotal + (player.teamId === 'beta' ? player.totalScore : 0),
      members: [selfMember, ...scoreboard.members],
    };
  }, [scoreboard, player]);

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden">
      {/* 3D World Viewport */}
      <LabViewport
        key={`${player?.playerId || 'guest'}-${runEpoch}`}
        initialPosition={player?.playerPosition || { x: 0, z: 22, rotY: Math.PI }}
        teamId={player?.teamId || 'alpha'}
        solvedPuzzleIds={player?.solvedPuzzleIds || []}
        unlockedDoors={unlockedDoors}
        inputPaused={inputPaused}
        cameraResetSignal={cameraResetSignal}
        explorationOnly={PHASE_1_EXPLORATION_ONLY}
        autoOpenDoors={FREE_ZONE_ACCESS}
        onZoneChange={setCurrentZone}
        onPositionUpdate={handlePositionUpdate}
        onInteractPuzzle={handleInteractPuzzle}
      />

      {/* Main HUD */}
      {(player || PHASE_1_EXPLORATION_ONLY) && (
        <HudOverlay
          playerName={player?.playerName || '탐험가'}
          teamId={player?.teamId || 'alpha'}
          currentZone={currentZone}
          totalScore={player?.totalScore || 0}
          solvedCount={player?.solvedPuzzleIds.length || 0}
          clueCount={player?.discoveredClueIds.length || 0}
          remainingSeconds={player?.remainingSeconds || DEFAULT_DURATION_SECONDS}
          alphaScore={scoreboard.alphaTotal}
          betaScore={scoreboard.betaTotal}
          hudCollapsed={hudCollapsed}
          muted={muted}
          explorationOnly={PHASE_1_EXPLORATION_ONLY}
          finalRestored={Boolean(player?.finalRestored)}
          onToggleHud={() => setHudCollapsed((v) => !v)}
          onToggleMute={() => {
            soundFX.muted = !muted;
            setMuted(!muted);
          }}
          onResetCamera={() => setCameraResetSignal((s) => s + 1)}
          onOpenClues={() => setShowCluesModal(true)}
          onOpenScoreboard={() => {
            fetchScoreboard();
            setShowScoreboard(true);
          }}
          onOpenTutorial={() => setShowTutorialHelp(true)}
          onOpenVictory={() => setShowVictory(true)}
        />
      )}

      {/* Event Notification Banner */}
      {toastBanner && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-30 px-5 py-2.5 rounded-xl bg-slate-900/95 border border-emerald-400/70 text-xs font-bold text-emerald-200 shadow-xl pointer-events-none">
          {toastBanner}
        </div>
      )}

      {/* Onboarding & Controls Tutorial */}
      {(showOnboarding || showTutorialHelp) && (
        <TutorialModal
          isFirstLaunch={showOnboarding}
          initialName={player?.playerName || ''}
          initialTeam={player?.teamId || 'alpha'}
          hasTeamProgress={hasTeamProgress}
          explorationOnly={PHASE_1_EXPLORATION_ONLY}
          onStart={handleStartGame}
          onClose={() => setShowTutorialHelp(false)}
          onRestartGame={handleRestartGame}
          onNewProfile={handleOpenNewProfile}
        />
      )}

      {/* Centered Terminal Inspection Modal (Phase 2 Object Interaction) */}
      {PHASE_1_EXPLORATION_ONLY && inspectedTerminalId && (
        <TerminalInspectModal
          puzzleId={inspectedTerminalId}
          placement={TERMINALS.find((t) => t.puzzleId === inspectedTerminalId)}
          onClose={() => setInspectedTerminalId(null)}
        />
      )}

      {/* Puzzle Modal (Phase 2+) */}
      {!PHASE_1_EXPLORATION_ONLY && activePuzzle && player && (
        <ProblemModal
          puzzle={activePuzzle}
          isSolved={player.solvedPuzzleIds.includes(activePuzzle.id)}
          earnedScore={player.puzzleScores[activePuzzle.id]}
          hintsUsed={player.hintsUsedByPuzzle[activePuzzle.id] ?? 0}
          cachedHints={player.aiHintsByPuzzle[activePuzzle.id] || []}
          chatMessages={player.aiChatByPuzzle?.[activePuzzle.id] || []}
          attemptsCount={player.attemptsByPuzzle[activePuzzle.id] ?? 0}
          discoveredClueIds={player.discoveredClueIds}
          onClose={() => setActivePuzzleId(null)}
          onRequestHint={handleRequestHint}
          onSendAiChat={handleSendAiChat}
          onSubmitAnswer={handleSubmitAnswer}
        />
      )}

      {/* Clue & Mission Notebook (Phase 2+) */}
      {!PHASE_1_EXPLORATION_ONLY && showCluesModal && player && (
        <ClueNotebookModal
          solvedPuzzleIds={player.solvedPuzzleIds}
          puzzleScores={player.puzzleScores}
          discoveredClueIds={player.discoveredClueIds}
          onClose={() => setShowCluesModal(false)}
          onSelectPuzzleReview={(pId) => setActivePuzzleId(pId)}
        />
      )}

      {/* Team Scoreboard */}
      {showScoreboard && player && (
        <ScoreboardModal
          currentPlayerId={player.playerId}
          scoreboard={effectiveScoreboard}
          onClose={() => setShowScoreboard(false)}
          onRefresh={fetchScoreboard}
          onSwitchOrAddPlayer={handleStartGame}
        />
      )}

      {/* Victory Modal */}
      {showVictory && player && (
        <VictoryModal
          playerName={player.playerName}
          teamId={player.teamId}
          totalScore={player.totalScore}
          solvedCount={player.solvedPuzzleIds.length}
          totalHintsUsed={totalHintsUsed}
          discoveredClueIds={player.discoveredClueIds}
          remainingSeconds={player.remainingSeconds}
          alphaScore={effectiveScoreboard.alphaTotal}
          betaScore={effectiveScoreboard.betaTotal}
          onContinueExploring={() => setShowVictory(false)}
          onOpenScoreboard={() => {
            setShowVictory(false);
            fetchScoreboard();
            setShowScoreboard(true);
          }}
          onRestartGame={handleRestartGame}
        />
      )}
    </div>
  );
}
