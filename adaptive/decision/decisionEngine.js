import { examPrepRule } from "./rules/examPrep.rules.js";
import { examProfiles } from "../exam/examProfiles.js";
import { getPD3Verdict } from "../exam/pd3.verdict.js";

/**
 * Production Adaptive Decision Engine
 */
export default function decisionEngine(userState) {

  const avgScore = userState.diagnostic?.avgScore || 0;

  // =========================
  // PD3 EXAM MODE
  // =========================

  if (userState.exam?.target === "PD3" && avgScore >= 0.65) {

    const verdict = getPD3Verdict({
      attempts: userState.exam.attempts,
      readiness: userState.exam.readiness
    });

    if (verdict.action === "PASS_PD3") {
      return {
        decision: {
          action: "PASS_PD3",
          level: "PD3",
          reason: verdict.reason,
          trace: verdict.trace
        },
        scores: { PASS_PD3: 1 },
        signals: []
      };
    }

    if (verdict.action === "FAIL_PD3") {
      return {
        decision: {
          action: "FAIL_PD3",
          level: "PD3",
          reason: verdict.reason,
          trace: verdict.trace
        },
        scores: { FAIL_PD3: 1 },
        signals: []
      };
    }

    const profile = examProfiles.PD3;
    const examSignal = examPrepRule(userState, profile);

    return {
      decision: {
        action: "TRAIN_EXAM_SKILL_PD3",
        level: "PD3",
        reason: "Preparing for PD3 exam",
        trace: ["exam_mode"]
      },
      scores: { TRAIN_EXAM_SKILL_PD3: 1 },
      signals: examSignal ? [examSignal] : []
    };
  }

  // =========================
  // STRONG PD2 → Transition Mode
  // =========================

  if (avgScore >= 0.60 && avgScore < 0.65) {
    return {
      decision: {
        action: "ADVANCE",
        level: "PD2_STRONG",
        trace: ["strong_pd2_transition"]
      },
      scores: { ADVANCE: 1 },
      signals: []
    };
  }

  // =========================
  // NORMAL PD2 LEARNING
  // =========================

  if (avgScore >= 0.40 && avgScore < 0.60) {
    return {
      decision: {
        action: "ADVANCE",
        level: "PD2",
        trace: ["pd2_progression"]
      },
      scores: { ADVANCE: 1 },
      signals: []
    };
  }

  // =========================
  // A2 REMEDIATION
  // =========================

  if (avgScore < 0.40) {
    return {
      decision: {
        action: "REINFORCE_FOUNDATION",
        level: "A2",
        trace: ["foundation_reinforcement"]
      },
      scores: { REINFORCE_FOUNDATION: 1 },
      signals: []
    };
  }

  // Fallback
  return {
    decision: {
      action: "ADVANCE",
      level: "PD2",
      trace: ["default"]
    },
    scores: { ADVANCE: 1 },
    signals: []
  };
}