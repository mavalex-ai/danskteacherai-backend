// Backend2/api-server.js

console.log("RUNNING FROM:", import.meta.url);

import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import { UserState } from "./adaptive/state/UserState.js";

// =========================
// SESSION / ADAPTIVE CORE
// =========================
import { handleUserStep } from "./adaptive/session/sessionController.js";

// =========================
// STATE PERSISTENCE
// =========================
import {
  loadUserState,
  saveUserState
} from "./adaptive/persistence/stateRepository.js";

// =========================
// EXAM CONTROL
// =========================
import {
  startExam,
  stopExam,
  getExamStatus
} from "./adaptive/exam/examController.js";

// =========================
// DIAGNOSTIC (FREE MODE)
// =========================
import {
  startDiagnostic,
  diagnosticNextStep
} from "./adaptive/diagnostic/diagnosticController.js";

// =========================
// AI TEACHER
// =========================
import * as aiService from "./adaptive/ai/aiService.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());


// =====================================================
// ROOT (OPTIONAL BUT NICE)
// =====================================================
app.get("/", (req, res) => {
  res.json({ status: "backend alive" });
});


// =====================================================
// HEALTH CHECK
// =====================================================
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});


// =====================================================
// 🔥 OPENAI CONNECTION TEST
// =====================================================
app.get("/api/test-openai", async (req, res) => {
  try {
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      }
    });

    const data = await response.json();

    if (!data.data) {
      return res.status(500).json({
        ok: false,
        error: data
      });
    }

    res.json({
      ok: true,
      models: data.data.slice(0, 5).map(m => m.id)
    });

  } catch (err) {
    console.error("❌ OpenAI test failed:", err);
    res.status(500).json({ error: err.message });
  }
});


// =====================================================
// EXAM CONTROL
// =====================================================
app.post("/exam/start", startExam);
app.post("/exam/stop", stopExam);
app.get("/exam/status", getExamStatus);


// =====================================================
// DIAGNOSTIC
// =====================================================
app.post("/diagnostic/start", startDiagnostic);
app.post("/diagnostic/step", diagnosticNextStep);


// =====================================================
// SET LEARNING MODE
// =====================================================
app.post("/session/set-mode", async (req, res) => {
  try {
    const { userId, mode } = req.body;

    if (!userId || !mode) {
      return res.status(400).json({ error: "userId and mode are required" });
    }

    let userState = await loadUserState(userId);
    if (!userState) userState = new UserState(userId);

    userState.setMode(mode);
    await saveUserState(userState);

    res.json({ status: "ok", mode });
  } catch (err) {
    console.error("❌ Set mode error:", err);
    res.status(500).json({ error: "Failed to set mode" });
  }
});


// =====================================================
// ADAPTIVE PIPELINE
// =====================================================
app.post("/adaptive/next-step", async (req, res) => {
  try {
    const { userId, answerMeta } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const decision = await handleUserStep(userId, answerMeta || {});
    res.json(decision);

  } catch (err) {
    console.error("❌ Adaptive error:", err);
    res.status(500).json({ error: "Adaptive decision failed" });
  }
});


// =====================================================
// SHOPIFY WEBHOOK (MOCK)
// =====================================================
app.post("/webhook/shopify", async (req, res) => {
  try {
    const { userId, event, plan } = req.body;

    if (!userId || !event) {
      return res.status(400).json({ error: "Invalid webhook payload" });
    }

    let userState = await loadUserState(userId);
    if (!userState) userState = new UserState(userId);

    if (event === "subscription_created") {
      userState.activateSubscription({
        plan,
        validUntil: Date.now() + 30 * 24 * 60 * 60 * 1000
      });
    }

    if (event === "subscription_cancelled") {
      userState.expireSubscription();
    }

    await saveUserState(userState);

    console.log("💳 Shopify mock:", event, plan);
    res.json({ status: "ok" });

  } catch (err) {
    console.error("❌ Shopify webhook error:", err);
    res.status(500).json({ error: "Webhook failed" });
  }
});


// =====================================================
// AI TEACHER CHAT
// =====================================================
app.post("/api/teacher", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    const reply = await aiService.generateTeacherReply({
      systemPrompt: "You are a friendly Danish language teacher.",
      userMessage: message
    });

    res.json({
      reply: reply || "Let’s continue without AI 🙂"
    });

  } catch (err) {
    console.error("❌ AI error:", err);
    res.status(500).json({ error: "AI request failed" });
  }
});


// =====================================================
// START SERVER
// =====================================================
const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`🚀 Backend running on port ${port}`);
});
