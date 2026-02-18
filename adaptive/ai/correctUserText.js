import { getOpenAI } from "./openaiClient.js";

// =========================
// MAIN CORRECTION FUNCTION
// =========================

export async function correctUserText({
  text,
  level = "B1"
}) {

  const openai = getOpenAI();

  if (!openai) {

    console.error("❌ OpenAI unavailable in correctUserText");

    return null;

  }

  // Safety guard
  if (!text || typeof text !== "string" || text.trim().length < 3) {

    return null;

  }

  try {

    console.log("Correction request, key length:",
      process.env.OPENAI_API_KEY?.length
    );

    const prompt = `
You are a professional Danish language teacher.

Student level: ${level}

Student text:
"${text}"

Return JSON in this exact format:

{
  "corrected": "...corrected grammatical version...",
  "improved": "...more natural fluent version...",
  "explanation": "...short explanation in English..."
}
`;

    const response =
    await openai.chat.completions.create({

      model: "gpt-4o-mini",

      temperature: 0.2,

      messages: [

        {
          role: "system",
          content:
          "You are an expert Danish language teacher helping students improve their writing."
        },

        {
          role: "user",
          content: prompt
        }

      ],

      response_format: {
        type: "json_object"
      }

    });

    const content =
    response?.choices?.[0]?.message?.content;

    if (!content) {

      console.error("Empty correction response");

      return null;

    }

    const parsed =
    JSON.parse(content);

    return parsed;

  }

  catch (err) {

    console.error("❌ Correction error FULL:", err);

    return null;

  }

}