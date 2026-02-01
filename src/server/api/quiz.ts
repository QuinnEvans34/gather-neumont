/**
 * Quiz API endpoints.
 * GET  /api/quiz/today  - Check if there's a quiz available today
 * POST /api/quiz/start  - Start today's quiz and get the question
 */

import { getMountainDateKey } from "../utils/timezone";
import {
  getQuestionForDate,
  stripCorrectAnswers,
} from "../services/selection.service";
import { markQuizStarted, hasStartedQuiz } from "../data/guest-sessions";

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

  // For now, we only support guest sessions (userId auth comes later)
  if (!guestToken && !userId) {
    return Response.json(
      { error: "Must provide guestToken or userId" },
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

  // Track that this guest/user has started the quiz
  if (guestToken) {
    markQuizStarted(guestToken, dateKey, question.id);
  }
  // TODO: Handle userId sessions when auth is implemented

  // Return question without correct answers
  const safeQuestion = stripCorrectAnswers(question);

  return Response.json({
    quizDate: dateKey,
    question: safeQuestion,
    alreadyStarted: guestToken
      ? hasStartedQuiz(guestToken, dateKey)
      : false,
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

  // 404 for unknown quiz endpoints
  return Response.json(
    { error: "Not found", path },
    { status: 404 }
  );
}
