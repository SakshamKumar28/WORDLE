import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const redisClient = createClient({ url: redisUrl });

redisClient.on("error", (error) => {
  console.error("Redis error:", error);
});

const initRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    console.log(`Connected to Redis at ${redisUrl}`);
  }
};

export { redisClient, initRedis };