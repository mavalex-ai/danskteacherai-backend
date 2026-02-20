import { getOpenAI } from "./openaiClient.js";

import {
  loadUserState,
  saveUserState
} from "../persistence/stateRepository.js";


// Estimate speaking duration based on words
function estimateSpeechSeconds(text) {

  if (!text) return 0;

  const words = text.trim().split(/\s+/).length;

  const wordsPerSecond = 2.5;

  return Math.ceil(words / wordsPerSecond);

}


export async function generateTeacherReply({
  userId,
  message,
  history = [],
  level = "B1"
}) {

  const openai = getOpenAI();

  if (!openai) {

    throw new Error("OpenAI not available");

  }


  const userState = await loadUserState(userId);


  // Ensure freeConversation exists
  if (!userState.freeConversation) {

    userState.freeConversation = {

      secondsUsedTotal: 0,

      secondsLimitTotal: 180,

      limitReached: false

    };

  }


  const used = userState.freeConversation.secondsUsedTotal;

  const limit = userState.freeConversation.secondsLimitTotal;


  // HARD BLOCK if limit reached
  if (!userState.subscription?.active && used >= limit) {

    return {

      reply:
        "You have used your free conversation limit. Subscribe to continue practicing Danish conversation with Dansk TeacherAI.",

      limitReached: true,

      secondsUsedTotal: used,

      secondsLimitTotal: limit

    };

  }


  const messages = [

    {
      role: "system",
      content:
        `You are a professional Danish teacher helping a ${level} student. Speak naturally in Danish.`
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

    messages

  });


  const reply = completion.choices[0].message.content;
  console.log("Conversation seconds added:", seconds);

console.log(
  "Total used:",
  userState.freeConversation.secondsUsedTotal,
  "/",
  userState.freeConversation.secondsLimitTotal
);


  // Estimate AI speaking duration
  const seconds = estimateSpeechSeconds(reply);


  // Update FREE limit usage ONLY if not subscribed
  if (!userState.subscription?.active) {

    userState.freeConversation.secondsUsedTotal += seconds;

    if (
      userState.freeConversation.secondsUsedTotal >=
      userState.freeConversation.secondsLimitTotal
    ) {

      userState.freeConversation.limitReached = true;

    }

  }


  await saveUserState(userState);


  return {

    reply,

    limitReached: userState.freeConversation.limitReached,

    secondsUsedTotal:
      userState.freeConversation.secondsUsedTotal,

    secondsLimitTotal:
      userState.freeConversation.secondsLimitTotal

  };

}