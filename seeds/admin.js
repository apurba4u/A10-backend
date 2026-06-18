import mongoose from "mongoose";
import { hashPassword } from "better-auth/crypto";

async function seedAdmin() {
  const db = mongoose.connection.db;
  if (!db) {
    console.error("Database not connected for admin seed");
    return;
  }

  const usersCollection = db.collection("user");
  const accountsCollection = db.collection("account");

  const existingAdmin = await usersCollection.findOne({ email: "admin@fable.com" });

  if (existingAdmin) {
    console.log("Admin account already exists, skipping seed");
    return;
  }

  const now = new Date();
  const hashedPassword = await hashPassword("Admin@123");

  const userResult = await usersCollection.insertOne({
    email: "admin@fable.com",
    emailVerified: true,
    name: "Admin",
    image: null,
    role: "admin",
    isVerified: true,
    banned: false,
    createdAt: now,
    updatedAt: now,
  });

  const userId = userResult.insertedId;

  await accountsCollection.insertOne({
    providerId: "credential",
    accountId: userId,
    userId: userId,
    password: hashedPassword,
    accessToken: null,
    refreshToken: null,
    idToken: null,
    accessTokenExpiresAt: null,
    refreshTokenExpiresAt: null,
    scope: null,
    createdAt: now,
    updatedAt: now,
  });

  console.log("Admin account seeded: admin@fable.com");
}

export default seedAdmin;
