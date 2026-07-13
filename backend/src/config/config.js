import { config } from "dotenv";

config({ debug: true, encoding: "UTF-8", override: true });

const port = Number(process.env.PORT) || 3000;
const mongodbURL = process.env.MONGODB_URL;
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET || process.env.REFRESH_TOKEN;
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET || process.env.ACCESS_TOKEN;

if (!mongodbURL || !refreshTokenSecret || !accessTokenSecret) {
  throw new Error("Environment variables are missing");
}

export { port, mongodbURL, accessTokenSecret, refreshTokenSecret };