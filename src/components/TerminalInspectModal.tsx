import React from 'react';
import { Cpu, MapPin, Monitor, Server, ShieldAlert, Sparkles, Terminal, X } from 'lucide-react';
import { ZONES } from '../data/labLayout';
import { PUZZLES } from '../data/puzzles';
import { TerminalPlacement } from '../types/game';

interface TerminalInspectModalProps {
  puzzleId: string;
  placement?: TerminalPlacement;
  onClose: () => void;
}

const KIND_LABELS: Record<TerminalPlacement['kind'], { label: string; icon: React.ReactNode }> = {
  console: { label: '통합 제어 콘솔', icon: <Monitor className="w-5 h-5" /> },
  rack: { label: '데이터 서버 랙', icon: <Server className="w-5 h-5" /> },
  pedestal: { label: '알고리즘 실험 단말', icon: <Cpu className="w-5 h-5" /> },
  scanner: { label: '오류 격리 스캐너', icon: <ShieldAlert className="w-5 h-5" /> },
  bypass: { label: '비상 우회 터미널', icon: <Terminal className="w-5 h-5" /> },
  core: { label: 'BLACK BOX 중앙 퀀텀 코어', icon: <Sparkles className="w-5 h-5" /> },
};

export const TerminalInspectModal: React.FC<TerminalInspectModalProps> = ({
  puzzleId,
  placement,
  onClose,
}) => {
  const puzzle = PUZZLES.find((p) => p.id === puzzleId);
  const zone = ZONES.find((z) => z.id === (puzzle?.zoneId || placement?.zoneId)) || ZONES[0];
  const kindInfo = placement ? KIND_LABELS[placement.kind] : KIND_LABELS.console;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 pointer-events-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800/95 border-b border-slate-700 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 shrink-0"
              style={{ color: zone.accentHex }}
            >
              {kindInfo.icon}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="font-bold" style={{ color: zone.accentHex }}>
                  {zone.shortName} {zone.name}
                </span>
                <span aria-hidden="true">·</span>
                <span>{kindInfo.label}</span>
              </div>
              <h2 className="text-lg font-bold text-white mt-0.5 truncate">
                {puzzle?.title || '연구소 컴퓨터 터미널'}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="창 닫기"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 space-y-2">
            <div className="text-xs font-semibold text-sky-300">터미널 상태 및 정보</div>
            <p className="text-sm text-slate-200 leading-relaxed">
              {puzzle?.description ||
                '이 구역의 데이터를 관리하고 연결 상태를 점검하는 연구소 터미널입니다.'}
            </p>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs space-y-1.5 text-slate-300">
            <div className="text-slate-400">시스템 점검 로그</div>
            <div>• 구역 위치: {zone.shortName} ({zone.name})</div>
            <div>• 담당 영역: {puzzle?.category || zone.subtitle}</div>
            {placement && (
              <div className="flex items-center gap-1.5 text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  좌표: X {placement.x.toFixed(1)}m / Z {placement.z.toFixed(1)}m
                </span>
              </div>
            )}
            <div className="text-emerald-400 pt-1">• 연결 상태: 정상 작동 (자유 탐험 가능)</div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-400">
              창을 닫으면 바로 이동과 시점 조작을 이어갈 수 있습니다.
            </span>
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm transition-colors whitespace-nowrap shrink-0"
            >
              닫기 (ESC)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
