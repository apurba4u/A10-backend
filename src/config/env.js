import dotenv from "dotenv";
dotenv.config();

const isVercel = !!process.env.VERCEL;

const env = {
  PORT: parseInt(process.env.PORT, 10) || 5000,
  NODE_ENV: isVercel ? "production" : (process.env.NODE_ENV || "development"),
  MONGO_URI: process.env.MONGO_DB_URI,
  JWT_SECRET: process.env.JWT_SECRET || "fable-jwt-secret-dev",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  CLIENT_URL: process.env.CLIENT_URL || (isVercel ? "https://fable-tau.vercel.app" : "http://localhost:3000"),
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET || "fable-auth-secret-dev",
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || (isVercel ? "https://10-server.vercel.app" : "http://localhost:5001"),
  IMAGE_UPLOAD_API_KEY: process.env.NEXT_PUBLIC_IMAGE_UPLOAD_API_KEY,
  FRONTEND_URL: process.env.FRONTEND_URL || "https://fable-tau.vercel.app",
};

const required = ["MONGO_URI"];
for (const key of required) {
  if (!env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export default env;
