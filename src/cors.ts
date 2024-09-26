import cors from "cors";
import express from "express";

export const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

export const corsMiddleware = cors(corsOptions);

// Logging middleware
export const loggingMiddleware = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  console.log("Origin:", req.headers.origin);
  next();
};

// CORS headers logging middleware
export const corsHeadersLoggingMiddleware = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  console.log("CORS headers set:", res.getHeaders());
  next();
};

// Pre-flight OPTIONS handler
export const optionsHandler = cors(corsOptions);
