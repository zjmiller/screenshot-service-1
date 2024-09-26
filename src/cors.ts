import cors from "cors";

const corsOptions = {
  credentials: true,
  origin: ["http://localhost:3000", "http://localhost:3001"],
};

export const corsMiddleware = cors(corsOptions);
