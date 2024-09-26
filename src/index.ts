import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import http from "http";
import { corsHeadersMiddleware, corsOptions } from "./cors";
import { screenshotHandler } from "./screenshotHandler";

dotenv.config();

export const app = express();

// Apply CORS middleware to all routes
app.use(cors(corsOptions));

// Apply custom CORS headers middleware
app.use(corsHeadersMiddleware);

// Handle preflight requests
app.options("*", cors(corsOptions));

app.use(express.json());

app.post("/screenshot", screenshotHandler);

// Create HTTP backend Node API
const server = http.createServer(app);

// In Heroku, must use process.env.PORT as the external web server
const PORT = Number(process.env.PORT) || 8080;

server.listen(PORT, () => {
  return console.log(`Node backend is listening on ${PORT}`);
});
