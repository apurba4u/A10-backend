import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

async function seedAdmin() {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      console.error("Database not connected for admin seed");
      return;
    }

    const usersCollection = db.collection("users");
    const existingAdmin = await usersCollection.findOne({ email: "admin@fable.com" });

    if (existingAdmin) {
      console.log("Admin account already exists, skipping seed");
      return;
    }

    const hashedPassword = await bcrypt.hash("Admin@123", 12);

    const admin = await User.create({
      name: "Admin",
      email: "admin@fable.com",
      password: hashedPassword,
      role: "admin",
      isVerifiedWriter: true,
      avatar: null,
    });

    console.log(`Admin account seeded: ${admin.email}`);
  } catch (error) {
    console.error("Admin seed error:", error.message);
  }
}

export default seedAdmin;
