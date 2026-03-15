import rateLimit from "express-rate-limit";

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, forwardedHeader: false },
  message: {
    error: "Too many requests",
    message: "You have exceeded the rate limit. Please try again later.",
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, forwardedHeader: false },
  message: {
    error: "Too many requests",
    message: "Too many authentication attempts. Please try again later.",
  },
});
