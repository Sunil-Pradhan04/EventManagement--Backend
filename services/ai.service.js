import { openai } from "../DB/OpenAi.js";
import { getTopChunks } from "./storage.js";

export const generateMail = async (userData) => {
  console.log("Generating mail for user data:", userData);
  const resp = await openai.chat.completions.create({
    model: "gpt-4.1-nano",
    messages: [
      {
        role: "system",
        content:
          "You are a message writting assistant. Write a professional and engaging message announcement for an event based on the user 1-2 line input. Try t make it a long annousment not too long, more then 3 line .",
      },
      { role: "user", content: userData },
    ],
  });
  let replyBody = resp.choices[0].message.content;
  console.log("🤐🤐", resp.usage);
  return replyBody;
};

const userChatHistory = new Map();

const addChat = (userId, role, content) => {
  if (!userChatHistory.has(userId)) {
    userChatHistory.set(userId, []);
  }

  const history = userChatHistory.get(userId);

  if (history.length >= 7) {
    history.shift();
  }

  if (role === "assistant" && content.length > 50) {
    content = content.slice(0, 50) + "..."; // Summarize/truncate slightly less aggressively
  }

  history.push({ role, content });
};

export const aiChat = async (message, Ename, userId, language = "English") => {
  try {
    const effectiveUserId = userId || "anonymous";

    addChat(effectiveUserId, "user", message);

    const data = await getTopChunks(message, Ename);
    const context = data.map((item) => item.metadata.text).join("\n");
    console.log("Context for AI:", context);

    const history = userChatHistory.get(effectiveUserId) || [];

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [
        {
          role: "system",
          content: `You are GEC EvetBot, an AI agent developed by Sunil, a polite and helpful assistant for GEC college events and games.
          Use the provided data to answer user queries about GEC events. 
          If the data does not contain the answer, politely inform the user that you don't have that information don't give any information which is not avalable in data.
          
          IMPORTANT: You MUST answer strictly in the '${language}' language.
          `,
        },
        {
          role: "user",
          content: `Data : ${context}\n`,
        },
        ...history,
      ],
    });
    console.log("AI Response Usage👉👉:", response.usage);

    addChat(effectiveUserId, "assistant", response.choices[0].message.content);
    return response.choices[0].message.content;
  } catch (err) {
    throw err;
  }
};

export const getBatchEmbeddings = async (texts) => {
  console.log("Requesting batch embeddings for texts:", texts.length);
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: texts,
    });
    return response.data.map((item) => item.embedding);
  } catch (err) {
    console.error("Batch embedding error:", err);
  }
};
