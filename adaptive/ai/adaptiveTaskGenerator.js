// Backend2/adaptive/ai/adaptiveTaskGenerator.js

/**
 * Production Adaptive Task Generator
 * Fully level-aware
 */

// =========================
// HELPERS
// =========================

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// =========================
// A2 TASKS
// =========================

const A2_TASKS = [

  {
    exam: "PD2",
    type: "production",
    level: "A2",
    focus: "self",
    instruction: "Skriv 4–6 korte sætninger om dig selv."
  },

  {
    exam: "PD2",
    type: "production",
    level: "A2",
    focus: "daily_life",
    instruction: "Beskriv din hverdag med enkle sætninger."
  },

  {
    exam: "PD2",
    type: "vocabulary",
    level: "A2",
    focus: "basic_words",
    instruction: "Skriv 5 sætninger med almindelige daglige ord."
  }

];

// =========================
// PD2 TASKS
// =========================

const PD2_TASKS = [

  {
    exam: "PD2",
    type: "production",
    level: "B1",
    focus: "daily_life",
    instruction: "Beskriv en typisk dag i dit liv."
  },

  {
    exam: "PD2",
    type: "reading",
    level: "B1",
    focus: "comprehension",
    instruction: "Læs teksten og besvar spørgsmålene."
  },

  {
    exam: "PD2",
    type: "grammar",
    level: "B1",
    focus: "verb_tense",
    instruction: "Skriv sætninger i korrekt nutid og datid."
  }

];

// =========================
// PD3 TASKS
// =========================

const PD3_TASKS = [

  {
    exam: "PD3",
    type: "argumentative",
    level: "B1",
    instruction:
      "Skriv en tekst, hvor du giver din mening om et emne."
  },

  {
    exam: "PD3",
    type: "structured",
    level: "B2",
    instruction:
      "Skriv en struktureret tekst med argumenter."
  },

  {
    exam: "PD3",
    type: "formal",
    level: "B2",
    instruction:
      "Skriv en formel tekst i arbejdssammenhæng."
  }

];

// =========================
// MAIN GENERATOR
// =========================

export async function generateAdaptiveTask({

  action,
  userLevel = "PD2",
  examTarget = "PD2"

}) {

  // =========================
  // A2 FOUNDATION
  // =========================

  if (action === "REINFORCE_FOUNDATION" || userLevel === "A2") {

    return pickRandom(A2_TASKS);

  }

  // =========================
  // PD3 MODE
  // =========================

  if (
    action === "TRAIN_EXAM_SKILL_PD3" ||
    examTarget === "PD3" ||
    userLevel === "PD3"
  ) {

    return pickRandom(PD3_TASKS);

  }

  // =========================
  // PD2 MODE
  // =========================

  if (
    action === "ADVANCE" ||
    examTarget === "PD2" ||
    userLevel === "PD2"
  ) {

    return pickRandom(PD2_TASKS);

  }

  // =========================
  // SAFE FALLBACK
  // =========================

  return pickRandom(A2_TASKS);

}