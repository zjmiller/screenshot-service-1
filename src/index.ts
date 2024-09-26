import dotenv from "dotenv";
import express from "express";
import http from "http";
import { corsMiddleware } from "./cors";
import { screenshotHandler } from "./screenshotHandler";
dotenv.config();

export const app = express();

app.use(corsMiddleware);

app.use(express.json());

app.post("/screenshot", (req, res) => {
  screenshotHandler(req, res);
});

// Create HTTP backend Node API
const server = http.createServer(app);

// In Heroku, must use process.env.PORT as the external web server
const PORT = Number(process.env.PORT) || 8080;

server.listen(PORT, () => {
  return console.log(`Node backend is listening on ${PORT}`);
});
