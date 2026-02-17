// Backend2/adaptive/ai/adaptiveTaskGenerator.js

/**
 * Production Adaptive Task Generator v2
 * Creates engaging, varied, exam-relevant tasks
 */

// =========================
// HELPERS
// =========================

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickDifferent(arr, lastType) {
  const filtered = arr.filter(t => t.type !== lastType);
  if (filtered.length === 0) return pickRandom(arr);
  return pickRandom(filtered);
}

// =========================
// FOUNDATION TASKS (A2)
// =========================

const FOUNDATION_TASKS = [

  {
    exam: "PD2",
    type: "guided_production",
    level: "A2",
    instruction:
      "Du møder en ny kollega. Skriv 4–6 sætninger og præsenter dig selv."
  },

  {
    exam: "PD2",
    type: "correction",
    level: "A2",
    instruction:
      "Skriv 4–5 sætninger om din hverdag. Du får bagefter en forbedret version."
  },

  {
    exam: "PD2",
    type: "conversation",
    level: "A2",
    instruction:
      "Du taler med din nabo. Skriv hvad du siger om din dag."
  }

];

// =========================
// PD2 TASKS (B1)
// =========================

const PD2_TASKS = [

  {
    exam: "PD2",
    type: "real_life_scenario",
    level: "B1",
    instruction:
      "Du skriver en besked til din chef om en ændring i din arbejdstid. Skriv beskeden."
  },

  {
    exam: "PD2",
    type: "correction",
    level: "B1",
    instruction:
      "Beskriv din arbejdsdag. Du får bagefter en mere korrekt version."
  },

  {
    exam: "PD2",
    type: "reading_response",
    level: "B1",
    instruction:
      "Læs teksten og forklar hovedideen med dine egne ord."
  },

  {
    exam: "PD2",
    type: "conversation",
    level: "B1",
    instruction:
      "Din ven spørger hvorfor du lærer dansk. Svar med 4–6 sætninger."
  }

];

// =========================
// PD3 TASKS (B1–B2)
// =========================

const PD3_TASKS = [

  {
    exam: "PD3",
    type: "argumentative",
    level: "B1",
    instruction:
      "Din arbejdsplads overvejer hjemmearbejde. Beskriv én fordel og én ulempe."
  },

  {
    exam: "PD3",
    type: "formal_email",
    level: "B2",
    instruction:
      "Skriv en formel email til en arbejdsgiver om en jobmulighed."
  },

  {
    exam: "PD3",
    type: "correction",
    level: "B2",
    instruction:
      "Skriv en tekst om din professionelle erfaring. Du får bagefter en forbedret version."
  },

  {
    exam: "PD3",
    type: "structured_argument",
    level: "B2",
    instruction:
      "Giv din mening om online arbejde vs kontorarbejde. Brug argumenter."
  },

  {
    exam: "PD3",
    type: "conversation",
    level: "B2",
    instruction:
      "Du deltager i et møde. Forklar din mening om et arbejdsemne."
  }

];

// =========================
// MAIN GENERATOR
// =========================

export async function generateAdaptiveTask({

  action,
  userLevel = "PD2",
  examTarget = "PD2",
  previousTaskType = null

}) {

  console.log("AdaptiveTaskGenerator input:", {
    action,
    userLevel,
    examTarget,
    previousTaskType
  });

  // =========================
  // FOUNDATION MODE
  // =========================

  if (
    action === "REINFORCE_FOUNDATION" ||
    userLevel === "A2"
  ) {

    const task = pickDifferent(
      FOUNDATION_TASKS,
      previousTaskType
    );

    console.log("Generated FOUNDATION task:", task.type);

    return task;
  }

  // =========================
  // PD3 MODE
  // =========================

  if (
    action === "TRAIN_EXAM_SKILL_PD3" ||
    examTarget === "PD3" ||
    userLevel === "PD3"
  ) {

    const task = pickDifferent(
      PD3_TASKS,
      previousTaskType
    );

    console.log("Generated PD3 task:", task.type);

    return task;
  }

  // =========================
  // PD2 MODE
  // =========================

  if (
    action === "ADVANCE" ||
    examTarget === "PD2" ||
    userLevel === "PD2"
  ) {

    const task = pickDifferent(
      PD2_TASKS,
      previousTaskType
    );

    console.log("Generated PD2 task:", task.type);

    return task;
  }

  // =========================
  // FALLBACK
  // =========================

  const fallback = pickRandom(FOUNDATION_TASKS);

  console.log("Generated fallback task:", fallback.type);

  return fallback;

}