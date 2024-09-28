import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import http from "http";
import { screenshotHandler } from "./screenshotHandler.js";
import { asyncHandler } from "./utils/asyncHandler.js";

dotenv.config();

export const app = express();

app.use(cors());

console.log("CORS enabled");

app.use(express.json());

console.log("JSON body parser enabled");

app.post("/screenshot", asyncHandler(screenshotHandler));

// Create HTTP backend Node API
const server = http.createServer(app);

// In Heroku, must use process.env.PORT as the external web server
const PORT = Number(process.env.PORT) || 8080;

server.listen(PORT, () => {
  return console.log(`Node backend is listening on ${PORT}`);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  // Optional: Perform cleanup and graceful shutdown
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  // Optional: Perform cleanup and graceful shutdown
});

// Global Error Handler
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Global Error Handler:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});
