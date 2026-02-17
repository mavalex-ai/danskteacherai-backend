import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function correctUserText({ text, level = "B1" }) {

  if (!text || text.length < 3) {
    return null;
  }

  try {

    const prompt = `
You are a Danish language teacher.

Student level: ${level}

Student text:
"${text}"

Return JSON:

{
  "corrected": "...corrected version...",
  "improved": "...more natural improved version...",
  "explanation": "...short explanation in English..."
}
`;

    const response = await client.chat.completions.create({

      model: "gpt-4o-mini",

      temperature: 0.2,

      messages: [
        {
          role: "system",
          content: "You are a Danish language teacher."
        },
        {
          role: "user",
          content: prompt
        }
      ],

      response_format: { type: "json_object" }

    });

    return JSON.parse(response.choices[0].message.content);

  }
  catch (err) {

    console.error("Correction error:", err);

    return null;

  }

}