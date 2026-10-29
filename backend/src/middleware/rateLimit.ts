import rateLimit from "express-rate-limit";
import type { Request } from "express";
import { env } from "../config/env";

function userOrIpKey(req: Request): string {
  const sub = req.user?.sub;
  if (typeof sub === "string" && sub.trim()) return `user:${sub}`;
  return `ip:${req.ip || req.socket.remoteAddress || "unknown"}`;
}

/** Login attempts per IP — defaults: 10 per 15 minutes. */
export const loginRateLimiter = rateLimit({
  windowMs: env.loginRateLimitWindowMs,
  max: env.loginRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts. Please try again later." },
});

/** Payout Explainer — 5 AI requests per user per minute. */
export const aiExplainRateLimiter = rateLimit({
  windowMs: 60_000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userOrIpKey,
  validate: { keyGeneratorIpFallback: false },
  message: { message: "AI rate limit reached. Please try again in a minute." },
});

/** Ops digest — 20 requests per user per minute (AI narrative usually cached). */
export const aiOpsDigestRateLimiter = rateLimit({
  windowMs: 60_000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userOrIpKey,
  validate: { keyGeneratorIpFallback: false },
  message: { message: "AI rate limit reached. Please try again in a minute." },
});