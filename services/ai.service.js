import { openai } from "../DB/OpenAi.js";
import { getTopChunks } from "./storage.js";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

function extractFinalMessage(content) {
  return content
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<think>[\s\S]*/gi, "")
    .trim();
}

const endpoint = "https://api.sarvam.ai/v1/chat/completions";

const SARVAM_API_KEY = process.env.SARVAM_API_KEY;

/* ---------------- MAIL GENERATOR ---------------- */
export const generateMail = async (userData) => {
  console.log("[👉👉called");
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SARVAM_API_KEY}`,
      },
      body: JSON.stringify({
        model: "sarvam-105b",
        messages: [
          {
            role: "system",
            content:
              "Write annoucment according to given message from user. Your work is write a formal annousment for paticipents becouse user dont want to write a long message. So user will give a short topic and you have to convert it to a professional and formal annoucement.Return a normal paragraph. Dont give answer of any question instade of annoucment request",
          },
          {
            role: "user",
            content: userData,
          },
        ],
        reasoning_effort: null,
      }),
    });

    const r = await response.json();
    console.log(r);
    return r.choices[0].message.content;
  } catch (err) {
    console.error("Mail error:", err.response?.data || err.message);
    return "Unable to generate message right now.";
  }
};

/* ---------------- AI CHAT ---------------- */
export const aiChat = async (
  message,
  Ename,
  clientHistory = [],
  language = "English",
) => {
  try {
    const data = await getTopChunks(message, Ename);
    const context =
      data?.length > 0
        ? data.map((i) => i.metadata.text).join("\n")
        : "No event data available.";

    console.log("👉👉👉👉", context);

    let history = (Array.isArray(clientHistory) ? clientHistory : [])
      .slice(-6)
      .map((h) => ({
        role: h.role === "assistant" ? "assistant" : "user",
        content: typeof h.content === "string" ? h.content.slice(0, 200) : "",
      }));

    while (history.length && history[0].role === "assistant") {
      history.shift();
    }
    const cleaned = [];
    for (const msg of history) {
      const prev = cleaned[cleaned.length - 1];
      if (!prev || prev.role !== msg.role) {
        cleaned.push(msg);
      }
    }
    history = cleaned;
    console.log(history);
    const messages1 = [
      {
        role: "system",
        content: `You are Orbit (Event Project Version), an AI assistant built by Sunil.

Your primary role is to help users with questions related to the event using the provided Event Data.

Rules:

1. If the user's question is related to the event, answer using only the provided Event Data.
2. If the required information is not available in the Event Data, reply:
   "I couldn't find that information in the event details."
3. Do not invent, assume, or hallucinate event information.
4. If the user is having a normal conversation (greetings, thanks, who are you, how are you, jokes, etc.), respond naturally.
5. Keep responses clear, concise, and friendly.
6. If the user asks about the developer, creator, or builder of Orbit, mention that Orbit was built by Sunil and share this portfolio:
   https://sunil-pradhan04.github.io/My-Portfolio/
7. Dont give any information like "according to given data  or context"

You will receive:

* Event Data (context)
* User Question 
* Important - Always use "${language}" language for answer.

Use Event Data only when it is necessary to answer the user's question.
"`,
      },{
        role: "assistant",
        content: `Event Data: ${context}. This is the Database content about event`
      }
      ,
      ...history,

      {
        role: "user",
        content: message,
      },
    ];

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SARVAM_API_KEY}`,
      },
      body: JSON.stringify({
        model: "sarvam-105b",
        messages: messages1,
        reasoning_effort: null,
      }),
    });

    const r = await response.json();

    return r.choices[0].message.content;
  } catch (err) {
    console.error("AI Chat Error:", err.response?.data || err.message);
    return "AI service temporarily unavailable.";
  }
};

export const getBatchEmbeddings = async (texts) => {
  try {
    if (!texts || texts.length === 0) return [];

    const resp = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: texts,
    });

    return resp.data.map((d) => d.embedding);
  } catch (err) {
    console.error("Embedding Error:", err.message);
    return [];
  }
};