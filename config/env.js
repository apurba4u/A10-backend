import dotenv from "dotenv";
dotenv.config();

const env = {
  PORT: parseInt(process.env.PORT, 10) || 5001,
  NODE_ENV: process.env.NODE_ENV || "development",
  MONGO_URI: process.env.MONGO_DB_URI,
  JWT_SECRET: process.env.JWT_SECRET || "fable-jwt-secret-dev",
  JWT_EXPIRE: process.env.JWT_EXPIRE || "7d",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET || "fable-auth-secret-dev",
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || "http://localhost:5001",
  IMAGE_UPLOAD_API: process.env.NEXT_PUBLIC_IMAGE_UPLOAD_API,
};

const required = ["MONGO_URI"];
for (const key of required) {
  if (!env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

export default env;
