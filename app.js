import { dbConnection } from "./DB/dbConnection.js";
import session from "express-session";
import express from "express";
import dotenv from "dotenv";
import userRoutes from "./routes/userRoutes.js";
import cors from "cors";

dotenv.config();

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: process.env.clientURL,
    credentials: true,
  })
);

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 60 * 60 * 1000 * 24 * 15,
      secure: false,
      sameSite: "lax",
    },
  })
);

app.use("/api/EVENT", userRoutes);

// connect DB once
dbConnection();

export default app;
