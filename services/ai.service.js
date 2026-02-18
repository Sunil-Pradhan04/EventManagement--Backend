import { openai } from "../DB/OpenAi.js";
import { getTopChunks } from "./storage.js";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

/* ---------------- ENV ---------------- */
const SARVAM_API_KEY = process.env.SARVAM_API_KEY;
if (!SARVAM_API_KEY) {
  throw new Error("SARVAM_API_KEY missing in .env");
}

/* ---------------- AXIOS INSTANCE ---------------- */
const sarvam = axios.create({
  baseURL: "https://api.sarvam.ai/v1",
  timeout: 30000,
  headers: {
    Authorization: `Bearer ${SARVAM_API_KEY}`,
    "Content-Type": "application/json",
  },
});

/* ---------------- CHAT MEMORY ---------------- */
const userChatHistory = new Map();

const addChat = (userId, role, content) => {
  if (!userChatHistory.has(userId)) {
    userChatHistory.set(userId, []);
  }

  const history = userChatHistory.get(userId);

  // limit history
  if (history.length >= 6) history.shift();

  // truncate assistant messages
  const safeContent =
    role === "assistant" && content.length > 150
      ? content.slice(0, 150) + "..."
      : content;

  history.push({ role, content: safeContent });
};

const formatHistory = (history) => {
  // ensure only valid structure
  return history.map((h) => ({
    role: h.role === "assistant" ? "assistant" : "user",
    content: h.content,
  }));
};

/* ---------------- MAIL GENERATOR ---------------- */
export const generateMail = async (userData) => {
  try {
    const resp = await sarvam.post("/chat/completions", {
      model: "sarvam-m",
      messages: [
        {
          role: "system",
          content:
            "You are a professional announcement writer. Write a clear, engaging event announcement in 3–6 lines.",
        },
        { role: "user", content: userData },
      ],
      temperature: 0.7,
      max_tokens: 400,
    });

    return resp.data?.choices?.[0]?.message?.content || "";
  } catch (err) {
    console.error("Mail error:", err.response?.data || err.message);
    return "Unable to generate message right now.";
  }
};

/* ---------------- AI CHAT ---------------- */
export const aiChat = async (
  message,
  Ename,
  userId,
  language = "English"
) => {
  try {
    const uid = userId || "anonymous";

    // Save user message first
    addChat(uid, "user", message);

    /* ---------- CONTEXT ---------- */
    const data = await getTopChunks(message, Ename);
    const context =
      data?.length > 0
        ? data.map((i) => i.metadata.text).join("\n")
        : "No event data available.";

    /* ---------- HISTORY ---------- */
    let history = formatHistory(userChatHistory.get(uid) || []);

    // Remove trailing user msg (we append a fresh one below)
    while (history.length && history[history.length - 1].role === "user") {
      history.pop();
    }

    // Sarvam requires first msg after system to be "user" – strip leading assistant msgs
    while (history.length && history[0].role === "assistant") {
      history.shift();
    }

    // Enforce strict user/assistant alternation
    const cleaned = [];
    for (const msg of history) {
      const prev = cleaned[cleaned.length - 1];
      if (!prev || prev.role !== msg.role) {
        cleaned.push(msg);
      }
    }
    history = cleaned;

    /* ---------- MESSAGES ---------- */
    const messages = [
      {
        role: "system",
        content: `You are GEC EventBot, a polite assistant(agent not LLM) for college events(Devloped by Sunil).
Use ONLY provided data to answer.
If answer is not present, politely say you don't have that information.
Reply strictly in ${language}.Don't say about your home company remember sunil is your owner.If some one asking about your devloper or sunil the give information also this link to know more "https://sunil-pradhan04.github.io/My-Portfolio/".`,
      },
      ...history,
      {
        role: "user",
        content: `Event Data:\n${context}\n\nQuestion: ${message}`,
      },
    ];

    /* ---------- API CALL ---------- */
    const resp = await sarvam.post("/chat/completions", {
      model: "sarvam-m",
      messages,
      temperature: 1,
      max_tokens: 500,
    });

    console.log(resp.data);

    const reply =
      resp.data?.choices?.[0]?.message?.content || "No response.";

    addChat(uid, "assistant", reply);
    return reply;
  } catch (err) {
    console.error("AI Chat Error:", err.response?.data || err.message);
    return "AI service temporarily unavailable.";
  }
};

/* ---------------- EMBEDDINGS ---------------- */
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
