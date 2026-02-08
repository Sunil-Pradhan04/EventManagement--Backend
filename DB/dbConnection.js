import mongoose from "mongoose";
import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from "dotenv";
dotenv.config();

let isConnected = false;
let pinecone;
let index;

export const dbConnection = async () => {
  if (isConnected) return;

  try {
    await mongoose.connect(process.env.MONGO_URL, {
      dbName: "EVENT",
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = true;
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB Error:", err.message);
  }
};

// ---------- Pinecone Cache ----------
if (!pinecone) {
  pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
  });

  index = pinecone.index(process.env.PINECONE_INDEX);
}

export { index };
