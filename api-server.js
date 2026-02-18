import dotenv from "dotenv";
dotenv.config();

console.log("🔥 NEW DIAGNOSTIC CONTROLLER ACTIVE");
console.log("RUNNING FROM:", import.meta.url);

console.log("OPENAI KEY EXISTS:", !!process.env.OPENAI_API_KEY);
console.log("OPENAI KEY LENGTH:", process.env.OPENAI_API_KEY?.length);
console.log("OPENAI PROJECT:", process.env.OPENAI_PROJECT_ID);

import express from "express";
import cors from "cors";

import { UserState } from "./adaptive/state/UserState.js";

// =========================
// SESSION / ADAPTIVE CORE
// =========================

import { handleUserStep }
from "./adaptive/session/sessionController.js";

// =========================
// STATE PERSISTENCE
// =========================

import {

  loadUserState,
  saveUserState,
  resetUserState

}
from "./adaptive/persistence/stateRepository.js";

// =========================
// EXAM CONTROL
// =========================

import {

  startExam,
  stopExam,
  getExamStatus

}
from "./adaptive/exam/examController.js";

// =========================
// DIAGNOSTIC
// =========================

import {

  startDiagnostic,
  diagnosticNextStep

}
from "./adaptive/diagnostic/diagnosticController.js";

// =========================
// AI SERVICES
// =========================

import * as aiService
from "./adaptive/ai/aiService.js";

import {

  generateTeacherReply

}
from "./adaptive/ai/conversationTeacher.js";

// =========================
// INIT EXPRESS
// =========================

const app = express();

app.use(cors());

app.use(express.json({

  limit: "2mb"

}));

// =====================================================
// HEALTH CHECK
// =====================================================

app.get("/health", (req, res) => {

  res.json({

    status: "ok",

    timestamp: Date.now()

  });

});

// =====================================================
// ENV DEBUG
// =====================================================

app.get("/debug/env", (req, res) => {

  const key = process.env.OPENAI_API_KEY;

  res.json({

    hasKey: !!key,

    keyLength: key ? key.length : 0,

    keyPrefix: key ? key.substring(0, 7) : null,

    project: process.env.OPENAI_PROJECT_ID

  });

});

// =====================================================
// DEV RESET USER
// =====================================================

app.get("/dev/reset-user", async (req, res) => {

  try {

    const userId = req.query.userId || "test-user";

    await resetUserState(userId);

    res.json({

      status: "user_reset_done",

      userId

    });

  }

  catch (err) {

    console.error("Reset error:", err);

    res.status(500).json({

      error: "Reset failed"

    });

  }

});

// =====================================================
// OPENAI TEST
// =====================================================

app.get("/api/test-openai", async (req, res) => {

  try {

    const reply =
    await generateTeacherReply({

      message: "Sig OK",

      history: [],

      level: "B1"

    });

    res.json({

      ok: true,

      reply

    });

  }

  catch (err) {

    console.error("OpenAI test failed:", err);

    res.status(500).json({

      ok: false,

      error: err.message

    });

  }

});

// =====================================================
// CONVERSATION ENDPOINT
// =====================================================

app.post("/api/conversation", async (req, res) => {

  try {

    const {

      message,
      history = [],
      level = "B1"

    } = req.body;

    if (!message) {

      return res.status(400).json({

        error: "message is required"

      });

    }

    const reply =
    await generateTeacherReply({

      message,
      history,
      level

    });

    res.json({

      reply

    });

  }

  catch (err) {

    console.error("Conversation error:", err);

    res.status(500).json({

      error: err.message

    });

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
// SET MODE
// =====================================================

app.post("/session/set-mode", async (req, res) => {

  try {

    const { userId, mode } = req.body;

    if (!userId || !mode) {

      return res.status(400).json({

        error: "userId and mode required"

      });

    }

    let userState =
    await loadUserState(userId);

    if (!userState) {

      userState =
      new UserState(userId);

    }

    userState.mode = mode;

    await saveUserState(userState);

    res.json({

      status: "ok",

      mode

    });

  }

  catch (err) {

    console.error("Set mode error:", err);

    res.status(500).json({

      error: err.message

    });

  }

});

// =====================================================
// ADAPTIVE PIPELINE
// =====================================================

app.post("/adaptive/next-step", async (req, res) => {

  try {

    const {

      userId,
      answerMeta

    } = req.body;

    if (!userId) {

      return res.status(400).json({

        error: "userId required"

      });

    }

    const decision =
    await handleUserStep(

      userId,

      answerMeta || {}

    );

    res.json(decision);

  }

  catch (err) {

    console.error("Adaptive error:", err);

    res.status(500).json({

      error: err.message

    });

  }

});

// =====================================================
// START SERVER
// =====================================================

const port =
process.env.PORT || 3001;

app.listen(port, () => {

  console.log(
    `Dansk TeacherAI backend running on port ${port}`
  );

});