import React from 'react';
import { BookOpen, CheckCircle2, Circle, KeyRound, X } from 'lucide-react';
import { ZONES } from '../data/labLayout';
import { CLUES, PUZZLES } from '../data/puzzles';

interface ClueNotebookModalProps {
  solvedPuzzleIds: string[];
  puzzleScores: Record<string, number>;
  discoveredClueIds: string[];
  onClose: () => void;
  onSelectPuzzleReview: (puzzleId: string) => void;
}

export const ClueNotebookModal: React.FC<ClueNotebookModalProps> = ({
  solvedPuzzleIds,
  puzzleScores,
  discoveredClueIds,
  onClose,
  onSelectPuzzleReview,
}) => {
  const solvedSet = new Set(solvedPuzzleIds);
  const progressPercent = PUZZLES.length > 0 ? Math.round((solvedPuzzleIds.length / PUZZLES.length) * 100) : 0;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/65 pointer-events-auto"
    >
      <div className="w-full max-w-3xl max-h-[88vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        <div className="px-6 py-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">수집한 단서 & 미션 진행 현황</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {/* Overall Progress Bar */}
          <section className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-emerald-300">전체 시스템 복구 진행률</span>
              <span className="font-mono text-white tabular-nums">
                {solvedPuzzleIds.length} / {PUZZLES.length} 문제 해결 ({progressPercent}%)
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-900 border border-slate-700 overflow-hidden">
              <div
                className="h-full bg-emerald-400 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </section>

          {/* Collected Clues */}
          <section className="space-y-3">
            <h3 className="text-sm font-bold text-indigo-300 flex items-center gap-2">
              <KeyRound className="w-4 h-4" />
              수집한 핵심 단서 ({discoveredClueIds.length} / {CLUES.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CLUES.map((clue) => {
                const found = discoveredClueIds.includes(clue.id);
                return (
                  <div
                    key={clue.id}
                    className={`rounded-xl border p-4 ${
                      found
                        ? 'bg-indigo-500/10 border-indigo-400/50'
                        : 'bg-slate-800/40 border-slate-800 text-slate-500'
                    }`}
                  >
                    <div className="text-xs font-semibold text-slate-400">
                      {clue.code} · {clue.zoneId.toUpperCase()}
                    </div>
                    <div className="text-sm font-bold text-white mt-0.5">
                      {found ? clue.title : '미발견 단서'}
                    </div>
                    {found ? (
                      <>
                        <div className="font-mono text-base font-bold text-indigo-300 mt-1">
                          {clue.valueText}
                        </div>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">{clue.summary}</p>
                      </>
                    ) : (
                      <p className="text-xs text-slate-500 mt-1">
                        해당 구역의 문제를 해결하면 단서가 기록됩니다.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Zone-by-Zone Mission Checklist + Review */}
          <section className="space-y-3">
            <h3 className="text-sm font-bold text-sky-300">구역별 문제 현황 (해결한 문제 다시 보기)</h3>
            <div className="space-y-3">
              {ZONES.map((z) => {
                const zPuzzles = PUZZLES.filter((p) => p.zoneId === z.id);
                const zSolved = zPuzzles.filter((p) => solvedSet.has(p.id)).length;
                return (
                  <div
                    key={z.id}
                    className="bg-slate-800/50 border border-slate-700/80 rounded-xl p-4 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold" style={{ color: z.accentHex }}>
                          {z.shortName}
                        </span>
                        <span className="text-sm font-bold text-white ml-2">{z.name}</span>
                        <span className="text-xs text-slate-400 ml-2">— {z.subtitle}</span>
                      </div>
                      <span className="font-mono text-xs font-semibold text-slate-300 tabular-nums">
                        {zSolved} / {zPuzzles.length}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {zPuzzles.map((p) => {
                        const solved = solvedSet.has(p.id);
                        return (
                          <div
                            key={p.id}
                            className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-xs ${
                              solved
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                                : 'bg-slate-900/60 border-slate-800 text-slate-400'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {solved ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              ) : (
                                <Circle className="w-4 h-4 text-slate-600 shrink-0" />
                              )}
                              <span className="truncate">{p.title}</span>
                            </div>
                            {solved && (
                              <button
                                onClick={() => {
                                  onClose();
                                  onSelectPuzzleReview(p.id);
                                }}
                                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-sky-300 shrink-0"
                              >
                                다시 보기 ({puzzleScores[p.id] ?? 100}점)
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
