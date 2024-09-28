import { createClient } from "redis";

let redisClient: ReturnType<typeof createClient> | null = null;

export async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL,
    });

    redisClient.on("error", (err) => {
      console.error("Redis error:", err);
    });

    redisClient.on("end", () => {
      console.log("Redis connection closed.");
    });

    try {
      await redisClient.connect();
    } catch (error) {
      console.error("Failed to connect to Redis:", error);
      throw new Error("Redis connection failed");
    }
  }
  return redisClient;
}
