import env from "../config/env.js";

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  if (err.name === "ValidationError") {
    statusCode = 400;
    const messages = Object.values(err.errors || {}).map((e) => e.message);
    message = messages.join(", ") || "Validation Error";
  }

  if (err.name === "ZodError") {
    statusCode = 400;
    const messages = err.issues.map((i) => i.message);
    message = messages.join(", ") || "Validation Error";
  }

  if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid input provided";
  }

  if (err.code === 11000) {
    statusCode = 409;
    message = "A record with this value already exists";
  }

  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
  }

  if (env.NODE_ENV === "development") {
    console.error("ERROR:", err);
  }

  if (env.NODE_ENV === "production" && statusCode === 500) {
    message = "Something went wrong. Please try again later.";
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

export default errorHandler;
