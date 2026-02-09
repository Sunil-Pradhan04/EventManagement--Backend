import mongoose from "mongoose";
import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from "dotenv";
dotenv.config();

/* ---------------- MONGODB GLOBAL CACHE ---------------- */

const MONGO_URL = process.env.MONGO_URL;

if (!global._mongoose) {
  global._mongoose = { conn: null, promise: null };
}

export const dbConnection = async () => {
  if (global._mongoose.conn) {
    return global._mongoose.conn;
  }

  if (!global._mongoose.promise) {
    global._mongoose.promise = mongoose.connect(MONGO_URL, {
      dbName: "EVENT",
      serverSelectionTimeoutMS: 8000,
      maxPoolSize: 1,     // limit connections
      family: 4           // faster DNS
    });
  }

  try {
    global._mongoose.conn = await global._mongoose.promise;
    console.log("✅ MongoDB Connected");
    return global._mongoose.conn;
  } catch (err) {
    console.error("❌ MongoDB Error:", err.message);
    global._mongoose.promise = null;
    throw err;
  }
};

/* ---------------- PINECONE GLOBAL CACHE ---------------- */

let pinecone = global._pinecone;
let index = global._pineconeIndex;

if (!pinecone && process.env.PINECONE_API_KEY) {
  pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
  });

  index = pinecone.index(process.env.PINECONE_INDEX);

  global._pinecone = pinecone;
  global._pineconeIndex = index;
}

export { index };
