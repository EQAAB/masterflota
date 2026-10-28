import OpenAI from "openai";
import { env } from "../../config/env";

export class AiDisabledError extends Error {
  readonly statusCode = 503;

  constructor(message = "AI features are not configured. Set OPENAI_API_KEY and AI_FEATURES_ENABLED=true in backend/.env.") {
    super(message);
    this.name = "AiDisabledError";
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
    client = new OpenAI({ apiKey: env.openaiApiKey });
  }
  return client;
}

export async function chatJsonCompletion(params: {
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<string> {
  const openai = getOpenAIClient();
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
    throw new Error("OpenAI returned an empty response");
  }
  return text;
}
