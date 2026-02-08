import { get } from "mongoose";
import { index } from "../DB/dbConnection.js";
import { getBatchEmbeddings } from "./ai.service.js";

const createChunk = (text, size = 25, overlap = 10) => {
  // console.log("Creating chunks from text");
  const words = text.trim().split(/\s+/);
  const chunks = [];

  for (let i = 0; i < words.length; i += size - overlap) {
    const chunk = words.slice(i, i + size).join(" ");
    chunks.push(chunk);
  }
  // console.log(`Created ${chunks} chunks📨📨`);
  return chunks;
};

export const storeTextInVectorDB = async (text, eventId) => {
  console.log("Storing text in vector DB for event:", eventId);
  console.log("Text length:", text.length);
  try {
    const chunks = createChunk(text, 25, 10);
    const embeddings = await getBatchEmbeddings(chunks);
    const vectors = embeddings.map((embedding, i) => ({
      id: `${eventId}_${i}`,
      values: embedding,
      metadata: {
        eventId,
        chunkNo: i,
        text: chunks[i],
      },
    }));

    await index.upsert({
      records: vectors,
    });

    console.log("Vector data stored successfully");
  } catch (err) {
    console.error("Error storing vectors:", err);
  }
};


export const getTopChunks = async (queryText, eventId) => {
  try {
    const queryEmbedding = await getBatchEmbeddings(queryText);
    const result = await index.query({
      vector: queryEmbedding,
      topK: 3,                
      includeMetadata: true,
      filter: {
        eventId: { $eq: eventId }   
      }
    });
    console.log("Query result:", result.matches[1].metadata);
    return result.matches;   // array of 3 best chunks
  } catch (err) {
    console.error("Query error:", err);
  }
};

// getTopChunks("What is token", "LUDO")