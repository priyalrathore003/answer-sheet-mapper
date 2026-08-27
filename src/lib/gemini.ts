import { GoogleGenAI } from "@google/genai";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

// Vercel's serverless filesystem is read-only except /tmp. Locally we use a
// project-relative folder so the cache survives across dev-server restarts
// (the whole point: don't re-spend free-tier quota re-running the UI).
const CACHE_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), "gemini-cache")
  : path.join(process.cwd(), ".cache", "gemini");

// Used only if the primary model's free-tier quota is exhausted mid-run.
// Not the default: it measurably loses some label-attribution accuracy
// on paragraph answers and can misread blank/bleed-through pages, per
// direct A/B testing against the primary model on real scanned data.
// It's a "keep working, degraded" path, not a quality-equal swap.
const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || "gemini-3.1-flash-lite";

export function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set (expected in .env.local)");
  }
  return new GoogleGenAI({ apiKey });
}

interface GenerateParams {
  model: string;
  promptVersion: string;
  systemInstruction: string;
  prompt: string;
  responseSchema: unknown;
  imageBytes?: Buffer;
  imageMimeType?: string;
}

type Part = { text: string } | { inlineData: { data: string; mimeType: string } };

function isQuotaExhausted(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return message.includes("RESOURCE_EXHAUSTED") || message.includes('"code":429') || message.includes(" 429 ");
}

async function cacheKeyFor(model: string, params: GenerateParams): Promise<string> {
  const hash = createHash("sha256");
  hash.update(model);
  hash.update(params.promptVersion);
  hash.update(params.systemInstruction);
  hash.update(params.prompt);
  hash.update(JSON.stringify(params.responseSchema));
  if (params.imageBytes) hash.update(params.imageBytes);
  return hash.digest("hex");
}

async function readCache(key: string): Promise<string | null> {
  try {
    const cached = await readFile(path.join(CACHE_DIR, `${key}.json`), "utf-8");
    console.log(`[gemini cache] HIT  ${key.slice(0, 12)}`);
    return cached;
  } catch {
    return null;
  }
}

async function writeCache(key: string, text: string): Promise<void> {
  await writeFile(path.join(CACHE_DIR, `${key}.json`), text, "utf-8");
}

async function callModel(model: string, systemInstruction: string, prompt_: string, parts: Part[], responseSchema: unknown): Promise<string> {
  const client = getGeminiClient();
  const response = await client.models.generateContent({
    model,
    contents: [{ role: "user", parts }],
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: responseSchema as any,
      temperature: 0,
    },
  });
  const text = response.text;
  if (!text) throw new Error("Gemini returned an empty response");
  return text;
}

/**
 * Disk cache keyed on every input that affects the output (model, prompt,
 * schema, and image bytes if any). Re-running the same extraction during
 * development never re-spends free-tier quota.
 *
 * If the primary model's free-tier quota is exhausted (429 /
 * RESOURCE_EXHAUSTED), automatically retries once against FALLBACK_MODEL
 * so a burst of testing or traffic degrades gracefully instead of failing
 * outright. The fallback result is cached under its own model-specific
 * key, so it never contaminates or gets confused with the primary model's
 * cache entries.
 */
export async function cachedGenerateContent(params: GenerateParams): Promise<string> {
  await mkdir(CACHE_DIR, { recursive: true });

  const parts: Part[] = [];
  if (params.imageBytes && params.imageMimeType) {
    parts.push({ inlineData: { data: params.imageBytes.toString("base64"), mimeType: params.imageMimeType } });
  }
  parts.push({ text: params.prompt });

  const primaryKey = await cacheKeyFor(params.model, params);
  const cachedPrimary = await readCache(primaryKey);
  if (cachedPrimary) return cachedPrimary;

  try {
    console.log(`[gemini cache] MISS ${primaryKey.slice(0, 12)} — calling ${params.model}`);
    const text = await callModel(params.model, params.systemInstruction, params.prompt, parts, params.responseSchema);
    await writeCache(primaryKey, text);
    return text;
  } catch (err) {
    if (!isQuotaExhausted(err) || params.model === FALLBACK_MODEL) throw err;

    console.warn(`[gemini] ${params.model} quota exhausted — falling back to ${FALLBACK_MODEL}`);
    const fallbackKey = await cacheKeyFor(FALLBACK_MODEL, params);
    const cachedFallback = await readCache(fallbackKey);
    if (cachedFallback) return cachedFallback;

    const text = await callModel(FALLBACK_MODEL, params.systemInstruction, params.prompt, parts, params.responseSchema);
    await writeCache(fallbackKey, text);
    return text;
  }
}
