import React from 'react';
import { Award, CheckCircle2, RotateCcw, ShieldCheck, Trophy } from 'lucide-react';
import { CLUES, PUZZLES } from '../data/puzzles';
import { TeamId } from '../types/game';

interface VictoryModalProps {
  playerName: string;
  teamId: TeamId;
  totalScore: number;
  solvedCount: number;
  totalHintsUsed: number;
  discoveredClueIds: string[];
  remainingSeconds: number;
  alphaScore: number;
  betaScore: number;
  onContinueExploring: () => void;
  onOpenScoreboard: () => void;
  onRestartGame: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  playerName,
  teamId,
  totalScore,
  solvedCount,
  totalHintsUsed,
  discoveredClueIds,
  remainingSeconds,
  alphaScore,
  betaScore,
  onContinueExploring,
  onOpenScoreboard,
  onRestartGame,
}) => {
  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  const progressPercent = PUZZLES.length > 0 ? Math.round((solvedCount / PUZZLES.length) * 100) : 0;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onContinueExploring();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 pointer-events-auto"
    >
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-indigo-400/70 rounded-2xl shadow-2xl p-6 space-y-5 text-slate-100">
        {/* System Restored Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-indigo-500/20 border border-indigo-400/40 text-indigo-300">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                최종 시스템 복구 완료 · 게임 결과
              </div>
              <h2 className="text-xl font-extrabold text-white mt-0.5">BLACK BOX 정상 가동!</h2>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-lg text-xs font-bold border ${
              teamId === 'alpha'
                ? 'bg-sky-500/15 border-sky-400/50 text-sky-300'
                : 'bg-rose-500/15 border-rose-400/50 text-rose-300'
            }`}
          >
            {teamId === 'alpha' ? '알파 팀' : '베타 팀'}
          </span>
        </div>

        <p className="text-sm text-slate-200 leading-relaxed">
          축하합니다, <strong>{playerName}</strong> 탐험가님! 중앙 퀀텀 코어 복구 코드를 성공적으로 입력해
          BLACK BOX 시스템을 정상 가동했습니다. (+200점 복구 보너스 지급)
        </p>

        {/* System Recovery Status Chips */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3.5 space-y-2">
          <div className="text-xs font-bold text-indigo-300">최종 복구 코어 통합 상태</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {CLUES.map((clue) => {
              const collected = discoveredClueIds.includes(clue.id);
              return (
                <div
                  key={clue.id}
                  className={`px-2.5 py-2 rounded-lg border text-xs ${
                    collected
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200'
                      : 'bg-slate-900/70 border-slate-700 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-1 text-[10px] font-semibold">
                    <CheckCircle2 className={`w-3 h-3 ${collected ? 'text-emerald-400' : 'text-slate-500'}`} />
                    {clue.zoneId.toUpperCase()}
                  </div>
                  <div className="font-mono font-bold mt-0.5 truncate">{clue.valueText}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Individual Results Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-3">
            <div className="text-[11px] text-slate-400">내 최종 점수</div>
            <div className="font-mono text-xl font-extrabold text-sky-300 tabular-nums mt-0.5">
              {totalScore}점
            </div>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-3">
            <div className="text-[11px] text-slate-400">해결 문제 · 진행률</div>
            <div className="font-mono text-lg font-extrabold text-emerald-300 tabular-nums mt-0.5">
              {solvedCount}/{PUZZLES.length} ({progressPercent}%)
            </div>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-3">
            <div className="text-[11px] text-slate-400">힌트 사용</div>
            <div className="font-mono text-xl font-extrabold text-indigo-300 tabular-nums mt-0.5">
              {totalHintsUsed}회
            </div>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-3">
            <div className="text-[11px] text-slate-400">남은 시간</div>
            <div className="font-mono text-xl font-extrabold text-amber-300 tabular-nums mt-0.5">
              {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </div>
          </div>
        </div>

        {/* Team Score Summary */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-sky-500/10 border border-sky-400/40 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="font-bold text-sky-300">알파 팀 합산</span>
            <span className="font-mono text-base font-extrabold text-white tabular-nums">{alphaScore}점</span>
          </div>
          <div className="bg-rose-500/10 border border-rose-400/40 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="font-bold text-rose-300">베타 팀 합산</span>
            <span className="font-mono text-base font-extrabold text-white tabular-nums">{betaScore}점</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
          <button
            onClick={onOpenScoreboard}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-amber-400/40 text-xs font-semibold text-amber-300 flex items-center gap-1.5"
          >
            <Trophy className="w-4 h-4" />
            팀 점수판 보기
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onRestartGame}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-semibold text-slate-200 flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              처음부터 다시 시작
            </button>
            <button
              onClick={onContinueExploring}
              className="px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-sm"
            >
              남은 문제 계속 탐험
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
