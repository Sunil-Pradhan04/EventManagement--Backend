import app from "../app.js";
import { dbConnection } from "../DB/dbConnection.js";

export default async function handler(req, res) {
  await dbConnection();
  return app(req, res);
}
