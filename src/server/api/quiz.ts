/**
 * Quiz API endpoints.
 * GET  /api/quiz/today  - Check if there's a quiz available today
 * POST /api/quiz/start  - Start today's quiz and get the question
 * POST /api/quiz/submit - Submit an answer for today's quiz
 */

import { getMountainDateKey } from "../utils/timezone";
import {
  getQuestionForDate,
  stripCorrectAnswers,
} from "../services/selection.service";
import {
  markQuizStarted,
  hasStartedQuiz,
  getGuestAttempt,
  updateGuestAttempt,
} from "../data/guest-sessions";
import { checkAnswer } from "../services/answer-checker.service";
import { calculatePoints } from "../services/scoring.service";
import type { Question } from "../../types/quiz.types";
import { getUserIdFromRequest } from "./auth";

const userCompletions = new Map<string, Set<string>>();

function hasUserCompleted(userId: string, dateKey: string): boolean {
  return userCompletions.get(userId)?.has(dateKey) ?? false;
}

function markUserCompleted(userId: string, dateKey: string): void {
  const existing = userCompletions.get(userId) ?? new Set<string>();
  existing.add(dateKey);
  userCompletions.set(userId, existing);
}

/**
 * GET /api/quiz/today
 * Returns whether there's a quiz available today.
 */
export async function handleGetToday(req: Request): Promise<Response> {
  const dateKey = getMountainDateKey();
  const question = await getQuestionForDate(dateKey);

  if (!question) {
    return Response.json({
      hasQuiz: false,
      quizDate: dateKey,
      message: "No questions available",
    });
  }

  return Response.json({
    hasQuiz: true,
    quizDate: dateKey,
    questionId: question.id,
  });
}

/**
 * POST /api/quiz/start
 * Start today's quiz and return the question (without correct answers).
 * Body: { guestToken: string } or { userId: string }
 */
