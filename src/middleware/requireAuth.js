import { ApiError } from "../utils/ApiError.js";

const requireAuth = (req, res, next) => {
  if (!req.user) {
    throw new ApiError("Not authenticated. Please sign in.", 401);
  }
  next();
};

export default requireAuth;
