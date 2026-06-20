import { fromNodeHeaders } from "better-auth/node";
import User from "../models/User.js";
import mongoose from "mongoose";

const sessionMiddleware = async (req, res, next) => {
  try {
    let sessionToken = null;

    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader) {
      sessionToken = authHeader.replace("Bearer ", "");
    }

    // Extract token from cookie
    if (!sessionToken && req.headers.cookie) {
      const cookies = req.headers.cookie.split(";").map((c) => c.trim());
      for (const cookie of cookies) {
        const [name, value] = cookie.split("=");
        if (name === "better-auth.session_token" || name === "__Secure-better-auth.session_token") {
          sessionToken = value;
          break;
        }
      }
    }

    if (!sessionToken) {
      req.user = null;
      req.session = null;
      return next();
    }

    // Better Auth cookie format: {sessionId}.{signature} — strip the signature part
    const rawToken = sessionToken.split(".")[0];

    // Look up session directly in Better Auth session collection
    const db = mongoose.connection.db;
    const baSession = await db.collection("session").findOne({
      token: rawToken,
      expiresAt: { $gt: new Date() },
    });

    if (!baSession) {
      req.user = null;
      req.session = null;
      return next();
    }

    // Get the Better Auth user
    const baUser = await db.collection("user").findOne({ _id: baSession.userId });

    if (!baUser) {
      req.user = null;
      req.session = null;
      return next();
    }

    // Map to Mongoose user
    let mongooseUser = await User.findOne({ email: baUser.email }).select("-password");

    if (!mongooseUser) {
      mongooseUser = await User.create({
        name: baUser.name || "User",
        email: baUser.email,
        role: "user",
        avatar: baUser.image || null,
        bio: "",
      });
    }

    req.user = {
      id: mongooseUser._id.toString(),
      _id: mongooseUser._id,
      email: mongooseUser.email,
      name: mongooseUser.name,
      role: mongooseUser.role,
      avatar: mongooseUser.avatar,
      bio: mongooseUser.bio,
      isVerifiedWriter: mongooseUser.isVerifiedWriter,
    };
    req.session = {
      token: baSession.token,
      expiresAt: baSession.expiresAt,
    };
  } catch (err) {
    console.error("Session middleware error:", err.message);
    req.user = null;
    req.session = null;
  }
  next();
};

export default sessionMiddleware;
