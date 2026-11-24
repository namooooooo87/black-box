import React, { useEffect, useRef, useState } from 'react';
import {
  Bot,
  CheckCircle2,
  ChevronRight,
  KeyRound,
  Lightbulb,
  MessageSquare,
  RotateCcw,
  Send,
  Sparkles,
  X,
  XCircle,
} from 'lucide-react';
import { CLUES } from '../data/puzzles';
import { AiChatMessage, ClueData, PuzzleData } from '../types/game';
import { soundFX } from '../utils/sound';
import { DiagramRenderer } from './DiagramRenderer';

interface ProblemModalProps {
  puzzle: PuzzleData;
  isSolved: boolean;
  earnedScore?: number;
  hintsUsed: number;
  cachedHints: string[];
  chatMessages: AiChatMessage[];
  attemptsCount: number;
  discoveredClueIds: string[];
  onClose: () => void;
  onRequestHint: (puzzleId: string, tier: 1 | 2 | 3) => Promise<void>;
  onSendAiChat: (puzzleId: string, question: string) => Promise<void>;
  onSubmitAnswer: (puzzleId: string, userAnswer: string) => {
    correct: boolean;
    awardedPoints: number;
    unlockedDoorLabels: string[];
    newClue?: ClueData;
  };
}

export const ProblemModal: React.FC<ProblemModalProps> = ({
  puzzle,
  isSolved,
  earnedScore,
  hintsUsed,
  cachedHints,
  chatMessages,
  attemptsCount,
  discoveredClueIds,
  onClose,
  onRequestHint,
  onSendAiChat,
  onSubmitAnswer,
}) => {
  const [textInput, setTextInput] = useState('');
  const [selectedChoice, setSelectedChoice] = useState('');
  const [sequenceSelected, setSequenceSelected] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
    points?: number;
    unlockedDoors?: string[];
    newClue?: ClueData;
  } | null>(null);
  const [loadingHintTier, setLoadingHintTier] = useState<number | null>(null);
  const [showCluesPeek, setShowCluesPeek] = useState(puzzle.zoneId === 'zone5');
  const [chatInput, setChatInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setTextInput('');
    setSelectedChoice('');
    setSequenceSelected([]);
    setFeedback(null);
    setChatInput('');
    setSendingChat(false);
    setShowCluesPeek(puzzle.zoneId === 'zone5');
  }, [puzzle.id, puzzle.zoneId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [chatMessages.length]);

  const handleToggleSequenceItem = (item: string) => {
    if (isSolved) return;
    if (sequenceSelected.includes(item)) {
      setSequenceSelected((prev) => prev.filter((x) => x !== item));
    } else {
      setSequenceSelected((prev) => [...prev, item]);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSolved) return;

    let answerToSubmit = '';
    if (puzzle.inputKind === 'text') {
      answerToSubmit = textInput.trim();
    } else if (puzzle.inputKind === 'choice') {
      answerToSubmit = selectedChoice;
    } else if (puzzle.inputKind === 'sequence') {
      answerToSubmit = sequenceSelected.join(' -> ');
    }

    if (!answerToSubmit) {
      setFeedback({ type: 'error', message: '답안을 입력하거나 선택해 주세요.' });
      return;
    }

    const result = onSubmitAnswer(puzzle.id, answerToSubmit);
    if (result.correct) {
      if (puzzle.isFinalCore) {
        soundFX.playVictory();
      } else if (result.unlockedDoorLabels.length > 0) {
        soundFX.playDoorUnlock();
      } else {
        soundFX.playSolved();
      }
      setFeedback({
        type: 'success',
        message: puzzle.isFinalCore
          ? 'BLACK BOX 중앙 시스템이 완전히 복구되었습니다!'
          : '정답입니다! 시스템 데이터가 복원되었습니다.',
        points: result.awardedPoints,
        unlockedDoors: result.unlockedDoorLabels,
        newClue: result.newClue,
      });
    } else {
      soundFX.playWrong();
      setFeedback({
        type: 'error',
        message: '오답입니다. 조건과 단서를 다시 확인한 뒤 재도전해 보세요.',
      });
    }
  };

  const handleHintClick = async (tier: 1 | 2 | 3) => {
    if (loadingHintTier !== null) return;
    if (tier > hintsUsed + 1) return; // unlock progressively
    setLoadingHintTier(tier);
    soundFX.playHint();
    try {
      await onRequestHint(puzzle.id, tier);
    } finally {
      setLoadingHintTier(null);
    }
  };

  const handleSendChatQuestion = async (rawQuestion: string) => {
    const q = rawQuestion.trim();
    if (!q || sendingChat) return;
    setChatInput('');
    setSendingChat(true);
    try {
      await onSendAiChat(puzzle.id, q);
    } finally {
      setSendingChat(false);
    }
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void handleSendChatQuestion(chatInput);
  };

  const hintPenalties: Record<1 | 2 | 3, number> = { 1: 20, 2: 40, 3: 60 };
  const hintTitles: Record<1 | 2 | 3, string> = {
    1: 'HINT 1 · 문제 바라보는 방향 (-20점)',
    2: 'HINT 2 · 핵심 규칙·단서 (-40점)',
    3: 'HINT 3 · 구체적 풀이 안내 (-60점)',
  };
  const starterQuestions = [
    '이 문제를 어떤 관점으로 접근할까요?',
    '핵심 조건이나 규칙을 다시 짚어 주세요',
    '어디서부터 먼저 확인하면 좋을까요?',
  ];

  const discoveredClues = CLUES.filter((c) => discoveredClueIds.includes(c.id));

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-40 flex items-center justify-end p-4 md:p-6 bg-slate-950/55 pointer-events-auto"
    >
      <div className="w-full max-w-2xl max-h-[92vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800/90 border-b border-slate-700 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="font-semibold text-sky-400">{puzzle.zoneId.toUpperCase()}</span>
              <span aria-hidden="true">·</span>
              <span>{puzzle.category}</span>
              {puzzle.isBypass && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-amber-400 font-medium">우회 복구 단말</span>
                </>
              )}
              {isSolved && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-emerald-400 font-semibold">해결 완료 ({earnedScore ?? 0}점)</span>
                </>
              )}
            </div>
            <h2 className="text-lg font-bold text-white mt-0.5 truncate">{puzzle.title}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="문제 창 닫기"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          <p className="text-xs text-slate-400 leading-relaxed">{puzzle.description}</p>

          <div className="text-sm font-medium text-slate-100 leading-relaxed bg-slate-800/60 border border-slate-700/80 rounded-xl p-4">
            {puzzle.prompt}
          </div>

          {puzzle.diagram && <DiagramRenderer diagram={puzzle.diagram} />}

          {/* Clues Peek (helpful in Zone 5) */}
          {discoveredClues.length > 0 && (
            <div className="border border-slate-700 rounded-xl bg-slate-800/40 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowCluesPeek((v) => !v)}
                className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-indigo-300 hover:bg-slate-800 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4" />
                  수집한 단서 확인 ({discoveredClues.length}개)
                </span>
                <ChevronRight
                  className={`w-4 h-4 transition-transform ${showCluesPeek ? 'rotate-90' : ''}`}
                />
              </button>
              {showCluesPeek && (
                <div className="px-4 pb-3 pt-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {discoveredClues.map((clue) => (
                    <div
                      key={clue.id}
                      className="bg-slate-900/90 border border-slate-700 rounded-lg px-3 py-2 text-xs"
                    >
                      <div className="text-slate-400">{clue.title}</div>
                      <div className="font-mono font-bold text-indigo-300 mt-0.5">{clue.valueText}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Answer Controls */}
          {!isSolved ? (
            <form onSubmit={handleSubmit} className="space-y-3">
              {puzzle.inputKind === 'text' && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="정답을 입력하세요"
                    autoFocus
                    className="flex-1 bg-slate-950 border border-slate-600 focus:border-sky-400 focus:outline-none rounded-xl px-4 py-2.5 text-sm font-mono text-white"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm transition-colors whitespace-nowrap shrink-0"
                  >
                    정답 제출
                  </button>
                </div>
              )}

              {puzzle.inputKind === 'choice' && puzzle.options && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {puzzle.options.map((opt, idx) => {
                      const active = selectedChoice === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setSelectedChoice(opt)}
                          className={`text-left px-4 py-3 rounded-xl border text-sm transition-colors ${
                            active
                              ? 'bg-sky-500/20 border-sky-400 text-white font-semibold'
                              : 'bg-slate-800/80 border-slate-700 text-slate-200 hover:border-slate-500'
                          }`}
                        >
                          <span className="font-mono text-xs text-slate-400 mr-2">{idx + 1}.</span>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm transition-colors"
                    >
                      정답 제출
                    </button>
                  </div>
                </div>
              )}

              {puzzle.inputKind === 'sequence' && puzzle.sequencePool && (
                <div className="space-y-3">
                  <div className="bg-slate-950 border border-slate-700 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-400">선택한 순서 (클릭해 순서대로 배치)</span>
                      <button
                        type="button"
                        onClick={() => setSequenceSelected([])}
                        className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        초기화
                      </button>
                    </div>
                    {sequenceSelected.length === 0 ? (
                      <div className="text-xs text-slate-500 py-2">
                        아래 블록을 순서대로 클릭하세요.
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        {sequenceSelected.map((item, idx) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => handleToggleSequenceItem(item)}
                            className="px-3 py-1.5 rounded-lg bg-sky-500/20 border border-sky-400/60 text-xs font-medium text-sky-200 hover:bg-sky-500/30"
                          >
                            {idx + 1}. {item}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {puzzle.sequencePool.map((item) => {
                      const picked = sequenceSelected.includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          disabled={picked}
                          onClick={() => handleToggleSequenceItem(item)}
                          className={`px-3.5 py-2 rounded-xl border text-xs font-medium transition-colors ${
                            picked
                              ? 'bg-slate-800/40 border-slate-800 text-slate-500 cursor-not-allowed'
                              : 'bg-slate-800 border-slate-600 text-slate-100 hover:border-sky-400'
                          }`}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm transition-colors"
                    >
                      순서 제출
                    </button>
                  </div>
                </div>
              )}
            </form>
          ) : feedback?.type !== 'success' ? (
            /* Review mode for previously solved puzzle */
            <div className="bg-emerald-500/10 border border-emerald-500/40 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                해결 완료된 터미널입니다 (획득 점수: {earnedScore ?? 100}점)
              </div>
              <div className="text-xs text-slate-200">
                <span className="text-slate-400">정답: </span>
                <span className="font-mono font-semibold text-emerald-300">{puzzle.answer}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed pt-1">{puzzle.explanation}</p>
            </div>
          ) : null}

          {/* Immediate Submission Feedback */}
          {feedback && (
            <div
              className={`rounded-xl p-4 border space-y-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-500/15 border-emerald-400/60 text-emerald-100'
                  : 'bg-rose-500/15 border-rose-400/60 text-rose-200'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  {feedback.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  )}
                  <span>{feedback.message}</span>
                </div>
                {feedback.type === 'error' && attemptsCount > 0 && (
                  <span className="text-[11px] font-mono text-rose-300 shrink-0">
                    재도전 가능 · 시도 {attemptsCount}회
                  </span>
                )}
              </div>

              {feedback.type === 'success' && (
                <div className="text-xs space-y-1.5 text-emerald-100 pt-1">
                  <div>
                    <span className="text-emerald-300/80">정답: </span>
                    <span className="font-mono font-bold text-white">{puzzle.answer}</span>
                  </div>
                  <p className="text-slate-200 leading-relaxed bg-slate-900/50 border border-emerald-500/30 rounded-lg px-3 py-2">
                    <span className="font-semibold text-emerald-300 mr-1.5">해설:</span>
                    {puzzle.explanation}
                  </p>
                  <div className="text-emerald-200">
                    획득 점수: <span className="font-mono font-bold tabular-nums">+{feedback.points}점</span>
                    {attemptsCount === 1 && ' (최초 시도 정답 보너스 +20점 포함)'}
                  </div>
                  {feedback.newClue && (
                    <div className="text-indigo-200 font-semibold">
                      단서 저장 완료: [{feedback.newClue.title}] → {feedback.newClue.valueText}
                    </div>
                  )}
                  {feedback.unlockedDoors && feedback.unlockedDoors.length > 0 && (
                    <div className="text-amber-200 font-semibold">
                      보안 문 개방됨: {feedback.unlockedDoors.join(', ')}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 3-Tier AI Hint System */}
          <div className="border-t border-slate-800 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                <Sparkles className="w-4 h-4" />
                <span>AI 단계별 힌트 (무제한 사용 가능 · 사용 단계별 추가 점수 차감)</span>
              </div>
              <span className="text-[11px] text-slate-400 tabular-nums">
                현재 차감: -{hintsUsed === 0 ? 0 : hintPenalties[hintsUsed as 1 | 2 | 3]}점
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {([1, 2, 3] as const).map((tier) => {
                const isRevealed = hintsUsed >= tier;
                const isNext = tier === hintsUsed + 1;
                const locked = tier > hintsUsed + 1;
                const isLoading = loadingHintTier === tier;

                return (
                  <button
                    key={tier}
                    type="button"
                    disabled={locked || isRevealed || isLoading}
                    onClick={() => handleHintClick(tier)}
                    className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                      isRevealed
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                        : isNext
                        ? 'bg-slate-800 border-amber-400/70 text-amber-300 hover:bg-slate-700'
                        : 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    <Lightbulb className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">
                      {isLoading
                        ? '생성 중...'
                        : isRevealed
                        ? `HINT ${tier} · 확인됨`
                        : `HINT ${tier} (-${hintPenalties[tier]})`}
                    </span>
                  </button>
                );
              })}
            </div>

            {hintsUsed > 0 && (
              <div className="space-y-2">
                {Array.from({ length: hintsUsed }).map((_, idx) => {
                  const tier = (idx + 1) as 1 | 2 | 3;
                  const hintText = cachedHints[idx] || puzzle.hints[idx];
                  return (
                    <div
                      key={tier}
                      className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 text-xs space-y-1"
                    >
                      <div className="font-semibold text-amber-300">{hintTitles[tier]}</div>
                      <p className="text-slate-200 leading-relaxed">{hintText}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Socratic AI Guide Chat */}
          <div className="border-t border-slate-800 pt-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-sky-300">
                <Bot className="w-4 h-4 shrink-0" />
                <span>AI 안내자 1:1 질문하기</span>
              </div>
              <span className="text-[11px] text-slate-400">
                정답 대신 스스로 생각할 수 있는 방향을 안내해요
              </span>
            </div>

            {chatMessages.length === 0 ? (
              <div className="bg-slate-800/50 border border-slate-700/80 rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
                  <MessageSquare className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span>막히는 부분이나 궁금한 조건을 AI 안내자에게 직접 질문해 보세요.</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {starterQuestions.map((q) => (
                    <button
                      key={q}
                      type="button"
                      disabled={sendingChat}
                      onClick={() => handleSendChatQuestion(q)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-700 border border-slate-700 text-[11px] text-sky-200 transition-colors text-left"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 max-h-52 overflow-y-auto space-y-2.5">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-xl px-3 py-2 text-xs whitespace-pre-wrap leading-relaxed border ${
                        msg.role === 'user'
                          ? 'bg-sky-500/20 border-sky-400/40 text-sky-100'
                          : 'bg-slate-800/90 border-slate-700 text-slate-200'
                      }`}
                    >
                      {msg.role === 'assistant' && (
                        <div className="text-[10px] font-semibold mb-1 text-sky-300 flex items-center gap-1.5">
                          <span>AI 안내자</span>
                          <span className="text-slate-500">·</span>
                          <span className={msg.source === 'fallback' ? 'text-amber-300' : 'text-emerald-300'}>
                            {msg.source === 'fallback' ? '저장된 기본 힌트' : 'Gemini AI'}
                          </span>
                        </div>
                      )}
                      {msg.text}
                    </div>
                  </div>
                ))}
                {sendingChat && (
                  <div className="text-[11px] text-slate-400 px-1">AI 안내자가 생각할 거리를 정리 중입니다...</div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}

            <form onSubmit={handleChatSubmit} className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                maxLength={300}
                disabled={sendingChat}
                placeholder="궁금한 점을 질문해 보세요 (예: 왜 이 조건이 필요한가요?)"
                className="flex-1 bg-slate-950 border border-slate-700 focus:border-sky-400 focus:outline-none rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500"
              />
              <button
                type="submit"
                disabled={sendingChat || !chatInput.trim()}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 border border-sky-400/50 text-sky-200 font-semibold text-xs flex items-center gap-1.5 shrink-0 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sendingChat ? '답변 중...' : '질문하기'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
