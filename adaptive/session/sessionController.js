import { UserState } from "../state/index.js";
import decisionEngine from "../decision/decisionEngine.js";

import { generateAdaptiveTask } from "../ai/adaptiveTaskGenerator.js";
import { explainDecision } from "../ai/adaptiveReasoning.js";
import { correctUserText } from "../ai/correctUserText.js";

import {
  loadUserState,
  saveUserState
} from "../persistence/stateRepository.js";

import { logDecision } from "../analytics/decisionLogger.js";

import evaluatePD3Answer from "../exam/pd3.scoring.js";
import { getPD3Verdict } from "../exam/pd3.verdict.js";

import { calculateLanguageMode } from "../language/languageMode.js";


// =========================
// LOAD USER STATE
// =========================

async function getUserState(userId) {

  let userState = await loadUserState(userId);

  if (!userState) {
    userState = new UserState(userId);
  }

  userState.ensureUsageForToday();

  return userState;

}


// =========================
// MAIN STEP
// =========================

async function handleUserStep(userId, answerMeta = {}) {

  if (!userId) {
    throw new Error("userId required");
  }

  const userState = await getUserState(userId);

  // normalize answer field (FIX)
  const userText =
    answerMeta.answer ||
    answerMeta.text ||
    null;


  // =========================
  // PAYWALL
  // =========================

  if (
    !userState.diagnostic?.active &&
    !userState.subscription?.active &&
    userState.usage.text.stepsUsed >= 5
  ) {

    return {
      action: "PAYWALL",
      reason: "FREE_LIMIT_REACHED",
      languageMode: userState.languageMode
    };

  }


  // =========================
  // UPDATE USAGE
  // =========================

  userState.updateFromAnswer({
    ...answerMeta,
    answer: userText
  });


  // =========================
  // AI CORRECTION (FIXED)
  // =========================

  let correction = null;

  if (
    typeof userText === "string" &&
    userText.length > 10
  ) {

    console.log("Running correction on:", userText.substring(0, 50));

    try {

      correction = await correctUserText({

        text: userText,
        level: userState.exam.target || "B1"

      });

      console.log("Correction success");

    }
    catch (err) {

      console.error("Correction error:", err);

    }

  }


  // =========================
  // EXAM SCORING
  // =========================

  let examinerFeedback = null;
  let examProgress = null;

  if (
    userState.exam.target === "PD3" &&
    typeof userText === "string" &&
    answerMeta.task
  ) {

    const scoring = evaluatePD3Answer({

      answer: userText,
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
  // GENERATE TASK
  // =========================

  const task = await generateAdaptiveTask({

    action: result.decision.action,

    userLevel: userState.exam.target || "PD2",

    examTarget: userState.exam.target || "PD2"

  });


  // =========================
  // UPDATE LANGUAGE MODE
  // =========================

  userState.languageMode = calculateLanguageMode(userState);


  // =========================
  // SAVE
  // =========================

  await saveUserState(userState);


  // =========================
  // RESPONSE
  // =========================

  return {

    ...result.decision,

    explanation: await explainDecision({
      decision: result.decision,
      signals: result.signals
    }),

    task,

    examProgress,

    examinerFeedback,

    correction,

    languageMode: userState.languageMode,

    usage: userState.usage,

    freeStepsRemaining: Math.max(
      0,
      5 - userState.usage.text.stepsUsed
    )

  };

}


export {
  handleUserStep
};