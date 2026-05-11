import dotenv from "dotenv";

dotenv.config();
const requiredEnv = ["MONGO_URI", "JWT_SECRET", "PORT"];

requiredEnv.forEach((v) => {
  if (!process.env[v]) {
    console.warn(`Warning: Missing recommended environment variable: ${v}`);
  }
});

export {};
