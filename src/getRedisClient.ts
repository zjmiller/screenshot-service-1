import { createClient, RedisClientType } from "redis";

let redisClient: RedisClientType | null = null;

export async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL,
    });

    redisClient.on("end", () => {
      console.log("Redis connection closed.");
      // Disable caching by setting redisClient to null
      redisClient = null;
    });

    try {
      await redisClient.connect();
      console.log("Connected to Redis successfully.");
    } catch (error: any) {
      console.error("Failed to connect to Redis:", error);
      // Proceed without using Redis caching
      redisClient = null;
    }
  }

  return redisClient;
}
