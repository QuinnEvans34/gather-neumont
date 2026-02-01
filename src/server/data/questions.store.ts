/**
 * Questions store module - read/list operations for quiz questions.
 * Admin CRUD operations will be added in a later commit.
 */

import type { Question, QuestionsFile } from "../../types/quiz.types";
import { readJsonFile, getDataPath } from "./store";

const QUESTIONS_FILE = "questions.json";

/**
 * Get all questions from the store
 */
export async function getAllQuestions(): Promise<Question[]> {
  const filepath = getDataPath(QUESTIONS_FILE);
  const data = await readJsonFile<QuestionsFile>(filepath);
  return data?.questions ?? [];
}

/**
 * Get a single question by ID
 */
export async function getQuestionById(
  id: string
): Promise<Question | undefined> {
  const questions = await getAllQuestions();
  return questions.find((q) => q.id === id);
}

/**
 * Get questions by tag
 */
export async function getQuestionsByTag(tag: string): Promise<Question[]> {
  const questions = await getAllQuestions();
  return questions.filter((q) => q.tags?.includes(tag));
}

/**
 * Get questions by difficulty
 */
export async function getQuestionsByDifficulty(
  difficulty: 1 | 2 | 3
): Promise<Question[]> {
  const questions = await getAllQuestions();
  return questions.filter((q) => q.difficulty === difficulty);
}

/**
 * Get the total count of questions
 */
export async function getQuestionCount(): Promise<number> {
  const questions = await getAllQuestions();
  return questions.length;
}
