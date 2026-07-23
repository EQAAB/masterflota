import rateLimit from "express-rate-limit";
import { env } from "../config/env";

/** Login attempts per IP — defaults: 10 per 15 minutes. */
export const loginRateLimiter = rateLimit({
  windowMs: env.loginRateLimitWindowMs,
  max: env.loginRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts. Please try again later." },
});
