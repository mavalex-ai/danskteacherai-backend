import OpenAI from "openai";

export async function evaluateDiagnosticAnswer(task, userText) {
  console.log("🧠 EVALUATOR CALLED");

  try {
    if (!process.env.OPENAI_API_KEY) {
      console.warn("⚠ OPENAI_API_KEY missing");
      return 0.5;
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const prompt = `
You are a strict Danish language examiner.

Evaluate the following Danish learner answer.

Task focus: ${task.focus}
Target level: ${task.level}

User answer:
"${userText}"

Return ONLY pure JSON.
No explanations.
No extra text.
No markdown.

Format:
{"score": 0.0-1.0}

Scoring scale:
0.0–0.3 = A2
0.4–0.6 = PD2
0.7–1.0 = PD3
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0
    });

    const raw = completion.choices?.[0]?.message?.content?.trim() || "";

    console.log("🔎 RAW OPENAI RESPONSE:", raw);

    // Попытка вытащить JSON даже если GPT добавил лишний текст
    const jsonMatch = raw.match(/\{[\s\S]*?\}/);

    if (!jsonMatch) {
      console.warn("⚠ No JSON found in response");
      return 0.5;
    }

    console.log("📦 Extracted JSON:", jsonMatch[0]);

    let parsed;

    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("❌ JSON parse error:", parseError);
      return 0.5;
    }

    if (typeof parsed.score === "number") {
      const safeScore = Math.max(0, Math.min(1, parsed.score));
      console.log("✅ RETURNING SCORE:", safeScore);
      return safeScore;
    }

    console.warn("⚠ Score not found in parsed JSON");
    return 0.5;

  } catch (error) {
    console.error("❌ Diagnostic evaluation error:", error);
    return 0.5;
  }
}