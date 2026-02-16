import { loadUserState, saveUserState } from "../persistence/stateRepository.js";
import { UserState } from "../state/UserState.js";
import { evaluateDiagnosticAnswer } from "./evaluateDiagnosticAnswer.js";

export async function startDiagnostic(req, res) {

  const { userId } = req.body;

  let userState = await loadUserState(userId);

  if (!userState) {

    userState = new UserState(userId);

  }

  userState.startDiagnostic();

  await saveUserState(userState);

  res.json({ status: "diagnostic_started" });

}

export async function diagnosticNextStep(req, res) {

  const { userId, answerMeta } = req.body;

  let userState = await loadUserState(userId);

  if (!userState) {

    return res.status(400).json({ error: "Diagnostic not initialized" });

  }

  if (!userState.diagnostic.active) {

    return res.json({

      diagnosticResult: {

        level: userState.diagnostic.estimatedLevel,

        avgScore: userState.diagnostic.avgScore,

        confidence: "high"

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
        instruction: "Write 4–8 sentences about yourself in Danish."

      };

      break;

    case 2:

      task = {

        type: "production",
        level: "A2/B1",
        focus: "routine",
        instruction: "Describe your typical weekday in Danish."

      };

      break;

    case 3:

      task = {

        type: "production",
        level: "B1",
        focus: "opinion",
        instruction: "What do you think about learning Danish? Write your opinion."

      };

      break;

    case 4:

      task = {

        type: "production",
        level: "B1/B2",
        focus: "reflection",
        instruction: "Describe a challenge you experienced and how you handled it."

      };

      break;

  }

  let score = 0.5;

  if (answerMeta?.text) {

    score = await evaluateDiagnosticAnswer(task, answerMeta.text);

  }

  userState.updateFromAnswer({

    ...answerMeta,

    score

  });

  if (userState.diagnostic.stepsCompleted >= userState.diagnostic.maxSteps) {

    const scores = userState.diagnostic.scores;

    const avgScore =
      scores.reduce((a, b) => a + b, 0) / scores.length;

    let estimatedLevel;

    if (avgScore < 0.40) {

      estimatedLevel = "A2";

    }
    else if (avgScore < 0.65) {

      estimatedLevel = "PD2";

    }
    else {

      estimatedLevel = "PD3";

    }

    userState.stopDiagnostic(estimatedLevel, avgScore);

    await saveUserState(userState);

    return res.json({

      diagnosticResult: {

        level: estimatedLevel,

        avgScore,

        confidence: "high"

      },

      languageMode: "EN"

    });

  }

  await saveUserState(userState);

  res.json({

    action: "DIAGNOSTIC_STEP",

    step: currentStep,

    task,

    debugScore: score,

    languageMode: "EN"

  });

}