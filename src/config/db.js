import mongoose from "mongoose";
import env from "./env.js";

let isConnected = false;

export async function connectDB() {
  if (isConnected) return mongoose.connection;

  try {
    await mongoose.connect(env.MONGO_URI);
    isConnected = true;
    console.log(`MongoDB connected: ${mongoose.connection.host}`);
    return mongoose.connection;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    throw error;
  }
}

mongoose.connection.on("error", (err) => {
  console.error(`MongoDB runtime error: ${err.message}`);
});

mongoose.connection.on("disconnected", () => {
  isConnected = false;
  console.log("MongoDB disconnected");
});
