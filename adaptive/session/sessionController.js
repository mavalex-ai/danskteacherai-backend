import { UserState } from "../state/index.js";
import decisionEngine from "../decision/decisionEngine.js";

import { generateAdaptiveTask } from "../ai/adaptiveTaskGenerator.js";
import { explainDecision } from "../ai/adaptiveReasoning.js";

import {
  loadUserState,
  saveUserState
} from "../persistence/stateRepository.js";

import { logDecision } from "../analytics/decisionLogger.js";

import evaluatePD3Answer from "../exam/pd3.scoring.js";
import { getPD3Verdict } from "../exam/pd3.verdict.js";

import { calculateLanguageMode } from "../language/languageMode.js";


async function getUserState(userId) {

  let userState = await loadUserState(userId);

  if (!userState) {

    return new UserState(userId);

  }

  userState.ensureUsageForToday();

  return userState;

}


async function handleUserStep(userId, answerMeta = {}) {

  if (!userId) throw new Error("userId required");

  const userState = await getUserState(userId);


  // =========================
  // PAYWALL ENFORCEMENT
  // =========================

  if (
    !userState.diagnostic?.active &&
    !userState.subscription?.active &&
    userState.freeAdaptiveStepsRemaining <= 0
  ) {

    return {
      action: "PAYWALL",
      reason: "FREE_LIMIT_REACHED",
      languageMode: userState.languageMode
    };

  }


  // =========================
  // CONSUME FREE STEP
  // =========================

  if (
    !userState.subscription?.active &&
    userState.freeAdaptiveStepsRemaining > 0
  ) {

    userState.freeAdaptiveStepsRemaining -= 1;

  }


  // =========================
  // UPDATE USAGE
  // =========================

  userState.updateFromAnswer(answerMeta);


  let examinerFeedback = null;
  let examProgress = null;


  // =========================
  // PD3 SCORING
  // =========================

  if (
    userState.exam.target === "PD3" &&
    typeof answerMeta.answer === "string" &&
    answerMeta.task
  ) {

    const scoring = evaluatePD3Answer({
      answer: answerMeta.answer,
      task: answerMeta.task
    });

    userState.exam.readiness = {
      total: scoring.total,
      breakdown: scoring.breakdown
    };

    examProgress = {
      attempts: userState.exam.attempts,
      readiness: userState.exam.readiness
    };

    examinerFeedback = scoring.feedback;

  }


  // =========================
  // DECISION ENGINE
  // =========================

  const result = decisionEngine(userState.toJSON());

  logDecision({
    userId,
    decision: result.decision,
    scores: result.scores,
    signals: result.signals,
    trace: result.decision.trace
  });


  // =========================
  // FINAL EXAM VERDICT
  // =========================

  if (userState.exam.target === "PD3" && examProgress) {

    const verdict = getPD3Verdict({
      readiness: examProgress.readiness,
      attempts: examProgress.attempts
    });

    if (verdict.action === "PASS_PD3" || verdict.action === "FAIL_PD3") {

      userState.languageMode = calculateLanguageMode(userState);

      await saveUserState(userState);

      return {
        ...verdict,
        explanation: await explainDecision({
          decision: verdict,
          signals: []
        }),
        examProgress,
        languageMode: userState.languageMode
      };

    }

  }


  // =========================
  // TASK GENERATION
  // =========================

  let task = null;

  if (!examinerFeedback) {

    const adaptiveLevel =
  userState.diagnostic?.estimatedLevel ||
  userState.exam?.target ||
  "PD2";

task = await generateAdaptiveTask({
  action: result.decision.action,
  examTarget: adaptiveLevel,
  userLevel: adaptiveLevel
});

  }


  userState.languageMode = calculateLanguageMode(userState);

  await saveUserState(userState);


  return {

    ...result.decision,

    task,

    examinerFeedback,

    examProgress,

    languageMode: userState.languageMode,

    usage: userState.usage,

    freeStepsRemaining: userState.freeAdaptiveStepsRemaining

  };

}


export { handleUserStep };