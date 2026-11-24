import { PuzzleData } from '../types/game';

export interface GradeResult {
  correct: boolean;
  normalizedUser: string;
  expectedAnswer: string;
}

export function normalizeAnswer(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function gradePuzzleAnswer(puzzle: PuzzleData, userAnswer: string): GradeResult {
  const normalizedUser = normalizeAnswer(userAnswer);
  if (!normalizedUser) {
    return {
      correct: false,
      normalizedUser,
      expectedAnswer: puzzle.answer,
    };
  }

  const validAnswers =
    puzzle.acceptedAnswers && puzzle.acceptedAnswers.length > 0
      ? puzzle.acceptedAnswers.map(normalizeAnswer)
      : [normalizeAnswer(puzzle.answer)];

  return {
    correct: validAnswers.includes(normalizedUser),
    normalizedUser,
    expectedAnswer: puzzle.answer,
  };
}

export function calculatePuzzleScore(params: {
  hintsUsed: number;
  prevAttempts: number;
  isFinalCore?: boolean;
}): number {
  const { hintsUsed, prevAttempts, isFinalCore } = params;
  const hintPenalty = hintsUsed === 1 ? 20 : hintsUsed === 2 ? 40 : hintsUsed >= 3 ? 60 : 0;
  const firstTryBonus = prevAttempts === 0 ? 20 : 0;
  const finalBonus = isFinalCore ? 200 : 0;
  return Math.max(0, 100 - hintPenalty + firstTryBonus + finalBonus);
}
