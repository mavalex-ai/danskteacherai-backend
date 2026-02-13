import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function evaluateDiagnosticAnswer(task, userText) {
  try {
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
0.0–0.3 = very weak (clear A1/A2)
0.4–0.6 = mid level (PD2 range)
0.7–1.0 = strong (PD3 ready)

Be strict but fair.
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