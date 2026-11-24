import React, { useState } from 'react';
import { RefreshCw, Trophy, UserPlus, X } from 'lucide-react';
import { ScoreboardResponse, TeamId } from '../types/game';

interface ScoreboardModalProps {
  currentPlayerId: string;
  scoreboard: ScoreboardResponse;
  onClose: () => void;
  onRefresh: () => void;
  onSwitchOrAddPlayer: (name: string, teamId: TeamId, joinMode: 'fresh' | 'sync-team') => void;
}

export const ScoreboardModal: React.FC<ScoreboardModalProps> = ({
  currentPlayerId,
  scoreboard,
  onClose,
  onRefresh,
  onSwitchOrAddPlayer,
}) => {
  const [newName, setNewName] = useState('');
  const [newTeam, setNewTeam] = useState<TeamId>('alpha');
  const [joinMode, setJoinMode] = useState<'fresh' | 'sync-team'>('fresh');

  const alphaMembers = scoreboard.members.filter((m) => m.teamId === 'alpha');
  const betaMembers = scoreboard.members.filter((m) => m.teamId === 'beta');

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onSwitchOrAddPlayer(newName.trim(), newTeam, joinMode);
    setNewName('');
  };

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
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">팀별 대항전 실시간 점수판</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-semibold text-slate-200 flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              새로고침
            </button>
            <button
              onClick={onClose}
              aria-label="닫기"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {/* Team Totals */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-sky-500/10 border border-sky-400/50 p-4">
              <div className="text-xs font-bold text-sky-300">알파 팀 (ALPHA)</div>
              <div className="font-mono text-3xl font-extrabold text-white mt-1 tabular-nums">
                {scoreboard.alphaTotal}점
              </div>
              <div className="text-xs text-slate-400 mt-1">참여 팀원 {alphaMembers.length}명 합산</div>
            </div>
            <div className="rounded-xl bg-rose-500/10 border border-rose-400/50 p-4">
              <div className="text-xs font-bold text-rose-300">베타 팀 (BETA)</div>
              <div className="font-mono text-3xl font-extrabold text-white mt-1 tabular-nums">
                {scoreboard.betaTotal}점
              </div>
              <div className="text-xs text-slate-400 mt-1">참여 팀원 {betaMembers.length}명 합산</div>
            </div>
          </div>

          {/* Individual Member Lists */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { title: '알파 팀원 기록', list: alphaMembers, color: 'text-sky-300' },
              { title: '베타 팀원 기록', list: betaMembers, color: 'text-rose-300' },
            ].map((col) => (
              <div key={col.title} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-2.5">
                <div className={`text-xs font-bold ${col.color}`}>{col.title}</div>
                {col.list.length === 0 ? (
                  <div className="text-xs text-slate-500 py-2">아직 참여한 팀원이 없습니다.</div>
                ) : (
                  <div className="space-y-1.5">
                    {col.list.map((m) => (
                      <div
                        key={m.playerId}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${
                          m.playerId === currentPlayerId
                            ? 'bg-slate-700/80 border border-slate-500 text-white font-semibold'
                            : 'bg-slate-900/70 text-slate-300'
                        }`}
                      >
                        <div className="truncate">
                          {m.playerName}
                          {m.playerId === currentPlayerId && ' (나)'}
                          {m.finalRestored && ' ★복구'}
                        </div>
                        <div className="font-mono tabular-nums text-slate-200 shrink-0">
                          {m.totalScore}점 · {m.solvedCount}문제
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add / Switch Student Profile */}
          <form
            onSubmit={handleAddPlayer}
            className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 space-y-3"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
              <UserPlus className="w-4 h-4" />
              새 학생으로 참여하기 (기존 기록은 독립적으로 저장됩니다)
            </div>
            <p className="text-[11px] text-slate-400">
              현재 실행 중인 서버 인스턴스에 접속한 학생들의 점수가 팀별로 합산됩니다. 여러 컴퓨터·분산 환경에서 영구 실시간 동기화를 하려면 외부 공용 DB 연동이 필요합니다.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                maxLength={16}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="새 학생 닉네임"
                className="flex-1 bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-xs text-white focus:border-sky-400 focus:outline-none"
              />
              <select
                value={newTeam}
                onChange={(e) => setNewTeam(e.target.value as TeamId)}
                className="bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="alpha">알파 팀</option>
                <option value="beta">베타 팀</option>
              </select>
              <select
                value={joinMode}
                onChange={(e) => setJoinMode(e.target.value as 'fresh' | 'sync-team')}
                className="bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="fresh">처음부터 시작</option>
                <option value="sync-team">팀 진행 구역부터</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs whitespace-nowrap"
              >
                참여 전환
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
