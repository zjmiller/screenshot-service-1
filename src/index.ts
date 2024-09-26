import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import http from "http";
import { corsMiddleware, corsOptions } from "./cors";
import { screenshotHandler } from "./screenshotHandler";
dotenv.config();

export const app = express();

// Logging middleware
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  console.log("Origin:", req.headers.origin);
  next();
});

app.use(corsMiddleware);

// Add pre-flight OPTIONS handler
app.options("*", cors(corsOptions));

// CORS headers logging middleware
app.use((req, res, next) => {
  console.log("CORS headers set:", res.getHeaders());
  next();
});

app.use(express.json());

app.post("/screenshot", (req, res) => {
  // Manually set CORS headers as a last resort
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );

  screenshotHandler(req, res);
});

// Create HTTP backend Node API
const server = http.createServer(app);

// In Heroku, must use process.env.PORT as the external web server
const PORT = Number(process.env.PORT) || 8080;

server.listen(PORT, () => {
  return console.log(`Node backend is listening on ${PORT}`);
});
