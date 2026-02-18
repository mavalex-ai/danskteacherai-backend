import { getOpenAI } from "./openaiClient.js";

export async function generateTeacherReply({
  message,
  history = [],
  level = "B1"
}) {

  const openai = getOpenAI();

  if (!openai) {

    console.error("❌ OpenAI instance unavailable in conversationTeacher");

    throw new Error("OpenAI not available");

  }

  try {

    console.log("Conversation request received");
    console.log("Key length:", process.env.OPENAI_API_KEY?.length);
    console.log("Project:", process.env.OPENAI_PROJECT_ID);

    const messages = [

      {
        role: "system",
        content:
          `You are a Danish teacher helping a student at level ${level}.
Speak naturally in Danish.
Be friendly.
Ask follow-up questions.`
      },

      ...history,

      {
        role: "user",
        content: message
      }

    ];

    const completion = await openai.chat.completions.create({

      model: "gpt-4o-mini",

      temperature: 0.4,

      messages: messages

    });

    const reply = completion.choices?.[0]?.message?.content;

    if (!reply) {

      throw new Error("Empty OpenAI response");

    }

    return reply;

  }
  catch (err) {

    console.error("❌ Conversation error FULL:", err);

    throw err;

  }

}