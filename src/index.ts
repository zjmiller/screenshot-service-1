import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import http from "http";
import { screenshotHandler } from "./screenshotHandler";

dotenv.config();

export const app = express();

app.use(cors());

console.log("CORS enabled");

app.use(express.json());

console.log("JSON body parser enabled");

app.post("/screenshot", screenshotHandler);

// Create HTTP backend Node API
const server = http.createServer(app);

// In Heroku, must use process.env.PORT as the external web server
const PORT = Number(process.env.PORT) || 8080;

server.listen(PORT, () => {
  return console.log(`Node backend is listening on ${PORT}`);
});
