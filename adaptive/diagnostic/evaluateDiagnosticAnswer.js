import OpenAI from "openai";

export async function evaluateDiagnosticAnswer(task, userText) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return 0.5;
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
          content:
            "You are a strict Danish language examiner. Respond ONLY with valid JSON."
        },
        {
          role: "user",
          content: `
Evaluate this Danish learner answer.

Target level: ${task.level}
Focus: ${task.focus}

Answer:
"${userText}"

Return ONLY this JSON:
{"score": number_between_0_and_1}
`
        }
      ]
    });

    const raw = completion.choices?.[0]?.message?.content;

    if (!raw) {
      return 0.5;
    }

    let parsed;

    try {
      parsed = JSON.parse(raw);
    } catch {
      return 0.5;
    }

    if (typeof parsed.score === "number") {
      return Math.max(0, Math.min(1, parsed.score));
    }

    return 0.5;

  } catch (error) {
    return 0.5;
  }
}