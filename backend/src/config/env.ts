import dotenv from "dotenv";

dotenv.config();

export const DEV_JWT_SECRET = "dev_jwt_secret_change_me";

const INSECURE_JWT_SECRETS = new Set([
  DEV_JWT_SECRET,
  "your_jwt_secret_change_in_production",
]);

const MIN_PRODUCTION_JWT_SECRET_LENGTH = 32;

export function resolveJwtSecret(
  raw: string | undefined,
  nodeEnv: string | undefined,
): string {
  const trimmed = raw?.trim();
  const isProduction = nodeEnv === "production";

  if (isProduction) {
    if (!trimmed) {
      throw new Error("JWT_SECRET is required when NODE_ENV=production");
    }
    if (INSECURE_JWT_SECRETS.has(trimmed)) {
      throw new Error("JWT_SECRET must not use a default or placeholder value in production");
    }
    if (trimmed.length < MIN_PRODUCTION_JWT_SECRET_LENGTH) {
      throw new Error(
        `JWT_SECRET must be at least ${MIN_PRODUCTION_JWT_SECRET_LENGTH} characters when NODE_ENV=production`,
      );
    }
    return trimmed;
  }

  if (trimmed) {
    return trimmed;
  }

  // eslint-disable-next-line no-console
  console.warn(
    "[env] JWT_SECRET is not set. Using development default. Set JWT_SECRET in backend/.env for local use.",
  );
  return DEV_JWT_SECRET;
}

let jwtSecret: string;
try {
  jwtSecret = resolveJwtSecret(process.env.JWT_SECRET, process.env.NODE_ENV);
} catch (err) {
  const message = err instanceof Error ? err.message : "Invalid JWT_SECRET configuration";
  // eslint-disable-next-line no-console
  console.error(`[env] ${message}`);
  process.exit(1);
}

export const env = {
  port: process.env.PORT ? Number(process.env.PORT) : 4100,
  databaseUrl: process.env.DATABASE_URL ?? "",
  jwtSecret,
  appVersion: process.env.APP_VERSION ?? "dev",
  appName: process.env.APP_NAME?.trim() || "Fleet Manager",
  nodeEnv: process.env.NODE_ENV ?? "development",
  corsOrigins: parseCorsOrigins(process.env.CORS_ORIGINS, process.env.NODE_ENV),
  loginRateLimitMax: parsePositiveInt(process.env.LOGIN_RATE_LIMIT_MAX, 10),
  loginRateLimitWindowMs: parsePositiveInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  anafClientId: process.env.ANAF_CLIENT_ID ?? "",
  anafClientSecret: process.env.ANAF_CLIENT_SECRET ?? "",
  anafCallbackUrl: process.env.ANAF_CALLBACK_URL ?? "",
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5173",
  openaiApiKey: process.env.OPENAI_API_KEY?.trim() ?? "",
  openaiModel: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
  aiFeaturesEnabled:
    process.env.AI_FEATURES_ENABLED === "true" &&
    Boolean(process.env.OPENAI_API_KEY?.trim()),
};

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  const n = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function parseCorsOrigins(raw: string | undefined, nodeEnv: string | undefined): string[] | true {
  const trimmed = raw?.trim();
  if (trimmed) {
    return trimmed.split(",").map((o) => o.trim()).filter(Boolean);
  }
  if (nodeEnv === "production") {
    // eslint-disable-next-line no-console
    console.warn("[env] CORS_ORIGINS is not set. Allowing all origins in production is insecure.");
    return true;
  }
  return ["http://localhost:5173", "http://127.0.0.1:5173"];
}

if (!env.databaseUrl) {
  // In dev we allow this to be empty, but log loudly to avoid confusion.
  // The app will crash on first DB use if this isn't set.
  // eslint-disable-next-line no-console
  console.warn("[env] DATABASE_URL is not set. Configure it in a .env file.");
}
