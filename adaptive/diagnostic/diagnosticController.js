console.log("🔥 DIAGNOSTIC CONTROLLER LOADED");

import { loadUserState, saveUserState } from "../persistence/stateRepository.js";
import { UserState } from "../state/UserState.js";
import { evaluateDiagnosticAnswer } from "./evaluateDiagnosticAnswer.js";

/**
 * START DIAGNOSTIC
 */
export async function startDiagnostic(req, res) {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  let userState = await loadUserState(userId);

  if (!userState) {
    userState = new UserState(userId);
  }

  userState.startDiagnostic();
  await saveUserState(userState);

  return res.json({ status: "diagnostic_started" });
}

/**
 * DIAGNOSTIC STEP
 */
export async function diagnosticNextStep(req, res) {
  const { userId, answerMeta } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  const userState = await loadUserState(userId);

  if (!userState || !userState.diagnostic) {
    return res.status(400).json({ error: "Diagnostic not initialized" });
  }

  // Already finished
  if (!userState.diagnostic.active) {
    return res.json({
      diagnosticResult: {
        level: userState.diagnostic.estimatedLevel || "PD2",
        confidence: "medium"
      },
      languageMode: "EN"
    });
  }

  const currentStep = userState.diagnostic.stepsCompleted + 1;

  let task;

  switch (currentStep) {
    case 1:
      task = {
        type: "production",
        level: "A2",
        focus: "personal",
        instruction:
          "Write 4–8 sentences about yourself in Danish."
      };
      break;

    case 2:
      task = {
        type: "production",
        level: "A2/B1",
        focus: "routine",
        instruction:
          "Describe your typical weekday in Danish."
      };
      break;

    case 3:
      task = {
        type: "production",
        level: "B1",
        focus: "opinion",
        instruction:
          "What do you think about learning Danish? Write your opinion."
      };
      break;

    case 4:
      task = {
        type: "production",
        level: "B1/B2",
        focus: "reflection",
        instruction:
          "Describe a challenge you experienced and how you handled it."
      };
      break;

    default:
      task = null;
  }

  // =========================
  // EVALUATE ANSWER
  // =========================

  let score = null;

 if (answerMeta?.text) {
  score = 0.9;
}

  userState.updateFromAnswer({
    ...answerMeta,
    score
  });

  // =========================
  // FINISH IF MAX STEPS
  // =========================

  if (userState.diagnostic.stepsCompleted >= userState.diagnostic.maxSteps) {

    const scores = userState.diagnostic.scores;

    const avgScore =
      scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : 0;

    let estimatedLevel;
    let confidence;

    if (avgScore < 0.4) {
      estimatedLevel = "A2";
      confidence = "medium";
    } else if (avgScore < 0.7) {
      estimatedLevel = "PD2";
      confidence = "high";
    } else {
      estimatedLevel = "PD3";
      confidence = "high";
    }

    userState.stopDiagnostic(estimatedLevel);
    await saveUserState(userState);

    return res.json({
      diagnosticResult: {
        level: estimatedLevel,
        confidence,
        avgScore // DEBUG
      },
      languageMode: "EN"
    });
  }

  await saveUserState(userState);

  return res.json({
    action: "DIAGNOSTIC_STEP",
    step: currentStep,
    task,
    debugScore: score, // DEBUG
    languageMode: "EN"
  });
}