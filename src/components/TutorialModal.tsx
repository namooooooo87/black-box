import React, { useState } from 'react';
import { Keyboard, Mouse, RotateCcw, ShieldCheck, Sparkles, UserPlus, X } from 'lucide-react';
import { TeamId } from '../types/game';

interface TutorialModalProps {
  isFirstLaunch: boolean;
  initialName: string;
  initialTeam: TeamId;
  hasTeamProgress: Record<TeamId, boolean>;
  explorationOnly?: boolean;
  onStart: (playerName: string, teamId: TeamId, joinMode: 'fresh' | 'sync-team') => void;
  onClose?: () => void;
  onRestartGame?: () => void;
  onNewProfile?: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({
  isFirstLaunch,
  initialName,
  initialTeam,
  hasTeamProgress,
  explorationOnly = false,
  onStart,
  onClose,
  onRestartGame,
  onNewProfile,
}) => {
  const [name, setName] = useState(initialName || '탐험가');
  const [team, setTeam] = useState<TeamId>(initialTeam);
  const [joinMode, setJoinMode] = useState<'fresh' | 'sync-team'>('fresh');
  const [confirmRestart, setConfirmRestart] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart(name.trim() || '탐험가', team, joinMode);
  };

  return (
    <div
      onClick={(e) => {
        if (!isFirstLaunch && onClose && e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 pointer-events-auto"
    >
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        <div className="px-6 py-5 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-sky-400">
              {explorationOnly ? '3D 연구소 환경 · 조작 안내' : '3D 컴퓨팅 사고력 추리 어드벤처'}
            </div>
            <h1 className="text-xl font-extrabold text-white mt-0.5">BLACK BOX – THE LOST SYSTEM</h1>
          </div>
          {!isFirstLaunch && onClose && (
            <button
              onClick={onClose}
              aria-label="닫기"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-4 text-xs text-slate-200 leading-relaxed space-y-1.5">
            <p className="font-semibold text-white">연구소 안내</p>
            <p>
              {explorationOnly
                ? '정체불명의 SF 연구소 BLACK BOX 내부 5개 구역을 자유롭게 걸어 다니며 시설과 컴퓨터, 자동문, 조명을 탐험해 보세요.'
                : '연구소 BLACK BOX의 중앙 시스템이 정지하며 데이터가 5개 구역으로 흩어졌습니다. 3D 연구소를 직접 돌아다니며 각 구역의 컴퓨팅 사고력 문제를 풀고 단서를 모아 최종 시스템을 복구하세요!'}
            </p>
          </div>

          {/* Controls Tutorial */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3.5 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-sky-300">
                <Keyboard className="w-4 h-4" />
                키보드 이동 조작
              </div>
              <p className="text-slate-300">• WASD / 방향키 : 캐릭터 이동</p>
              <p className="text-slate-300">• Shift : 빠르게 달리기</p>
              <p className="text-slate-300">• E 키 : 터미널 조사 창 열기</p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3.5 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                <Mouse className="w-4 h-4" />
                카메라 시점 & 탐험
              </div>
              <p className="text-slate-300">• 마우스 드래그 / J·L : 시점 회전</p>
              <p className="text-slate-300">• 마우스 휠 : 화면 확대/축소</p>
              <p className="text-slate-300">
                {explorationOnly
                  ? '• 문에 다가가면 자동으로 열립니다'
                  : '• AI 3단계 힌트 무제한 이용 가능'}
              </p>
            </div>
          </div>

          {isFirstLaunch && !explorationOnly && (
            <>
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300">탐험가 이름 (닉네임)</label>
                <input
                  type="text"
                  maxLength={16}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="이름을 입력하세요"
                  className="w-full bg-slate-950 border border-slate-600 focus:border-sky-400 focus:outline-none rounded-xl px-4 py-2.5 text-sm text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300">소속 팀 선택 (1인 플레이 및 2팀 대항전 지원)</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTeam('alpha')}
                    className={`p-3 rounded-xl border text-left transition-colors ${
                      team === 'alpha'
                        ? 'bg-sky-500/20 border-sky-400 text-white'
                        : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <div className="text-sm font-bold text-sky-300">알파 팀 (ALPHA)</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">사이버 블루 유닛</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTeam('beta')}
                    className={`p-3 rounded-xl border text-left transition-colors ${
                      team === 'beta'
                        ? 'bg-rose-500/20 border-rose-400 text-white'
                        : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <div className="text-sm font-bold text-rose-300">베타 팀 (BETA)</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">퀀텀 레드 유닛</div>
                  </button>
                </div>
              </div>

              {hasTeamProgress[team] && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-300">참여 시작 위치 선택</label>
                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setJoinMode('fresh')}
                      className={`p-3 rounded-xl border text-left ${
                        joinMode === 'fresh'
                          ? 'bg-emerald-500/15 border-emerald-400 text-white'
                          : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="font-bold">처음부터 시작</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">1구역부터 순서대로 탐험</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setJoinMode('sync-team')}
                      className={`p-3 rounded-xl border text-left ${
                        joinMode === 'sync-team'
                          ? 'bg-emerald-500/15 border-emerald-400 text-white'
                          : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="font-bold">팀 진행 구역부터 합류</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">열린 문 상태만 팀에 맞춤</div>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {!isFirstLaunch && !explorationOnly && (onRestartGame || onNewProfile) && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3.5 space-y-2.5">
              <div className="text-xs font-bold text-slate-200">진행 관리 · 다시 시작</div>
              {!confirmRestart ? (
                <div className="flex flex-wrap gap-2">
                  {onRestartGame && (
                    <button
                      type="button"
                      onClick={() => setConfirmRestart(true)}
                      className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-700 border border-rose-500/40 text-xs font-semibold text-rose-300 flex items-center gap-1.5 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      처음부터 다시 시작
                    </button>
                  )}
                  {onNewProfile && (
                    <button
                      type="button"
                      onClick={onNewProfile}
                      className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-700 border border-slate-600 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      닉네임·팀 새로 설정
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-2 bg-rose-500/10 border border-rose-400/40 rounded-lg px-3 py-2">
                  <span className="text-xs text-rose-200 font-medium">
                    현재 점수와 해결 기록을 초기화하고 처음부터 다시 시작할까요?
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmRestart(false)}
                      className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmRestart(false);
                        onRestartGame?.();
                      }}
                      className="px-3 py-1 rounded-md bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs"
                    >
                      초기화 후 다시 시작
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{explorationOnly ? 'WASD / 방향키 · 마우스 드래그' : '진행 상황은 자동 저장됩니다 (1인 탐험도 모든 구역 가능)'}</span>
            </div>
            {isFirstLaunch ? (
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm flex items-center gap-2 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                연구소 탐험 시작
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm transition-colors"
              >
                탐험으로 돌아가기
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
