// Backend2/adaptive/ai/aiService.js

import { getOpenAI } from "./openaiClient.js";

/**
 * Generate AI teacher reply
 * Safe, production-ready
 *
 * Supports:
 * - sk-proj keys
 * - project-scoped authentication
 * - graceful fallback if AI unavailable
 *
 * @param {Object} params
 * @param {string} params.systemPrompt
 * @param {string} params.userMessage
 *
 * @returns {Promise<string|null>}
 */
export async function generateTeacherReply({
  systemPrompt,
  userMessage
}) {

  const openai = getOpenAI();

  // Graceful fallback if OpenAI disabled
  if (!openai) {

    console.warn("⚠️ OpenAI client unavailable");

    return null;

  }

  if (!userMessage || typeof userMessage !== "string") {

    console.warn("⚠️ Empty userMessage");

    return null;

  }

  try {

    const completion = await openai.chat.completions.create({

      model: "gpt-4o-mini",

      temperature: 0.4,

      messages: [

        {
          role: "system",
          content:
            systemPrompt ||
            "You are a professional Danish language teacher. Help the student improve their Danish."
        },

        {
          role: "user",
          content: userMessage
        }

      ]

    });

    const reply =
      completion?.choices?.[0]?.message?.content || null;

    return reply;

  }
  catch (err) {

    console.error("❌ OpenAI request failed");

    console.error(err.message);

    return null;

  }

}