export async function handleStartQuiz(req: Request): Promise<Response> {
  // Parse request body
  let body: { guestToken?: string; userId?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { guestToken, userId } = body;
  const sessionUserId = getUserIdFromRequest(req);
  const resolvedUserId = sessionUserId ?? null;
  const resolvedGuestToken = resolvedUserId ? null : guestToken?.trim();

  // For now, we only support guest sessions (userId auth comes later)
  if (!resolvedUserId && !resolvedGuestToken) {
    return Response.json(
      { error: "guestToken is required for guest sessions" },
      { status: 400 }
    );
  }

  const dateKey = getMountainDateKey();
  const question = await getQuestionForDate(dateKey);

  if (!question) {
    return Response.json(
      { error: "No quiz available today", quizDate: dateKey },
      { status: 404 }
    );
  }

  if (resolvedGuestToken) {
    const attemptData = getGuestAttempt(resolvedGuestToken, dateKey);
    if (attemptData?.solved) {
      console.log(
        `[quiz] alreadyCompleted start blocked dateKey=${dateKey} guestToken=${resolvedGuestToken}`
      );
      return Response.json({
        alreadyCompleted: true,
        quizDate: dateKey,
        message: "You already completed today's quiz.",
      });
    }
  }

  if (resolvedUserId && hasUserCompleted(resolvedUserId, dateKey)) {
    console.log(
      `[quiz] alreadyCompleted start blocked dateKey=${dateKey} userId=${resolvedUserId}`
    );
    return Response.json({
      alreadyCompleted: true,
      quizDate: dateKey,
      message: "You already completed today's quiz.",
    });
  }

  // Track that this guest/user has started the quiz
  if (resolvedGuestToken) {
    markQuizStarted(resolvedGuestToken, dateKey, question.id);
  }
  // TODO: Handle userId sessions when auth is implemented

  // Return question without correct answers
  const safeQuestion = stripCorrectAnswers(question);

  return Response.json({
    quizDate: dateKey,
    question: safeQuestion,
    alreadyStarted: resolvedGuestToken
      ? hasStartedQuiz(resolvedGuestToken, dateKey)
      : false,
  });
}

/**
 * Get correct answer info to include in successful response.
 */
function getCorrectAnswerInfo(question: Question): Record<string, unknown> {
  switch (question.type) {
    case "mcq":
      return { correctIndex: question.correctIndex };
    case "select-all":
      return { correctIndices: question.correctIndices };
    case "written":
      return { acceptedAnswers: question.acceptedAnswers };
    default:
      return {};
  }
}

/**
 * POST /api/quiz/submit
 * Submit an answer for today's quiz.
 * Body: { guestToken: string, questionId: string, answer: unknown, elapsedMs: number }
 */
export async function handleSubmitQuiz(req: Request): Promise<Response> {
  // Parse request body
  let body: {
    guestToken?: string;
    userId?: string;
    questionId: string;
    answer: unknown;
    elapsedMs: number;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { guestToken, userId, questionId, answer, elapsedMs } = body;
  const sessionUserId = getUserIdFromRequest(req);
  const resolvedUserId = sessionUserId ?? null;
  const resolvedGuestToken = resolvedUserId ? null : guestToken?.trim();

  // Validate required fields
  if (!resolvedUserId && !resolvedGuestToken) {
    return Response.json(
      { error: "guestToken is required for guest sessions" },
      { status: 400 }
    );
  }
  if (!questionId) {
    return Response.json({ error: "questionId is required" }, { status: 400 });
  }
  if (answer === undefined) {
    return Response.json({ error: "answer is required" }, { status: 400 });
  }
  if (typeof elapsedMs !== "number") {
    return Response.json(
      { error: "elapsedMs must be a number" },
      { status: 400 }
    );
  }

  // Determine quiz date at SUBMIT time (Mountain Time)
  const dateKey = getMountainDateKey();
  const todayQuestion = await getQuestionForDate(dateKey);

  if (!todayQuestion) {
    return Response.json(
      { error: "No quiz available today", quizDate: dateKey },
      { status: 404 }
    );
  }

  // Check for day rollover - if submitted questionId doesn't match today's
  if (questionId !== todayQuestion.id) {
    const safeQuestion = stripCorrectAnswers(todayQuestion);
    return Response.json({
      error: "Question has rolled over",
      rollover: true,
      quizDate: dateKey,
      newQuestion: safeQuestion,
    });
  }

  // Get current attempt state for this guest
  let attemptData = resolvedGuestToken
    ? getGuestAttempt(resolvedGuestToken, dateKey)
    : null;

  // Check if already solved
  if (attemptData?.solved) {
    console.log(
      `[quiz] alreadyCompleted submit blocked dateKey=${dateKey} guestToken=${resolvedGuestToken}`
    );
    return Response.json({
      alreadyCompleted: true,
      quizDate: dateKey,
      canRetry: false,
      message: "You already completed today's quiz.",
    });
  }

  if (resolvedUserId && hasUserCompleted(resolvedUserId, dateKey)) {
    console.log(
      `[quiz] alreadyCompleted submit blocked dateKey=${dateKey} userId=${resolvedUserId}`
    );
    return Response.json({
      alreadyCompleted: true,
      quizDate: dateKey,
      canRetry: false,
      message: "You already completed today's quiz.",
    });
  }

  // Increment attempt count
  const attemptNumber = (attemptData?.attemptCount ?? 0) + 1;

  // Check the answer
  const checkResult = checkAnswer(todayQuestion, answer);

  if (!checkResult.correct) {
    // Update attempt count in session
    if (resolvedGuestToken) {
      updateGuestAttempt(resolvedGuestToken, dateKey, {
        questionId: todayQuestion.id,
        attemptCount: attemptNumber,
        solved: false,
        solvedOnAttempt: null,
        elapsedMs: null,
      });
    }

    // Build feedback based on question type
    const feedback: Record<string, unknown> = {};
    if (todayQuestion.type === "mcq" && checkResult.selectedIndex !== undefined) {
      feedback.wrongIndex = checkResult.selectedIndex;
    }
    if (todayQuestion.type === "select-all" && checkResult.selectedIndices) {
      feedback.selectedIndices = checkResult.selectedIndices;
    }
    // For written, we don't give extra details on wrong answer

    return Response.json({
      correct: false,
      attemptNumber,
      feedback,
      quizDate: dateKey,
    });
  }

  // Correct answer!
  const pointsBreakdown = calculatePoints(
    todayQuestion.basePoints,
    attemptNumber,
    elapsedMs
  );

  // Update session with solved state
  if (resolvedGuestToken) {
    updateGuestAttempt(resolvedGuestToken, dateKey, {
      questionId: todayQuestion.id,
      attemptCount: attemptNumber,
      solved: true,
      solvedOnAttempt: attemptNumber,
      elapsedMs,
    });
  }
  if (resolvedUserId) {
    markUserCompleted(resolvedUserId, dateKey);
  }

  // Include correct answer info only on correct response
  const correctAnswerInfo = getCorrectAnswerInfo(todayQuestion);

  return Response.json({
    correct: true,
    attemptNumber,
    pointsEarned: pointsBreakdown.totalPoints,
    pointsBreakdown,
    explanation: todayQuestion.explanation,
    ...correctAnswerInfo,
    quizDate: dateKey,
  });
}

/**
 * Main quiz API router.
 * Routes requests to appropriate handlers.
 */
export async function handleQuizApi(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;

  // GET /api/quiz/today
  if (method === "GET" && path === "/api/quiz/today") {
    return handleGetToday(req);
  }

  // POST /api/quiz/start
  if (method === "POST" && path === "/api/quiz/start") {
    return handleStartQuiz(req);
  }

  // POST /api/quiz/submit
  if (method === "POST" && path === "/api/quiz/submit") {
    return handleSubmitQuiz(req);
  }

  // 404 for unknown quiz endpoints
  return Response.json(
    { error: "Not found", path },
    { status: 404 }
  );
}
