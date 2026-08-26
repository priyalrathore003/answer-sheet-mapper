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

/**
 * Disk cache keyed on every input that affects the output (model, prompt,
 * schema, and image bytes if any). Re-running the same extraction during
 * development never re-spends free-tier quota.
 */
export async function cachedGenerateContent(params: GenerateParams): Promise<string> {
  await mkdir(CACHE_DIR, { recursive: true });

  const hash = createHash("sha256");
  hash.update(params.model);
  hash.update(params.promptVersion);
  hash.update(params.systemInstruction);
  hash.update(params.prompt);
  hash.update(JSON.stringify(params.responseSchema));
  if (params.imageBytes) hash.update(params.imageBytes);
  const cacheKey = hash.digest("hex");
  const cachePath = path.join(CACHE_DIR, `${cacheKey}.json`);

  try {
    const cached = await readFile(cachePath, "utf-8");
    console.log(`[gemini cache] HIT  ${cacheKey.slice(0, 12)}`);
    return cached;
  } catch {
    // fall through to live call
  }

  console.log(`[gemini cache] MISS ${cacheKey.slice(0, 12)} — calling Gemini API`);
  const client = getGeminiClient();

  const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [];
  if (params.imageBytes && params.imageMimeType) {
    parts.push({ inlineData: { data: params.imageBytes.toString("base64"), mimeType: params.imageMimeType } });
  }
  parts.push({ text: params.prompt });

  const response = await client.models.generateContent({
    model: params.model,
    contents: [{ role: "user", parts }],
    config: {
      systemInstruction: params.systemInstruction,
      responseMimeType: "application/json",
      responseSchema: params.responseSchema as any,
      temperature: 0,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini returned an empty response");
  }

  await writeFile(cachePath, text, "utf-8");
  return text;
}
