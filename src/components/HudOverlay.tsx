import React from 'react';
import {
  Award,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Compass,
  HelpCircle,
  RotateCcw,
  Shield,
  Trophy,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { PUZZLES } from '../data/puzzles';
import { TeamId, ZoneMeta } from '../types/game';

interface HudOverlayProps {
  playerName: string;
  teamId: TeamId;
  currentZone: ZoneMeta;
  totalScore: number;
  solvedCount: number;
  clueCount: number;
  remainingSeconds: number;
  alphaScore: number;
  betaScore: number;
  hudCollapsed: boolean;
  muted: boolean;
  explorationOnly?: boolean;
  finalRestored?: boolean;
  onToggleHud: () => void;
  onToggleMute: () => void;
  onResetCamera: () => void;
  onOpenClues: () => void;
  onOpenScoreboard: () => void;
  onOpenTutorial: () => void;
  onOpenVictory?: () => void;
  onOpenAdmin?: () => void;
}

function formatTimer(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const HudOverlay: React.FC<HudOverlayProps> = ({
  playerName,
  teamId,
  currentZone,
  totalScore,
  solvedCount,
  clueCount,
  remainingSeconds,
  alphaScore,
  betaScore,
  hudCollapsed,
  muted,
  explorationOnly = false,
  finalRestored = false,
  onToggleHud,
  onToggleMute,
  onResetCamera,
  onOpenClues,
  onOpenScoreboard,
  onOpenTutorial,
  onOpenVictory,
  onOpenAdmin,
}) => {
  const totalPuzzles = PUZZLES.length;
  const progressPercent = totalPuzzles > 0 ? Math.round((solvedCount / totalPuzzles) * 100) : 0;

  return (
    <>
      {/* Top 1-Row Compact HUD Bar (Zero backdrop-filter, crisp solid surface) */}
      <header className="fixed top-3 left-3 right-3 z-20 flex items-center justify-between gap-4 px-4 py-2.5 rounded-xl bg-slate-900/92 border border-slate-700/90 shadow-lg text-slate-100 pointer-events-auto">
        {/* Zone 1: Brand + Current Zone */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-sm font-extrabold tracking-tight text-white whitespace-nowrap shrink-0">
            BLACK BOX
          </span>
          <span className="text-slate-500" aria-hidden="true">
            ·
          </span>
          <span
            className="text-xs font-bold whitespace-nowrap truncate"
            style={{ color: currentZone.accentHex }}
          >
            {currentZone.shortName} {currentZone.name}
          </span>
          {!explorationOnly && (
            <span className="md:hidden font-mono text-[11px] font-bold text-emerald-300 whitespace-nowrap shrink-0 tabular-nums">
              {solvedCount}/{totalPuzzles} ({progressPercent}%)
            </span>
          )}
        </div>

        {/* Zone 2: Core Metrics or Phase 1 Zone Subtitle */}
        {explorationOnly ? (
          <div className="hidden md:flex items-center gap-3 text-xs text-slate-300">
            <span>{currentZone.subtitle}</span>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-4 text-xs font-medium text-slate-300 tabular-nums">
            <div className="whitespace-nowrap">
              <span className="text-slate-400 mr-1.5">남은 시간</span>
              <span className="font-mono font-bold text-white">{formatTimer(remainingSeconds)}</span>
            </div>
            <span className="text-slate-600" aria-hidden="true">
              /
            </span>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span className="text-slate-400">해결</span>
              <span className="font-mono font-bold text-emerald-300">
                {solvedCount} / {totalPuzzles}
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-400">진행률</span>
              <span className="font-mono font-bold text-emerald-300">{progressPercent}%</span>
              <div
                className="w-16 h-2 rounded-full bg-slate-800 border border-slate-700 overflow-hidden"
                aria-label={`전체 진행률 ${progressPercent}%`}
              >
                <div
                  className="h-full bg-emerald-400 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
            <span className="text-slate-600" aria-hidden="true">
              /
            </span>
            <div className="whitespace-nowrap">
              <span className="text-slate-400 mr-1.5">내 점수</span>
              <span className="font-mono font-bold text-sky-300">{totalScore}점</span>
            </div>
            <span className="text-slate-600 hidden xl:inline" aria-hidden="true">
              /
            </span>
            <button
              onClick={onOpenScoreboard}
              className="hidden xl:inline whitespace-nowrap hover:text-white transition-colors"
              title="팀별 점수판 보기"
            >
              <span className="text-sky-400 font-semibold">알파 {alphaScore}</span>
              <span className="text-slate-500 mx-1.5">:</span>
              <span className="text-rose-400 font-semibold">베타 {betaScore}</span>
            </button>
          </div>
        )}

        {/* Zone 3: Quick Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {!explorationOnly && (
            <>
              <span className="hidden lg:inline text-xs text-slate-400 mr-1 whitespace-nowrap">
                {playerName} ({teamId === 'alpha' ? '알파 팀' : '베타 팀'})
              </span>
              <button
                onClick={onOpenClues}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-semibold text-indigo-300 flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>단서 · 미션 ({clueCount}/4)</span>
              </button>
              <button
                onClick={onOpenScoreboard}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-semibold text-amber-300 flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
              >
                <Trophy className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">팀 점수판</span>
              </button>
              {finalRestored && onOpenVictory && (
                <button
                  onClick={onOpenVictory}
                  className="px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/60 text-xs font-semibold text-indigo-200 flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">복구 결과</span>
                </button>
              )}
            </>
          )}
          <button
            onClick={onOpenTutorial}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-semibold text-slate-200 hover:text-white flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>조작 방법</span>
          </button>
          {onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              title="관리자 페이지 (서버 접속자 모니터링)"
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-semibold text-slate-300 hover:text-sky-300 flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors"
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">관리자</span>
            </button>
          )}
          <button
            onClick={onToggleMute}
            aria-label={muted ? '소리 켜기' : '소리 끄기'}
            title={muted ? '소리 켜기' : '소리 끄기'}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 hover:text-white transition-colors"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Collapsible Bottom Dock */}
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-auto">
        <button
          onClick={onToggleHud}
          className="mb-1 px-3 py-1 rounded-lg bg-slate-900/90 border border-slate-700 text-[11px] font-medium text-slate-300 hover:text-white flex items-center gap-1 transition-colors"
        >
          {hudCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              조작 바 열기
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              조작 바 접기
            </>
          )}
        </button>

        {!hudCollapsed && (
          <div className="px-4 py-2 rounded-xl bg-slate-900/92 border border-slate-700/90 shadow-lg flex items-center gap-4 text-xs text-slate-200 whitespace-nowrap">
            <div className="flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-sky-400" />
              <span>이동: WASD / 방향키 (달리기 Shift)</span>
            </div>
            <span className="text-slate-600" aria-hidden="true">
              ·
            </span>
            <span>시점 회전: 마우스 드래그 / J·L</span>
            <span className="text-slate-600" aria-hidden="true">
              ·
            </span>
            <span>{explorationOnly ? '터미널 조사: E 키 / 클릭' : '조사: E / 클릭'}</span>
            <button
              onClick={onResetCamera}
              className="ml-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-[11px] font-semibold text-slate-200 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              시점 초기화
            </button>
          </div>
        )}
      </div>
    </>
  );
};
