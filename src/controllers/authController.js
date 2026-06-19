import { getAuth } from "../config/auth.js";
import { ApiError } from "../utils/ApiError.js";
import User from "../models/User.js";
import { registerSchema } from "../validators/auth.js";

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
    const session = await auth.api.signUpEmail({
      name,
      email,
      password,
    });

    const user = await User.create({
      name,
      email,
      role,
      avatar: null,
    });

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
        session: session.session,
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
    const session = await auth.api.signInEmail({
      email,
      password,
    });

    const user = await User.findOne({ email });

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
        session: session.session,
      },
    });
  } catch (error) {
    if (error.message?.includes("Invalid")) {
      throw new ApiError("Invalid email or password", 401);
    }
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
            isVerifiedWriter: user.isVerifiedWriter,
          }
        : null,
      session: req.session,
    },
  });
};

export const logout = async (req, res, next) => {
  try {
    const auth = getAuth();
    await auth.api.signOut({
      headers: req.headers,
    });
    res.json({ success: true, message: "Signed out successfully" });
  } catch (error) {
    next(error);
  }
};
