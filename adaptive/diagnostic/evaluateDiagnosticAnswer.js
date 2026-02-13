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
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        {
          role: "system",
          content: "You are a strict Danish language examiner. Always respond with ONLY JSON."
        },
        {
          role: "user",
          content: `
Evaluate this Danish learner answer.

Target level: ${task.level}
Focus: ${task.focus}

Answer:
"${userText}"

Return ONLY:
{"score": number_between_0_and_1}
`
        }
      ]
    });

    const raw = completion.choices?.[0]?.message?.content || "";

    if (!raw) {
      return 0.5;
    }

    // Удаляем возможные markdown ```json
    const cleaned = raw
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const jsonMatch = cleaned.match(/\{[\s\S]*?\}/);

    if (!jsonMatch) {
      return 0.5;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (typeof parsed.score === "number") {
      return Math.max(0, Math.min(1, parsed.score));
    }

    return 0.5;

  } catch (error) {
    return 0.5;
  }
}