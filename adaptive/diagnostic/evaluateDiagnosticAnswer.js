import { getOpenAI } from "../ai/openaiClient.js";

export async function evaluateDiagnosticAnswer({

  question,
  userAnswer,
  expectedLevel = "B1"

}) {

  const openai = getOpenAI();

  if (!openai) {

    console.error("❌ OpenAI unavailable in diagnostic");

    return null;

  }

  try {

    const prompt = `
You are a Danish language examiner.

Expected level: ${expectedLevel}

Question:
${question}

Student answer:
${userAnswer}

Return JSON:

{
  "level": "A1 | A2 | B1 | B2 | C1",
  "score": number,
  "feedback": "short explanation"
}
`;

    const response =
    await openai.chat.completions.create({

      model: "gpt-4o-mini",

      temperature: 0.2,

      messages: [

        {
          role: "system",
          content: "You are a professional Danish examiner."
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

    return JSON.parse(
      response.choices[0].message.content
    );

  }
  catch (err) {

    console.error("Diagnostic error:", err);

    return null;

  }

}