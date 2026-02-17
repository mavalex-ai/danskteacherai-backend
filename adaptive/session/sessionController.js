// Backend2/adaptive/session/sessionController.js

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

    console.log("Creating new UserState:", userId);

    userState = new UserState(userId);

  }

  userState.ensureUsageForToday();

  return userState;

}


// =========================
// MAIN ADAPTIVE STEP
// =========================

async function handleUserStep(userId, answerMeta = {}) {

  if (!userId) {
    throw new Error("userId required");
  }

  const userState = await getUserState(userId);

  console.log("Adaptive step for user:", userId);
  console.log("Answer meta:", answerMeta);


  // =========================
  // PAYWALL ENFORCEMENT
  // =========================

  if (
    !userState.diagnostic?.active &&
    !userState.subscription?.active &&
    userState.usage.text.stepsUsed >= 5
  ) {

    console.log("Paywall triggered");

    return {
      action: "PAYWALL",
      reason: "FREE_LIMIT_REACHED",
      languageMode: userState.languageMode
    };

  }


  // =========================
  // UPDATE USAGE
  // =========================

  userState.updateFromAnswer(answerMeta);


  // =========================
  // AI TEXT CORRECTION
  // =========================

  let correction = null;

  if (
    typeof answerMeta.answer === "string" &&
    answerMeta.answer.length > 10
  ) {

    console.log("Running AI correction...");

    try {

      correction = await correctUserText({

        text: answerMeta.answer,

        level: userState.exam.target || "B1"

      });

      console.log("Correction result:", correction);

    }
    catch (err) {

      console.error("Correction failed:", err);

    }

  }


  // =========================
  // PD3 SCORING (EXAM MODE)
  // =========================

  let examinerFeedback = null;
  let examProgress = null;

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

    if (
      verdict.action === "PASS_PD3" ||
      verdict.action === "FAIL_PD3"
    ) {

      userState.languageMode = calculateLanguageMode(userState);

      await saveUserState(userState);

      return {

        ...verdict,

        explanation: await explainDecision({

          decision: verdict,
          signals: []

        }),

        examProgress,

        correction,

        languageMode: userState.languageMode

      };

    }

  }


  // =========================
  // EXPLANATION
  // =========================

  const explanation = await explainDecision({

    decision: result.decision,
    signals: result.signals

  });


  // =========================
  // TASK GENERATION
  // =========================

  let task = null;

  task = await generateAdaptiveTask({

    action: result.decision.action,

    userLevel: userState.exam.target || "PD2",

    examTarget: userState.exam.target || "PD2"

  });


  console.log("Generated task:", task);


  // =========================
  // LANGUAGE MODE UPDATE
  // =========================

  userState.languageMode = calculateLanguageMode(userState);


  // =========================
  // SAVE STATE
  // =========================

  await saveUserState(userState);


  // =========================
  // FINAL RESPONSE
  // =========================

  return {

    ...result.decision,

    explanation,

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


// =========================
// EXPORT
// =========================

export {

  handleUserStep

};