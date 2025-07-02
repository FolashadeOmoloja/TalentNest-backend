import rateLimit from "express-rate-limit";
import Admin from "../models/admin.model.js";

let totalCallsToday = 0;
const MAX_GLOBAL_CALLS = 15;
const DAILY_RESET = 24 * 60 * 60 * 1000;

setInterval(() => {
  totalCallsToday = 0;
}, DAILY_RESET);

// Middleware to check if user is super admin
export const checkIfSuperAdmin = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.id);
    if (admin?.accountRole === "SuperAdmin") {
      req.isSuperAdmin = true;
    } else {
      req.isSuperAdmin = false;
    }
  } catch {
    req.isSuperAdmin = false;
  }
  next();
};

// Per-user limiter
export const perUserLimiter = rateLimit({
  windowMs: DAILY_RESET,
  max: 2,
  keyGenerator: (req) => req.id || req.ip,
  skip: (req) => req.isSuperAdmin, // uses flag set by previous middleware
  handler: (req, res) =>
    res.status(429).json({
      success: false,
      message: "Daily limit reached. Try again tomorrow.",
    }),
});

// Global limiter
export const globalLimiter = (req, res, next) => {
  if (req.isSuperAdmin) return next();

  if (totalCallsToday >= MAX_GLOBAL_CALLS) {
    return res.status(429).json({
      success: false,
      message: "Global usage limit for today reached. Try again tomorrow.",
    });
  }

  totalCallsToday++;
  next();
};
