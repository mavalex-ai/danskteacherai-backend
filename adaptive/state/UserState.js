export class UserState {

  constructor(userId) {

    this.userId = userId;

    // =========================
    // LANGUAGE
    // =========================

    this.uiLanguage = "EN";
    this.languageMode = "EN_FULL";

    // =========================
    // LEARNING MODE
    // =========================

    this.mode = null;

    // =========================
    // SUBSCRIPTION
    // =========================

    this.subscription = {
      active: false,
      plan: null
    };

    // =========================
    // FREE ADAPTIVE ACCESS
    // =========================

    this.freeAdaptiveStepsRemaining = 0;

    // =========================
    // USAGE
    // =========================

    this.usage = this.createFreshUsage();

    // =========================
    // DIAGNOSTIC
    // =========================

    this.diagnostic = {

      active: false,

      stepsCompleted: 0,

      maxSteps: 4,

      scores: [],

      avgScore: null,

      estimatedLevel: null

    };

    // =========================
    // EXAM TARGET
    // =========================

    this.exam = {

      target: null,

      readiness: {},

      attempts: 0

    };

    // =========================
    // SESSION
    // =========================

    this.session = {

      lastActive: Date.now()

    };

  }

  // =========================
  // USAGE
  // =========================

  createFreshUsage() {

    return {

      date: new Date().toISOString().slice(0, 10),

      voice: {
        secondsUsed: 0,
        limitSeconds: 0,
        exhausted: false
      },

      text: {
        stepsUsed: 0,
        softLimit: 30,
        reinforcementMode: false
      }

    };

  }

  ensureUsageForToday() {

    const today = new Date().toISOString().slice(0, 10);

    if (this.usage.date !== today) {

      this.usage = this.createFreshUsage();

      this.applyPlanLimits();

    }

  }

  applyPlanLimits() {

    if (!this.subscription.active) {

      this.usage.voice.limitSeconds = 0;

      return;

    }

    if (this.subscription.plan === "BASIC_20") {

      this.usage.voice.limitSeconds = 1200;

    }

    if (this.subscription.plan === "PRO_40") {

      this.usage.voice.limitSeconds = 2400;

    }

  }

  // =========================
  // DIAGNOSTIC CONTROL
  // =========================

  startDiagnostic() {

    if (!this.diagnostic) {
      this.diagnostic = {};
    }

    this.diagnostic.active = true;

    this.diagnostic.stepsCompleted = 0;

    this.diagnostic.maxSteps = 4;

    this.diagnostic.scores = [];

    this.diagnostic.avgScore = null;

    this.diagnostic.estimatedLevel = null;

    this.uiLanguage = "EN";

  }

  stopDiagnostic(level, avgScore) {

    this.diagnostic.active = false;

    this.diagnostic.estimatedLevel = level;

    this.diagnostic.avgScore = avgScore;

    this.mode = "ADAPTIVE";

    // 🎁 Give free adaptive steps
    this.freeAdaptiveStepsRemaining = 5;

    if (avgScore >= 0.65)
      this.exam.target = "PD3";
    else
      this.exam.target = "PD2";

  }

  // =========================
  // USAGE UPDATE
  // =========================

  addVoiceSeconds(seconds) {

    this.ensureUsageForToday();

    this.usage.voice.secondsUsed += seconds;

    if (this.usage.voice.secondsUsed >= this.usage.voice.limitSeconds) {

      this.usage.voice.exhausted = true;

    }

  }

  addTextStep() {

    this.ensureUsageForToday();

    this.usage.text.stepsUsed += 1;

    if (this.usage.text.stepsUsed >= this.usage.text.softLimit) {

      this.usage.text.reinforcementMode = true;

    }

  }

  // =========================
  // ANSWER UPDATE
  // =========================

  updateFromAnswer(answerMeta = {}) {

    this.session.lastActive = Date.now();

    if (this.diagnostic && this.diagnostic.active) {

      if (!this.diagnostic.scores) {
        this.diagnostic.scores = [];
      }

      if (typeof answerMeta.score === "number") {

        this.diagnostic.scores.push(answerMeta.score);

      }

      this.diagnostic.stepsCompleted += 1;

      return;

    }

    this.addTextStep();

    if (typeof answerMeta.voiceSeconds === "number") {

      this.addVoiceSeconds(answerMeta.voiceSeconds);

    }

  }

  // =========================
  // SERIALIZATION
  // =========================

  toJSON() {

    return {

      userId: this.userId,

      uiLanguage: this.uiLanguage,

      languageMode: this.languageMode,

      subscription: this.subscription,

      usage: this.usage,

      diagnostic: this.diagnostic,

      exam: this.exam,

      mode: this.mode,

      freeAdaptiveStepsRemaining: this.freeAdaptiveStepsRemaining

    };

  }

}