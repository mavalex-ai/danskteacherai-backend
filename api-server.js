// Backend2/api-server.js

console.log("🔥 Dansk TeacherAI backend starting...");
console.log("RUNNING FROM:", import.meta.url);

import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import { UserState } from "./adaptive/state/UserState.js";

import { handleUserStep } from "./adaptive/session/sessionController.js";

import {
  loadUserState,
  saveUserState,
  resetUserState
} from "./adaptive/persistence/stateRepository.js";

import {
  startExam,
  stopExam,
  getExamStatus
} from "./adaptive/exam/examController.js";

import {
  startDiagnostic,
  diagnosticNextStep
} from "./adaptive/diagnostic/diagnosticController.js";

import { generateTeacherReply } from "./adaptive/ai/conversationTeacher.js";

dotenv.config();

console.log("OPENAI KEY EXISTS:", !!process.env.OPENAI_API_KEY);
console.log("OPENAI PROJECT:", process.env.OPENAI_PROJECT_ID);

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
// OPENAI TEST
// =====================================================

app.get("/api/test-openai", async (req, res) => {

  try {

    const result = await generateTeacherReply({

      userId: "test-user",

      message: "Hej!",

      history: [],

      level: "B1"

    });

    res.json({

      ok: true,

      reply: result.reply

    });

  }
  catch (err) {

    console.error(err);

    res.status(500).json({

      ok: false,

      error: err.message

    });

  }

});

// =====================================================
// CONVERSATION ENDPOINT (GLOBAL LIMIT ENABLED)
// =====================================================

app.post("/api/conversation", async (req, res) => {

  try {

    const {

      userId,

      message,

      history = [],

      level = "B1"

    } = req.body;

    if (!userId) {

      return res.status(400).json({

        error: "userId required"

      });

    }

    if (!message) {

      return res.status(400).json({

        error: "message required"

      });

    }

    const result = await generateTeacherReply({

      userId,

      message,

      history,

      level

    });

    res.json(result);

  }
  catch (err) {

    console.error("Conversation error:", err);

    res.status(500).json({

      error: "Conversation failed"

    });

  }

});

// =====================================================
// DIAGNOSTIC
// =====================================================

app.post("/diagnostic/start", startDiagnostic);

app.post("/diagnostic/step", diagnosticNextStep);

// =====================================================
// EXAM CONTROL
// =====================================================

app.post("/exam/start", startExam);

app.post("/exam/stop", stopExam);

app.get("/exam/status", getExamStatus);

// =====================================================
// ADAPTIVE PIPELINE
// =====================================================

app.post("/adaptive/next-step", async (req, res) => {

  try {

    const { userId, answerMeta } = req.body;

    if (!userId) {

      return res.status(400).json({

        error: "userId required"

      });

    }

    const decision = await handleUserStep(

      userId,

      answerMeta || {}

    );

    res.json(decision);

  }
  catch (err) {

    console.error("Adaptive error:", err);

    res.status(500).json({

      error: "Adaptive decision failed"

    });

  }

});

// =====================================================
// DEV RESET USER
// =====================================================

app.get("/dev/reset-user", async (req, res) => {

  const userId = req.query.userId;

  if (!userId) {

    return res.status(400).json({

      error: "userId required"

    });

  }

  await resetUserState(userId);

  res.json({

    status: "reset",

    userId

  });

});

// =====================================================
// START SERVER
// =====================================================

const port = process.env.PORT || 3001;

app.listen(port, () => {

  console.log(`✅ Dansk TeacherAI backend running on port ${port}`);

});