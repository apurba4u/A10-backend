import { ApiError } from "../utils/ApiError.js";

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError("Not authenticated", 401);
    }
    if (!roles.includes(req.user.role)) {
      throw new ApiError("Not authorized to access this resource", 403);
    }
    next();
  };
};

export default requireRole;
