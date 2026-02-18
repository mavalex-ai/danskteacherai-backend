import OpenAI from "openai";

let openaiInstance = null;
let openaiDisabled = false;

export function getOpenAI() {

  if (openaiDisabled) {
    return null;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const project = process.env.OPENAI_PROJECT_ID;

  if (!apiKey) {

    console.error("❌ OPENAI_API_KEY missing");

    openaiDisabled = true;

    return null;

  }

  if (!project) {

    console.error("❌ OPENAI_PROJECT_ID missing");

    openaiDisabled = true;

    return null;

  }

  if (!openaiInstance) {

    try {

      console.log("Initializing OpenAI client...");
      console.log("API key length:", apiKey.length);
      console.log("Project:", project);

      openaiInstance = new OpenAI({

        apiKey: apiKey,

        project: project

      });

      console.log("✅ OpenAI client initialized successfully");

    }
    catch (err) {

      console.error("❌ OpenAI init failed:", err.message);

      openaiDisabled = true;

      return null;

    }

  }

  return openaiInstance;

}