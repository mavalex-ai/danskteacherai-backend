import OpenAI from "openai";

export async function evaluateDiagnosticAnswer(task, userText) {

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing");
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
        content: `
You are an official Danish language examiner.

You MUST evaluate based on:

- grammar accuracy
- vocabulary range
- sentence complexity
- coherence
- correctness for the stated level

Scoring rules:

0.0–0.3 → clearly below PD2
0.4–0.6 → PD2 level
0.7–0.85 → strong PD2 / weak PD3
0.85–1.0 → clear PD3 level

Respond ONLY with JSON:

{"score": number}
`
      },
      {
        role: "user",
        content: `
Task level: ${task.level}
Task focus: ${task.focus}

User answer:
${userText}
`
      }
    ]
  });

  const raw = completion.choices[0].message.content;

  if (!raw) {
    throw new Error("Empty OpenAI response");
  }

  const parsed = JSON.parse(raw);

  return parsed.score;
}