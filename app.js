import { dbConnection } from "./DB/dbConnection.js";
import cookieParser from "cookie-parser";
import express from "express";
import dotenv from "dotenv";
import userRoutes from "./routes/userRoutes.js";
import cors from "cors";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());
// Allow multiple comma-separated URLs from clientURL, Default to blank array if undefined
const allowedOrigins = process.env.clientURL ? process.env.clientURL.split(',') : [];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

app.use("/api/EVENT", userRoutes);

dbConnection();

export default app;
