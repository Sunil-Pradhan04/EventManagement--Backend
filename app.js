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
app.use(
  cors({
    origin: process.env.clientURL,
    credentials: true,
  })
);

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", process.env.clientURL);
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

app.use("/api/EVENT", userRoutes);

// connect DB once
dbConnection();

export default app;
