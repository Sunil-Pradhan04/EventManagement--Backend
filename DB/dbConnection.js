import dotenv from "dotenv";
import mongoose from "mongoose";
import { Pinecone } from "@pinecone-database/pinecone";
dotenv.config();

export const dbConnection = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB Error:", err.message);
  }
};

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});
export const index = pinecone.index(process.env.PINECONE_INDEX);

