import OpenAI from "openai";
import { env } from "../../config/env";

export class AiDisabledError extends Error {
  readonly statusCode = 503;

  constructor(
    message = "AI features are not configured. Set OPENAI_API_KEY and AI_FEATURES_ENABLED=true in backend/.env (optional OPENAI_BASE_URL for Groq or other OpenAI-compatible providers).",
  ) {
    super(message);
    this.name = "AiDisabledError";
  }
}

export class AiRateLimitError extends Error {
  readonly statusCode = 429;

  constructor(
    message = "AI provider rate limit reached. Please try again in a minute.",
  ) {
    super(message);
    this.name = "AiRateLimitError";
  }
}

export function isAiEnabled(): boolean {
  return env.aiFeaturesEnabled && Boolean(env.openaiApiKey);
}

export function assertAiEnabled(): void {
  if (!isAiEnabled()) {
    throw new AiDisabledError();
  }
}

let client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  assertAiEnabled();
  if (!client) {
    client = new OpenAI({
      apiKey: env.openaiApiKey,
      ...(env.openaiBaseUrl ? { baseURL: env.openaiBaseUrl } : {}),
    });
  }
  return client;
}

function isProviderRateLimit(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { status?: number; statusCode?: number; code?: string };
  return e.status === 429 || e.statusCode === 429 || e.code === "rate_limit_exceeded";
}

export async function chatJsonCompletion(params: {
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<string> {
  const openai = getOpenAIClient();
  try {
    const completion = await openai.chat.completions.create({
      model: env.openaiModel,
      temperature: 0.2,
      max_tokens: params.maxTokens ?? 800,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: params.system },
        { role: "user", content: params.user },
      ],
    });
    const text = completion.choices[0]?.message?.content?.trim();
    if (!text) {
      throw new Error("AI provider returned an empty response");
    }
    return text;
  } catch (err) {
    if (err instanceof AiRateLimitError || err instanceof AiDisabledError) {
      throw err;
    }
    if (isProviderRateLimit(err)) {
      throw new AiRateLimitError(
        err instanceof Error ? err.message : undefined,
      );
    }
    throw err;
  }
}
