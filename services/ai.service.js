import { openai } from "../DB/OpenAi.js";
import { getTopChunks } from "./storage.js";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

/* ---------------- HELPERS ---------------- */

/**
 * Strips <think>...</think> reasoning blocks emitted by some LLMs.
 * Also handles malformed/unclosed <think> tags (e.g. </ink>, missing close).
 */
function extractFinalMessage(content) {
  return content
    .replace(/<think>[\s\S]*?<\/think>/gi, "") // well-formed blocks
    .replace(/<think>[\s\S]*/gi, "")           // unclosed <think> — remove everything after it
    .trim();
}



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

    const raw = resp.data?.choices?.[0]?.message?.content || "";
    return extractFinalMessage(raw);
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
  language = "English"
) => {
  try {
    /* ---------- CONTEXT ---------- */
    const data = await getTopChunks(message, Ename);
    const context =
      data?.length > 0
        ? data.map((i) => i.metadata.text).join("\n")
        : "No event data available.";

    let history = (Array.isArray(clientHistory) ? clientHistory : [])
      .slice(-6)
      .map((h) => ({
        role: h.role === "assistant" ? "assistant" : "user",
        content: typeof h.content === "string" ? h.content.slice(0, 200) : "",
      }));

    // Strip leading assistant msgs (Sarvam needs user first after system)
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
        content: `You are a strict AI assistant known as EventChatBot.

RULES:
- Answer ONLY from the provided CONTEXT.
- Do NOT guess or use outside knowledge.
- If the answer is not in CONTEXT, say:
  "I don't have enough information to answer that."
- Keep answers short but not very short it must easely understandable.

EXCEPTION:
- For greetings or casual messages (like "hi", "hello", "thank you", "good morning"), reply politely in one short sentence.

SPECIAL RULE:
- If the user asks about "developer" or "Sunil", respond respectfully:
  "This AI was developed by Sunil, a skilled full-stack developer passionate about AI and modern technologies. You can view his portfolio here: https://sunil-pradhan04.github.io/My-Portfolio/"`
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
    });

    console.log(resp.data?.choices?.[0]?.message?.content);

    const raw =
      resp.data?.choices?.[0]?.message?.content || "No response.";
    const reply = extractFinalMessage(raw);

    console.log(resp.data.usage);

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
