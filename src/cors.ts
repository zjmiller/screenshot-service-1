import cors from "cors";

const corsOptions = {
  origin: "*",
};

export const corsMiddleware = cors(corsOptions);
