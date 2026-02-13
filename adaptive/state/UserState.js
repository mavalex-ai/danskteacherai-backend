export class UserState {
  constructor(userId) {
    this.userId = userId;

    // =========================
    // UI / LANGUAGE
    // =========================
    this.uiLanguage = "EN"; // EN | DA
    this.languageMode = "EN_FULL"; // EN_FULL | EN_DA | DA_ONLY

    // =========================
    // LEARNING MODE
    // =========================
    this.mode = null;

    // =========================
    // SUBSCRIPTION
    // =========================
    this.subscription = {
      active: false,
      plan: null // BASIC_20 | PRO_40
    };

    // =========================
    // DAILY USAGE (HYBRID CORE)
    // =========================
    this.usage = this.createFreshUsage();

    // =========================
    // DIAGNOSTIC MODE
    // =========================
    this.diagnostic = {
      active: false,
      stepsCompleted: 0,
      maxSteps: 4, // ← ВАЖНО: теперь строго 4 шага
      estimatedLevel: null
    };

    // =========================
    // EXAM
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
  // USAGE HELPERS
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
  // DIAGNOSTIC
  // =========================
  startDiagnostic() {
    this.diagnostic.active = true;
    this.diagnostic.stepsCompleted = 0;
    this.diagnostic.estimatedLevel = null;
    this.uiLanguage = "EN";
  }

  stopDiagnostic(level) {
    this.diagnostic.active = false;
    this.diagnostic.estimatedLevel = level;
  }

  // =========================
  // SUBSCRIPTION CONTROL
  // =========================
  activateSubscription(plan) {
    this.subscription.active = true;
    this.subscription.plan = plan;
    this.applyPlanLimits();
  }

  cancelSubscription() {
    this.subscription.active = false;
    this.subscription.plan = null;
    this.applyPlanLimits();
  }

  // =========================
  // USAGE UPDATES
  // =========================
  addVoiceSeconds(seconds) {
    this.ensureUsageForToday();

    this.usage.voice.secondsUsed += seconds;

    if (
      this.usage.voice.secondsUsed >=
      this.usage.voice.limitSeconds
    ) {
      this.usage.voice.exhausted = true;
    }
  }

  addTextStep() {
    this.ensureUsageForToday();

    this.usage.text.stepsUsed += 1;

    if (
      this.usage.text.stepsUsed >=
      this.usage.text.softLimit
    ) {
      this.usage.text.reinforcementMode = true;
    }
  }

  // =========================
  // GENERIC ANSWER UPDATE
  // =========================
  updateFromAnswer(answerMeta = {}) {
    this.session.lastActive = Date.now();

    if (this.diagnostic.active) {
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
      exam: this.exam
    };
  }
}