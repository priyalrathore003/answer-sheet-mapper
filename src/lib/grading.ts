import { Type } from "@google/genai";
import { cachedGenerateContent } from "./gemini";
import type { GradeVerdict, GradingResult } from "./types";

export const GRADING_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";
export const GRADING_PROMPT_VERSION = "v1";

const GRADING_SYSTEM_INSTRUCTION = `You are an experienced exam grader reviewing a student's short answers. No official answer key is provided — grade each answer using your own subject-matter knowledge of what a correct answer looks like.

For every item, return:
- id: echo back the id you were given for that item, unchanged.
- verdict: "correct", "partially_correct", "incorrect", or "ungradable" (use "ungradable" only if the question or answer text is too garbled/incomplete to judge).
- feedback: one short sentence (max ~25 words) explaining the verdict and, if not fully correct, what was missing or wrong.

Be fair and concise. Judge substance, not handwriting or spelling.`;

const GRADING_RESPONSE_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING },
      verdict: { type: Type.STRING, enum: ["correct", "partially_correct", "incorrect", "ungradable"] },
      feedback: { type: Type.STRING },
    },
    required: ["id", "verdict", "feedback"],
  },
};

export interface GradingInput {
  id: string;
  questionLabel: string;
  questionText: string;
  answerText: string;
}

/** Grade a batch of question/answer pairs in a single text-only call (cheap, no image). */
export async function gradeAnswers(items: GradingInput[]): Promise<GradingResult[]> {
  if (items.length === 0) return [];

  const prompt = `Grade these ${items.length} question/answer pairs and return the JSON array described in the system instructions:\n\n${items
    .map((it) => `id: ${it.id}\nquestion (${it.questionLabel}): ${it.questionText}\nstudent's answer: ${it.answerText || "(blank)"}`)
    .join("\n\n")}`;

  const rawText = await cachedGenerateContent({
    model: GRADING_MODEL,
    promptVersion: GRADING_PROMPT_VERSION,
    systemInstruction: GRADING_SYSTEM_INSTRUCTION,
    prompt,
    responseSchema: GRADING_RESPONSE_SCHEMA,
  });

  const parsed = JSON.parse(rawText) as Array<{ id: string; verdict: GradeVerdict; feedback: string }>;
  return parsed.map((p) => ({ questionId: p.id, verdict: p.verdict, feedback: p.feedback }));
}
