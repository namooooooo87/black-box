import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Bot,
  CheckCircle2,
  Clock,
  Compass,
  Download,
  KeyRound,
  Lightbulb,
  LogOut,
  MapPin,
  RefreshCw,
  Search,
  Shield,
  Sparkles,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { ZONES } from '../data/labLayout';
import { CLUES, PUZZLES } from '../data/puzzles';
import { AdminOverviewResponse, AdminPlayerRecord } from '../types/game';

interface AdminDashboardProps {
  onBackToGame: () => void;
  onRefreshPublicScoreboard?: () => void;
}

function formatDateTime(ts: number): string {
  if (!ts) return '-';
  return new Date(ts).toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatRelativeTime(ts: number): string {
  const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diffSec < 10) return '방금 전';
  if (diffSec < 60) return `${diffSec}초 전`;
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  return `${hours}시간 전`;
}

function formatTimer(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function escapeCsvCell(value: string | number | boolean): string {
  const str = String(value ?? '');
  const formulaSafe = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
  return `"${formulaSafe.replace(/"/g, '""')}"`;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onBackToGame,
  onRefreshPublicScoreboard,
}) => {
  // Admin Bearer token is kept in React JS memory only (never localStorage/sessionStorage)
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState<boolean>(true);
  const [needsSetup, setNeedsSetup] = useState<boolean>(false);
  const [envConfigured, setEnvConfigured] = useState<boolean>(false);

  const [passcodeInput, setPasscodeInput] = useState<string>('');
  const [confirmPasscodeInput, setConfirmPasscodeInput] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState<boolean>(false);

  const [overview, setOverview] = useState<AdminOverviewResponse | null>(null);
  const [dataLoading, setDataLoading] = useState<boolean>(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [teamFilter, setTeamFilter] = useState<'all' | 'alpha' | 'beta'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'restored'>('all');
  const [sortBy, setSortBy] = useState<'updatedAt' | 'totalScore' | 'solvedCount'>('updatedAt');

  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [confirmResetAll, setConfirmResetAll] = useState<boolean>(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'players' | 'puzzles' | 'activity'>('players');

  const checkAdminStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      const res = await fetch('/api/admin/status');
      if (res.ok) {
        const data = (await res.json()) as { needsSetup: boolean; envConfigured: boolean };
        setNeedsSetup(Boolean(data.needsSetup));
        setEnvConfigured(Boolean(data.envConfigured));
      }
    } catch {
      setAuthError('서버 상태를 불러오지 못했습니다.');
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAdminStatus();
  }, [checkAdminStatus]);

  const fetchOverview = useCallback(
    async (token: string, silent = false) => {
      if (!silent) setDataLoading(true);
      setDataError(null);
      try {
        const res = await fetch('/api/admin/overview', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
          setAdminToken(null);
          setOverview(null);
          setAuthError('관리자 세션이 만료되었습니다. 다시 로그인해 주세요.');
          return;
        }
        if (!res.ok) {
          setDataError('서버 접속자 데이터를 불러오는 중 오류가 발생했습니다.');
          return;
        }
        const data = (await res.json()) as AdminOverviewResponse;
        setOverview(data);
      } catch {
        setDataError('서버와 연결할 수 없습니다.');
      } finally {
        if (!silent) setDataLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!adminToken) return;
    fetchOverview(adminToken);
  }, [adminToken, fetchOverview]);

  useEffect(() => {
    if (!adminToken || !autoRefresh) return;
    const id = window.setInterval(() => {
      fetchOverview(adminToken, true);
    }, 5000);
    return () => window.clearInterval(id);
  }, [adminToken, autoRefresh, fetchOverview]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const trimmed = passcodeInput.trim();
    if (!trimmed) {
      setAuthError('비밀번호를 입력해 주세요.');
      return;
    }

    if (needsSetup) {
      if (trimmed.length < 4 || trimmed.length > 64) {
        setAuthError('비밀번호는 4자 이상 64자 이하로 설정해 주세요.');
        return;
      }
      if (trimmed !== confirmPasscodeInput.trim()) {
        setAuthError('비밀번호 확인이 일치하지 않습니다.');
        return;
      }
    }

    setAuthSubmitting(true);
    try {
      const endpoint = needsSetup ? '/api/admin/setup' : '/api/admin/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.token) {
        setAuthError(data.error || '인증에 실패했습니다.');
        if (res.status === 409) {
          await checkAdminStatus();
        }
        return;
      }
      setPasscodeInput('');
      setConfirmPasscodeInput('');
      setNeedsSetup(false);
      setAdminToken(data.token);
    } catch {
      setAuthError('서버와 통신하지 못했습니다.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleDeletePlayer = async (playerId: string) => {
    if (!adminToken) return;
    try {
      const res = await fetch(`/api/admin/players/${encodeURIComponent(playerId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.status === 401) {
        setAdminToken(null);
        return;
      }
      if (res.ok) {
        const data = (await res.json()) as AdminOverviewResponse;
        setOverview(data);
        setConfirmDeleteId(null);
        if (selectedPlayerId === playerId) setSelectedPlayerId(null);
        onRefreshPublicScoreboard?.();
      }
    } catch {
      setDataError('학생 데이터 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleResetAll = async () => {
    if (!adminToken) return;
    try {
      const res = await fetch('/api/admin/reset-all', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.status === 401) {
        setAdminToken(null);
        return;
      }
      if (res.ok) {
        const data = (await res.json()) as AdminOverviewResponse;
        setOverview(data);
        setConfirmResetAll(false);
        setSelectedPlayerId(null);
        onRefreshPublicScoreboard?.();
      }
    } catch {
      setDataError('전체 데이터 초기화 중 오류가 발생했습니다.');
    }
  };

  const filteredPlayers = useMemo(() => {
    const list = overview?.players || [];
    const q = searchQuery.trim().toLowerCase();
    return list
      .filter((p) => {
        if (teamFilter !== 'all' && p.teamId !== teamFilter) return false;
        if (statusFilter === 'online' && !p.isOnline) return false;
        if (statusFilter === 'restored' && !p.finalRestored) return false;
        if (
          q &&
          !p.playerName.toLowerCase().includes(q) &&
          !p.playerId.toLowerCase().includes(q)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'totalScore') return b.totalScore - a.totalScore;
        if (sortBy === 'solvedCount') return b.solvedCount - a.solvedCount;
        return b.updatedAt - a.updatedAt;
      });
  }, [overview?.players, searchQuery, teamFilter, statusFilter, sortBy]);

  const selectedPlayer: AdminPlayerRecord | null = useMemo(() => {
    if (!selectedPlayerId || !overview?.players) return null;
    return overview.players.find((p) => p.playerId === selectedPlayerId) || null;
  }, [overview?.players, selectedPlayerId]);

  const puzzleAggregates = useMemo(() => {
    const players = overview?.players || [];
    return PUZZLES.map((puzzle) => {
      let solvedCount = 0;
      let totalAttempts = 0;
      let totalHints = 0;
      for (const p of players) {
        if (p.solvedPuzzleIds.includes(puzzle.id)) solvedCount++;
        totalAttempts += p.attemptsByPuzzle[puzzle.id] ?? 0;
        totalHints += p.hintsUsedByPuzzle[puzzle.id] ?? 0;
      }
      const solveRate = players.length > 0 ? Math.round((solvedCount / players.length) * 100) : 0;
      return {
        puzzle,
        solvedCount,
        totalAttempts,
        totalHints,
        solveRate,
      };
    });
  }, [overview?.players]);

  const handleDownloadCsv = () => {
    if (!overview) return;
    const headers = [
      '닉네임',
      '플레이어 ID',
      '팀',
      '상태',
      '점수',
      '해결 문제 수',
      '진행률(%)',
      '단서 수',
      '총 힌트 사용',
      'AI 질문 수',
      '현재 구역',
      '최종 복구',
      '남은 시간',
      '최근 동기화',
    ];
    const rows = filteredPlayers.map((p) => {
      const zone = ZONES.find((z) => z.id === p.currentZoneId);
      const hintsSum = Object.values(p.hintsUsedByPuzzle).reduce((s, n) => s + (Number(n) || 0), 0);
      const progressPct = Math.round((p.solvedCount / PUZZLES.length) * 100);
      return [
        p.playerName,
        p.playerId,
        p.teamId === 'alpha' ? '알파 팀' : '베타 팀',
        p.isOnline ? '접속 중' : '오프라인',
        p.totalScore,
        p.solvedCount,
        progressPct,
        p.discoveredClueIds.length,
        hintsSum,
        p.aiChatCount,
        zone ? `${zone.shortName} ${zone.name}` : p.currentZoneId,
        p.finalRestored ? '완료' : '진행 중',
        formatTimer(p.remainingSeconds),
        formatDateTime(p.updatedAt),
      ].map(escapeCsvCell);
    });
    const csv = '\uFEFF' + [headers.map(escapeCsvCell).join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blackbox-players-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Auth Gate Screen
  if (!adminToken) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 text-slate-100 overflow-y-auto flex flex-col">
        <header className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/50 flex items-center justify-center text-sky-300">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white">BLACK BOX 관리자 콘솔</h1>
              <p className="text-xs text-slate-400">서버 접속자 실시간 모니터링 · 학습 데이터 현황</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onBackToGame}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            게임 화면으로 돌아가기
          </button>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-5 bg-slate-800 border-b border-slate-700 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/50 flex items-center justify-center text-indigo-300">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">
                  {statusLoading
                    ? '서버 상태 확인 중...'
                    : needsSetup
                    ? '최초 관리자 비밀번호 설정'
                    : '관리자 로그인'}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {needsSetup
                    ? '서버에 처음 접속했습니다. 관리자 대시보드 비밀번호를 설정하세요.'
                    : envConfigured
                    ? '환경 변수(ADMIN_PASSCODE)로 설정된 비밀번호를 입력하세요.'
                    : '설정한 관리자 비밀번호를 입력해 접속자 현황을 확인하세요.'}
                </p>
              </div>
            </div>

            {statusLoading ? (
              <div className="p-8 text-center text-sm text-slate-400">확인 중...</div>
            ) : (
              <form onSubmit={handleAuthSubmit} className="p-6 space-y-4">
                {authError && (
                  <div className="px-4 py-3 rounded-xl bg-rose-500/15 border border-rose-400/50 text-xs text-rose-200 font-medium">
                    {authError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    {needsSetup ? '새 관리자 비밀번호 (4~64자)' : '관리자 비밀번호'}
                  </label>
                  <input
                    type="password"
                    autoFocus
                    value={passcodeInput}
                    onChange={(e) => setPasscodeInput(e.target.value)}
                    placeholder="비밀번호 입력"
                    className="w-full bg-slate-950 border border-slate-600 focus:border-sky-400 focus:outline-none rounded-xl px-4 py-2.5 text-sm text-white"
                  />
                </div>

                {needsSetup && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      비밀번호 확인
                    </label>
                    <input
                      type="password"
                      value={confirmPasscodeInput}
                      onChange={(e) => setConfirmPasscodeInput(e.target.value)}
                      placeholder="비밀번호 다시 입력"
                      className="w-full bg-slate-950 border border-slate-600 focus:border-sky-400 focus:outline-none rounded-xl px-4 py-2.5 text-sm text-white"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authSubmitting}
                  className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-bold text-sm transition-colors"
                >
                  {authSubmitting
                    ? '처리 중...'
                    : needsSetup
                    ? '관리자 비밀번호 설정 및 입장'
                    : '관리자 페이지 입장'}
                </button>
              </form>
            )}
          </div>
        </main>
      </div>
    );
  }

  const summary = overview?.summary;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-slate-100 overflow-y-auto">
      {/* Top Bar */}
      <header className="sticky top-0 z-20 px-4 sm:px-6 py-3.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/50 flex items-center justify-center text-sky-300">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-white">BLACK BOX 관리자 대시보드</h1>
              {overview && (
                <span className="text-[11px] font-mono text-slate-400">
                  업데이트: {formatDateTime(overview.generatedAt)}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              서버에 접속한 모든 학생의 진행 상황 · 문제별 풀이 · 힌트 및 AI 대화 기록
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setAutoRefresh((v) => !v)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              autoRefresh
                ? 'bg-emerald-500/15 border-emerald-400/50 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-300'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            {autoRefresh ? '자동 새로고침 (5초)' : '자동 새로고침 꺼짐'}
          </button>

          <button
            type="button"
            onClick={() => fetchOverview(adminToken)}
            disabled={dataLoading}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${dataLoading ? 'animate-spin' : ''}`} />
            새로고침
          </button>

          <button
            type="button"
            onClick={handleDownloadCsv}
            disabled={!overview || filteredPlayers.length === 0}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 border border-slate-700 text-xs font-semibold text-sky-300 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            CSV 내보내기
          </button>

          {!confirmResetAll ? (
            <button
              type="button"
              onClick={() => setConfirmResetAll(true)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 border border-rose-500/40 text-xs font-semibold text-rose-300 flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              전체 초기화
            </button>
          ) : (
            <div className="flex items-center gap-1.5 bg-rose-500/15 border border-rose-400/60 rounded-lg px-2.5 py-1">
              <span className="text-[11px] font-semibold text-rose-200">모든 기록 삭제?</span>
              <button
                type="button"
                onClick={handleResetAll}
                className="px-2 py-0.5 rounded bg-rose-500 hover:bg-rose-400 text-slate-950 text-[11px] font-bold"
              >
                확인
              </button>
              <button
                type="button"
                onClick={() => setConfirmResetAll(false)}
                className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]"
              >
                취소
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setAdminToken(null);
              setOverview(null);
              setSelectedPlayerId(null);
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            로그아웃
          </button>

          <button
            type="button"
            onClick={onBackToGame}
            className="px-3.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            게임으로
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {dataError && (
          <div className="px-4 py-3 rounded-xl bg-rose-500/15 border border-rose-400/50 text-xs text-rose-200">
            {dataError}
          </div>
        )}

        {/* 4 Summary KPI Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>접속 학생 현황</span>
              <Users className="w-4 h-4 text-sky-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-white font-mono">
                {summary?.totalPlayers ?? 0}명
              </span>
              <span className="text-xs font-semibold text-emerald-400">
                현재 활동 {summary?.onlinePlayers ?? 0}명
              </span>
            </div>
            <div className="mt-1.5 text-[11px] text-slate-400">
              알파 {summary?.alphaPlayers ?? 0}명 · 베타 {summary?.betaPlayers ?? 0}명
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>평균 진행률 · 복구 완료</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-300 font-mono">
                {summary?.avgProgressPercent ?? 0}%
              </span>
              <span className="text-xs font-semibold text-indigo-300">
                최종 복구 {summary?.finalRestoredCount ?? 0}명
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-emerald-400 transition-all duration-300"
                style={{ width: `${summary?.avgProgressPercent ?? 0}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>팀별 합산 점수</span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <div>
                <div className="text-[11px] font-bold text-sky-400">알파 팀</div>
                <div className="text-xl font-black text-white font-mono">
                  {summary?.alphaTotalScore ?? 0}
                </div>
              </div>
              <span className="text-slate-600 font-bold">:</span>
              <div className="text-right">
                <div className="text-[11px] font-bold text-rose-400">베타 팀</div>
                <div className="text-xl font-black text-white font-mono">
                  {summary?.betaTotalScore ?? 0}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>AI 지원 · 힌트 사용</span>
              <Bot className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-3">
              <div>
                <span className="text-2xl font-black text-amber-300 font-mono">
                  {summary?.totalHintsUsed ?? 0}
                </span>
                <span className="text-xs text-slate-400 ml-1">힌트</span>
              </div>
              <span className="text-slate-700">/</span>
              <div>
                <span className="text-2xl font-black text-indigo-300 font-mono">
                  {summary?.totalAiQuestions ?? 0}
                </span>
                <span className="text-xs text-slate-400 ml-1">AI 질문</span>
              </div>
            </div>
            <div className="mt-1.5 text-[11px] text-slate-400">전체 학생 누적 학습 지원 횟수</div>
          </div>
        </section>

        {/* Sub-navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('players')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                activeTab === 'players'
                  ? 'bg-sky-500 text-slate-950'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              학생별 현황 ({overview?.players.length ?? 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('puzzles')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                activeTab === 'puzzles'
                  ? 'bg-sky-500 text-slate-950'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              문제별 정답 · 오답 통계
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('activity')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                activeTab === 'activity'
                  ? 'bg-sky-500 text-slate-950'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Activity className="w-4 h-4" />
              실시간 활동 로그 ({overview?.activityLog.length ?? 0})
            </button>
          </div>
        </div>

        {/* TAB 1: Players Table + Detail Inspector */}
        {activeTab === 'players' && (
          <section className="space-y-4">
            {/* Search & Filters */}
            <div className="flex flex-wrap items-center gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-3.5">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="닉네임 또는 플레이어 ID 검색..."
                  className="w-full bg-slate-950 border border-slate-700 focus:border-sky-400 focus:outline-none rounded-xl pl-9 pr-3 py-2 text-xs text-white"
                />
              </div>

              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value as 'all' | 'alpha' | 'beta')}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
              >
                <option value="all">전체 팀</option>
                <option value="alpha">알파 팀만</option>
                <option value="beta">베타 팀만</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'online' | 'restored')}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
              >
                <option value="all">모든 상태</option>
                <option value="online">현재 접속 중만</option>
                <option value="restored">최종 복구 완료만</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as 'updatedAt' | 'totalScore' | 'solvedCount')
                }
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
              >
                <option value="updatedAt">최근 활동순</option>
                <option value="totalScore">점수 높은순</option>
                <option value="solvedCount">해결 문제 많은순</option>
              </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
              {/* Players Table */}
              <div
                className={`bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden ${
                  selectedPlayer ? 'lg:col-span-2' : 'lg:col-span-3'
                }`}
              >
                {filteredPlayers.length === 0 ? (
                  <div className="p-10 text-center text-sm text-slate-400">
                    {overview?.players.length === 0
                      ? '아직 서버에 접속한 학생이 없습니다. 학생들이 닉네임을 입력하고 접속하면 실시간으로 표시됩니다.'
                      : '검색 조건에 일치하는 학생이 없습니다.'}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-800/80 text-slate-300 border-b border-slate-800">
                        <tr>
                          <th className="px-4 py-3 font-semibold">학생 / 상태</th>
                          <th className="px-3 py-3 font-semibold">팀</th>
                          <th className="px-3 py-3 font-semibold">현재 구역</th>
                          <th className="px-3 py-3 font-semibold">진행률</th>
                          <th className="px-3 py-3 font-semibold text-right">점수</th>
                          <th className="px-3 py-3 font-semibold text-right">힌트 / AI</th>
                          <th className="px-3 py-3 font-semibold text-right">최근 동기화</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        {filteredPlayers.map((p) => {
                          const zone = ZONES.find((z) => z.id === p.currentZoneId);
                          const hintsSum = Object.values(p.hintsUsedByPuzzle).reduce(
                            (s, n) => s + (Number(n) || 0),
                            0
                          );
                          const pct = Math.min(100, Math.round((p.solvedCount / PUZZLES.length) * 100));
                          const isSelected = p.playerId === selectedPlayerId;
                          return (
                            <tr
                              key={p.playerId}
                              onClick={() =>
                                setSelectedPlayerId(isSelected ? null : p.playerId)
                              }
                              className={`cursor-pointer transition-colors ${
                                isSelected ? 'bg-sky-500/15' : 'hover:bg-slate-800/60'
                              }`}
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`w-2 h-2 rounded-full shrink-0 ${
                                      p.isOnline ? 'bg-emerald-400' : 'bg-slate-600'
                                    }`}
                                    title={p.isOnline ? '접속 중' : '오프라인'}
                                  />
                                  <span className="font-bold text-white">{p.playerName}</span>
                                  {p.finalRestored && (
                                    <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 border border-indigo-400/50 text-[10px] font-bold text-indigo-200">
                                      복구완료
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 font-mono mt-0.5 pl-4">
                                  {p.playerId}
                                </div>
                              </td>
                              <td className="px-3 py-3">
                                <span
                                  className={`font-bold ${
                                    p.teamId === 'alpha' ? 'text-sky-400' : 'text-rose-400'
                                  }`}
                                >
                                  {p.teamId === 'alpha' ? '알파' : '베타'}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-slate-300">
                                {zone ? `${zone.shortName} ${zone.name}` : p.currentZoneId}
                              </td>
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-emerald-300">
                                    {p.solvedCount}/{PUZZLES.length} ({pct}%)
                                  </span>
                                </div>
                                <div className="mt-1 w-24 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                  <div
                                    className="h-full bg-emerald-400"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </td>
                              <td className="px-3 py-3 text-right font-mono font-bold text-sky-300">
                                {p.totalScore}점
                              </td>
                              <td className="px-3 py-3 text-right font-mono text-slate-300">
                                <span className="text-amber-300">{hintsSum}</span>
                                <span className="text-slate-600 mx-1">/</span>
                                <span className="text-indigo-300">{p.aiChatCount}</span>
                              </td>
                              <td className="px-3 py-3 text-right text-slate-400 whitespace-nowrap">
                                {formatRelativeTime(p.updatedAt)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Student Detail Drawer */}
              {selectedPlayer && (
                <div className="bg-slate-900 border border-sky-500/40 rounded-2xl overflow-hidden shadow-xl">
                  <div className="px-4 py-3.5 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-white">
                          {selectedPlayer.playerName}
                        </span>
                        <span
                          className={`text-[11px] font-bold ${
                            selectedPlayer.teamId === 'alpha' ? 'text-sky-400' : 'text-rose-400'
                          }`}
                        >
                          {selectedPlayer.teamId === 'alpha' ? '알파 팀' : '베타 팀'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {selectedPlayer.playerId}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedPlayerId(null)}
                      aria-label="상세 패널 닫기"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
                    {/* Position & Timing */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5">
                        <div className="text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-sky-400" />
                          위치 · 좌표
                        </div>
                        <div className="mt-1 font-semibold text-white">
                          {ZONES.find((z) => z.id === selectedPlayer.currentZoneId)?.name ||
                            selectedPlayer.currentZoneId}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          ({selectedPlayer.playerPosition.x}, {selectedPlayer.playerPosition.z})
                        </div>
                      </div>
                      <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5">
                        <div className="text-slate-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          남은 시간 · 접속
                        </div>
                        <div className="mt-1 font-mono font-bold text-white">
                          {formatTimer(selectedPlayer.remainingSeconds)}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          최초: {formatDateTime(selectedPlayer.firstConnectedAt)}
                        </div>
                      </div>
                    </div>

                    {/* Collected Clues */}
                    <div className="space-y-1.5">
                      <div className="font-bold text-slate-200 flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 text-indigo-400" />
                        수집한 단서 ({selectedPlayer.discoveredClueIds.length}/4)
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {CLUES.map((c) => {
                          const has = selectedPlayer.discoveredClueIds.includes(c.id);
                          return (
                            <span
                              key={c.id}
                              className={`px-2 py-1 rounded-lg border text-[11px] font-semibold ${
                                has
                                  ? 'bg-indigo-500/20 border-indigo-400/50 text-indigo-200'
                                  : 'bg-slate-950 border-slate-800 text-slate-600'
                              }`}
                            >
                              {c.code}: {has ? c.valueText : '미발견'}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Per-Puzzle Breakdown */}
                    <div className="space-y-1.5">
                      <div className="font-bold text-slate-200 flex items-center gap-1.5">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                        20개 문제별 해결 · 시도 · 힌트 현황
                      </div>
                      <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
                        {PUZZLES.map((pz) => {
                          const solved = selectedPlayer.solvedPuzzleIds.includes(pz.id);
                          const score = selectedPlayer.puzzleScores[pz.id] ?? 0;
                          const attempts = selectedPlayer.attemptsByPuzzle[pz.id] ?? 0;
                          const hints = selectedPlayer.hintsUsedByPuzzle[pz.id] ?? 0;
                          return (
                            <div
                              key={pz.id}
                              className={`px-2.5 py-1.5 rounded-lg border flex items-center justify-between gap-2 ${
                                solved
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-100'
                                  : attempts > 0 || hints > 0
                                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-100'
                                  : 'bg-slate-950 border-slate-800 text-slate-400'
                              }`}
                            >
                              <div className="min-w-0">
                                <div className="font-semibold truncate">
                                  [{pz.zoneId.toUpperCase()}] {pz.title}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  시도 {attempts}회 · 힌트 {hints}단계
                                </div>
                              </div>
                              <div className="text-right shrink-0 font-mono font-bold">
                                {solved ? `${score}점` : '미해결'}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* AI Chat Logs */}
                    <div className="space-y-1.5">
                      <div className="font-bold text-slate-200 flex items-center gap-1.5">
                        <Bot className="w-3.5 h-3.5 text-sky-400" />
                        AI 안내자 대화 기록 ({selectedPlayer.aiChatLogs.length}건)
                      </div>
                      {selectedPlayer.aiChatLogs.length === 0 ? (
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-500 text-center">
                          AI 안내자에게 질문한 기록이 없습니다.
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          {selectedPlayer.aiChatLogs.map((log, idx) => {
                            const pz = PUZZLES.find((p) => p.id === log.puzzleId);
                            return (
                              <div
                                key={`${log.puzzleId}-${log.createdAt}-${idx}`}
                                className={`p-2.5 rounded-xl border ${
                                  log.role === 'user'
                                    ? 'bg-sky-500/10 border-sky-500/30 text-sky-100'
                                    : 'bg-slate-950 border-slate-800 text-slate-300'
                                }`}
                              >
                                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                                  <span className="font-bold">
                                    {log.role === 'user' ? '학생 질문' : 'AI 안내자'} ·{' '}
                                    {pz ? pz.title : log.puzzleId}
                                  </span>
                                  <span>{formatDateTime(log.createdAt)}</span>
                                </div>
                                <p className="whitespace-pre-wrap leading-relaxed">{log.text}</p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Delete Player */}
                    <div className="pt-2 border-t border-slate-800">
                      {confirmDeleteId !== selectedPlayer.playerId ? (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(selectedPlayer.playerId)}
                          className="w-full py-2 rounded-xl bg-slate-950 hover:bg-rose-500/15 border border-rose-500/40 text-rose-300 font-semibold flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />이 학생 데이터 삭제
                        </button>
                      ) : (
                        <div className="flex items-center justify-between gap-2 bg-rose-500/15 border border-rose-400/50 rounded-xl px-3 py-2">
                          <span className="text-rose-200 font-semibold">정말 삭제할까요?</span>
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300"
                            >
                              취소
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePlayer(selectedPlayer.playerId)}
                              className="px-2.5 py-1 rounded-lg bg-rose-500 text-slate-950 font-bold"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* TAB 2: Puzzle Statistics */}
        {activeTab === 'puzzles' && (
          <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white">전체 20개 문제별 풀이 통계</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  어떤 구역과 문제에서 학생들이 힌트를 많이 사용하거나 오답을 많이 내는지 한눈에 확인합니다.
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/80 text-slate-300 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3 font-semibold">구역</th>
                    <th className="px-4 py-3 font-semibold">문제 제목</th>
                    <th className="px-3 py-3 font-semibold">유형</th>
                    <th className="px-3 py-3 font-semibold">해결 인원 · 정답률</th>
                    <th className="px-3 py-3 font-semibold text-right">총 시도 수</th>
                    <th className="px-4 py-3 font-semibold text-right">누적 힌트 사용</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {puzzleAggregates.map(({ puzzle, solvedCount, totalAttempts, totalHints, solveRate }) => {
                    const zone = ZONES.find((z) => z.id === puzzle.zoneId);
                    return (
                      <tr key={puzzle.id} className="hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-bold" style={{ color: zone?.accentHex }}>
                          {zone?.shortName}
                        </td>
                        <td className="px-4 py-3 font-semibold text-white">
                          {puzzle.title}
                          {puzzle.isBypass && (
                            <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-500/20 text-[10px] text-amber-300">
                              우회
                            </span>
                          )}
                          {puzzle.isFinalCore && (
                            <span className="ml-2 px-1.5 py-0.5 rounded bg-indigo-500/20 text-[10px] text-indigo-300">
                              최종
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-slate-400">{puzzle.category}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2 font-mono">
                            <span className="text-emerald-300 font-bold">
                              {solvedCount}/{overview?.players.length ?? 0}명 ({solveRate}%)
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-slate-300">
                          {totalAttempts}회
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-amber-300">
                          {totalHints}단계
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* TAB 3: Activity Log */}
        {activeTab === 'activity' && (
          <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800">
              <h2 className="text-sm font-bold text-white">실시간 서버 활동 타임라인</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                학생들의 접속, 문제 해결, 시스템 복구, 초기화 이벤트가 최신순으로 기록됩니다.
              </p>
            </div>
            {!overview || overview.activityLog.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-400">
                아직 기록된 활동 이벤트가 없습니다.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80 max-h-[65vh] overflow-y-auto">
                {overview.activityLog.map((evt) => (
                  <div key={evt.id} className="px-5 py-3 flex items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
                          evt.action === 'restore'
                            ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-400/50'
                            : evt.action === 'progress'
                            ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/50'
                            : evt.action === 'reset'
                            ? 'bg-rose-500/20 text-rose-200 border border-rose-400/50'
                            : 'bg-sky-500/20 text-sky-200 border border-sky-400/50'
                        }`}
                      >
                        {evt.action === 'restore'
                          ? '복구완료'
                          : evt.action === 'progress'
                          ? '문제해결'
                          : evt.action === 'reset'
                          ? '초기화'
                          : '접속'}
                      </span>
                      <span
                        className={`font-bold shrink-0 ${
                          evt.teamId === 'alpha' ? 'text-sky-400' : 'text-rose-400'
                        }`}
                      >
                        {evt.playerName}
                      </span>
                      <span className="text-slate-300 truncate">{evt.detail}</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500 shrink-0">
                      {formatDateTime(evt.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
};
