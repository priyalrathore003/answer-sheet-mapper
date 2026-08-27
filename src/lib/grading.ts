import { Type } from "@google/genai";
import { cachedGenerateContent } from "./gemini";
import type { GradeVerdict, GradingResult } from "./types";

export const GRADING_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";
export const GRADING_PROMPT_VERSION = "v2";

const GRADING_SYSTEM_INSTRUCTION = `You are an experienced exam grader reviewing a student's short answers. No official answer key or marks scheme is provided — grade each answer using your own subject-matter knowledge of what a correct, complete answer looks like.

For every item, return:
- id: echo back the id you were given for that item, unchanged.
- max_marks: a reasonable mark value for the question's own complexity, on a 1-5 scale — a short one-fact recall or MCQ-style question is usually worth 2, a multi-part or "explain/describe/compare" question that expects several points is usually worth 4-5, a very narrow sub-part question is often worth 1-3. Be consistent: two similarly-complex questions should get the same max_marks.
- marks_awarded: an integer from 0 to max_marks reflecting how complete and correct the student's answer is.
- verdict: "correct" (marks_awarded === max_marks), "partially_correct" (0 < marks_awarded < max_marks), "incorrect" (marks_awarded === 0 and the answer is wrong/irrelevant), or "ungradable" (only if the question or answer text is too garbled/incomplete to judge — in that case max_marks/marks_awarded can both be 0).
- feedback: one short sentence (max ~25 words) explaining the score and, if marks were lost, what was missing or wrong.

Be fair and concise. Judge substance, not handwriting or spelling.`;

const GRADING_RESPONSE_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING },
      max_marks: { type: Type.INTEGER },
      marks_awarded: { type: Type.INTEGER },
      verdict: { type: Type.STRING, enum: ["correct", "partially_correct", "incorrect", "ungradable"] },
      feedback: { type: Type.STRING },
    },
    required: ["id", "max_marks", "marks_awarded", "verdict", "feedback"],
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

  const parsed = JSON.parse(rawText) as Array<{
    id: string;
    max_marks: number;
    marks_awarded: number;
    verdict: GradeVerdict;
    feedback: string;
  }>;
  return parsed.map((p) => ({
    questionId: p.id,
    verdict: p.verdict,
    maxMarks: p.max_marks,
    marksAwarded: p.marks_awarded,
    feedback: p.feedback,
  }));
}
