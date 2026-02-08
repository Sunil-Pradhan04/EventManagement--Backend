import dotenv from "dotenv";
import mongoose from "mongoose";
import { Pinecone } from "@pinecone-database/pinecone";

dotenv.config();

let isConnected = false;   // 🔴 ADD THIS

export const dbConnection = async () => {
  if (isConnected) return;  // 🔴 ADD THIS

  try {
    await mongoose.connect(process.env.MONGO_URL);
    isConnected = true;     // 🔴 ADD THIS
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB Error:", err.message);
  }
};

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

export const index = pinecone.index(process.env.PINECONE_INDEX);
