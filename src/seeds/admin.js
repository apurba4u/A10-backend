import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { getAuth } from "../config/auth.js";

async function seedAdmin() {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      console.error("Database not connected for admin seed");
      return;
    }

    const adminEmail = "admin@fable.com";
    const adminPassword = "Admin@123";

    // Check if admin exists in both collections
    const existingMongooseAdmin = await User.findOne({ email: adminEmail });
    const existingBetterAuthUser = await db.collection("user").findOne({ email: adminEmail });
    const existingBetterAuthAccount = await db.collection("account").findOne({ accountId: adminEmail });

    if (existingMongooseAdmin && existingBetterAuthUser && existingBetterAuthAccount) {
      if (!existingMongooseAdmin.hasChosenRole) {
        await User.findByIdAndUpdate(existingMongooseAdmin._id, { hasChosenRole: true });
        console.log("Admin hasChosenRole set to true");
      }
      console.log("Admin account already exists in all collections, skipping seed");
      return;
    }

    // If only partial, clean up and recreate
    if (existingMongooseAdmin || existingBetterAuthUser) {
      console.log("Partial admin found, cleaning up and recreating...");
      await User.deleteOne({ email: adminEmail });
      await db.collection("user").deleteOne({ email: adminEmail });
      await db.collection("account").deleteOne({ accountId: adminEmail });
    }

    // Create in Better Auth using signUpEmail API
    let baSession = null;
    try {
      const auth = getAuth();
      baSession = await auth.api.signUpEmail({
        body: { name: "Admin", email: adminEmail, password: adminPassword },
        headers: new Headers(),
      });
      console.log("Admin created in Better Auth collection");
    } catch (authErr) {
      console.error("Better Auth admin creation error:", authErr.message);
      // Fallback: manual insertion
      try {
        const hashedPassword = await bcrypt.hash(adminPassword, 12);
        const baId = new mongoose.Types.ObjectId();
        await db.collection("user").insertOne({
          _id: baId,
          name: "Admin",
          email: adminEmail,
          emailVerified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          role: "user",
          banned: false,
          isVerified: false,
        });
        await db.collection("account").insertOne({
          _id: new mongoose.Types.ObjectId(),
          userId: baId,
          providerId: "credential",
          accountId: adminEmail,
          password: hashedPassword,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log("Admin created in Better Auth (manual fallback)");
      } catch (fallbackErr) {
        console.error("Fallback admin creation error:", fallbackErr.message);
      }
    }

    // Create in Mongoose users collection
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    const admin = await User.create({
      name: "Admin",
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
      isVerifiedWriter: true,
      hasChosenRole: true,
      avatar: null,
    });
    console.log(`Admin account seeded: ${admin.email} (role: ${admin.role})`);
  } catch (error) {
    console.error("Admin seed error:", error.message);
  }
}

export default seedAdmin;
