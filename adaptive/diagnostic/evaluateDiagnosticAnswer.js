import OpenAI from "openai";

export async function evaluateDiagnosticAnswer(task, userText) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing");
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    temperature: 0,
    messages: [
      {
        role: "system",
        content: "Respond ONLY with JSON."
      },
      {
        role: "user",
        content: `
Evaluate this text:

"${userText}"

Return:
{"score": 0.0-1.0}
`
      }
    ]
  });

  console.log("FULL OPENAI RESPONSE:", JSON.stringify(completion, null, 2));

  const raw = completion.choices[0].message.content;

  if (!raw) {
    throw new Error("Model returned empty content");
  }

  const parsed = JSON.parse(raw);

  if (typeof parsed.score !== "number") {
    throw new Error("Score not found in JSON");
  }

  return parsed.score;
}