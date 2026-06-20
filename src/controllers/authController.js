import { getAuth } from "../config/auth.js";
import { ApiError } from "../utils/ApiError.js";
import User from "../models/User.js";
import { registerSchema } from "../validators/auth.js";
import env from "../config/env.js";

function getCookieFlags() {
  const isProduction = env.NODE_ENV === "production";
  return isProduction
    ? "; SameSite=None; Secure"
    : "; SameSite=Lax";
}

export const register = async (req, res, next) => {
  try {
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message).join(", ");
      throw new ApiError(messages, 400);
    }

    const { name, email, password, role } = result.data;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError("Email already registered", 409);
    }

    const auth = getAuth();
    let baResult;
    try {
      baResult = await auth.api.signUpEmail({
        body: { name, email, password },
        headers: new Headers(),
      });
    } catch (authError) {
      if (authError.message?.includes("already") || authError.message?.includes("exists")) {
        throw new ApiError("Email already registered", 409);
      }
      throw authError;
    }

    const user = await User.create({
      name,
      email,
      role,
      avatar: null,
      bio: "",
    });

    if (baResult?.token) {
      res.setHeader(
        "Set-Cookie",
        `better-auth.session_token=${baResult.token}; Path=/; HttpOnly${getCookieFlags()}`
      );
    }

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        },
        token: baResult?.token || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError("Email and password are required", 400);
    }

    const auth = getAuth();
    let baResult;
    try {
      baResult = await auth.api.signInEmail({
        body: { email, password },
        headers: new Headers(),
      });
    } catch (authError) {
      throw new ApiError("Invalid email or password", 401);
    }

    const user = await User.findOne({ email });

    if (baResult?.token) {
      res.setHeader(
        "Set-Cookie",
        `better-auth.session_token=${baResult.token}; Path=/; HttpOnly${getCookieFlags()}`
      );
    }

    res.json({
      success: true,
      message: "Signed in successfully",
      data: {
        user: user
          ? {
              id: user._id,
              name: user.name,
              email: user.email,
              role: user.role,
              avatar: user.avatar,
              isVerifiedWriter: user.isVerifiedWriter,
            }
          : null,
        token: baResult?.token || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getSession = async (req, res) => {
  if (!req.user) {
    return res.json({ success: true, data: { user: null, session: null } });
  }

  const user = await User.findOne({ email: req.user.email });

  res.json({
    success: true,
    data: {
      user: user
        ? {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            bio: user.bio,
            isVerifiedWriter: user.isVerifiedWriter,
            createdAt: user.createdAt,
          }
        : null,
      session: req.session,
    },
  });
};

export const logout = async (req, res, next) => {
  try {
    let sessionToken = null;
    if (req.headers.cookie) {
      const cookies = req.headers.cookie.split(";").map((c) => c.trim());
      for (const cookie of cookies) {
        const [name, value] = cookie.split("=");
        if (name === "better-auth.session_token") {
          sessionToken = value;
          break;
        }
      }
    }

    if (sessionToken) {
      const mongoose = await import("mongoose");
      const db = mongoose.default.connection.db;
      await db.collection("session").deleteOne({ token: sessionToken });
    }

    res.setHeader(
      "Set-Cookie",
      `better-auth.session_token=; Path=/; HttpOnly; Max-Age=0${getCookieFlags()}`
    );
    res.json({ success: true, message: "Signed out successfully" });
  } catch (error) {
    next(error);
  }
};
