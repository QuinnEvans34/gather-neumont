/**
 * Daily question selection service.
 * Deterministically selects a question for a given date.
 */

import { getAllQuestions } from "../data/questions.store";
import type { Question } from "../../types/quiz.types";

/**
 * Simple hash function for deterministic selection.
 * Converts a date string to a number.
 */
function hashDateKey(dateKey: string): number {
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    const char = dateKey.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Get the question for a specific date.
 * Uses deterministic selection based on date hash.
 * Returns null if no questions are available.
 */
export async function getQuestionForDate(
  dateKey: string
): Promise<Question | null> {
  const questions = await getAllQuestions();

  if (questions.length === 0) {
    return null;
  }

  // Deterministic selection based on date
  const hash = hashDateKey(dateKey);
  const index = hash % questions.length;

  return questions[index];
}

/**
 * Strip correct answer fields from a question for client display.
 * Returns a safe version that doesn't reveal the answer.
 */
export function stripCorrectAnswers(
  question: Question
): Omit<Question, "correctIndex" | "correctIndices" | "acceptedAnswers"> & {
  correctIndex?: never;
  correctIndices?: never;
  acceptedAnswers?: never;
} {
  const { ...base } = question;

  // Remove answer fields based on question type
  if ("correctIndex" in base) {
    const { correctIndex, ...rest } = base;
    return rest as any;
  }
  if ("correctIndices" in base) {
    const { correctIndices, ...rest } = base;
    return rest as any;
  }
  if ("acceptedAnswers" in base) {
    const { acceptedAnswers, ...rest } = base;
    return rest as any;
  }

  return base as any;
}
