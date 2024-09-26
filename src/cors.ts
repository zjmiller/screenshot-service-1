import cors from "cors";
import express from "express";

export const corsOptions: cors.CorsOptions = {
  origin: true, // Allow all origins
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

export const corsMiddleware = cors(corsOptions);

// CORS headers middleware
export const corsHeadersMiddleware = (req: any, res: any, next: any) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET,PUT,POST,DELETE,PATCH,OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Content-Length, X-Requested-With"
  );
  next();
};

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
