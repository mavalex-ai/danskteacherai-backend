import OpenAI from "openai";

export async function evaluateDiagnosticAnswer(task, userText) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.warn("OPENAI_API_KEY missing");
      return 0.5;
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const prompt = `
You are a Danish language examiner.

Evaluate the following Danish learner answer.

Task focus: ${task.focus}
Target level: ${task.level}

User answer:
"${userText}"

Return ONLY valid JSON in this format:
{ "score": number_between_0_and_1 }

Scoring guidelines:
0.0–0.3 = very weak (A2)
0.4–0.6 = PD2 range
0.7–1.0 = PD3 ready
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2
    });

    const raw = completion.choices[0].message.content;

    const parsed = JSON.parse(raw);

    if (typeof parsed.score === "number") {
      return Math.max(0, Math.min(1, parsed.score));
    }

    return 0.5;

  } catch (error) {
    console.error("Diagnostic evaluation error:", error);
    return 0.5;
  }
}