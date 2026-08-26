import { Type } from "@google/genai";
import { cachedGenerateContent } from "./gemini";

export const QUESTION_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";
export const QUESTION_PROMPT_VERSION = "v2";

export const QUESTION_SYSTEM_INSTRUCTION = `You are reading one page of a printed exam question paper.

List every question on the page IN THE ORDER THEY APPEAR, top to bottom, left column before right column if there are columns. For each question return:
- label: the question number/letter exactly as printed (e.g. "1", "11(a)", "Q3", "iv"), preserving the original punctuation style.
- text: the full text of the question itself.

Rules:
- If a question has labelled sub-parts, return each sub-part as its OWN separate entry with its own label — never merge sub-parts into one entry. The label for each sub-part MUST include the parent question number, e.g. "11(a)" and "11(b)" — NOT just "(a)" and "(b)" — because that's how a student would reference it on their answer sheet.
- Do not include running headers, footers, page numbers, marks/point annotations, or general instructions ("Answer all questions in Part A") as questions.
- Preserve the exact printed numbering — do not renumber or re-order.`;

export function buildQuestionPrompt(pageIndex: number) {
  return `This image is page ${pageIndex} of the exam question paper. List every question on this page as the JSON array described in the system instructions, in printed order.`;
}

export const QUESTION_RESPONSE_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      label: { type: Type.STRING },
      text: { type: Type.STRING },
    },
    required: ["label", "text"],
  },
};

export interface RawQuestion {
  label: string;
  text: string;
}

/** Extract every question on one question-paper page, in printed order. */
export async function extractQuestionsForPage(
  imageBytes: Buffer,
  imageMimeType: string,
  pageIndex: number
): Promise<RawQuestion[]> {
  const rawText = await cachedGenerateContent({
    model: QUESTION_MODEL,
    promptVersion: QUESTION_PROMPT_VERSION,
    systemInstruction: QUESTION_SYSTEM_INSTRUCTION,
    prompt: buildQuestionPrompt(pageIndex),
    imageBytes,
    imageMimeType,
    responseSchema: QUESTION_RESPONSE_SCHEMA,
  });
  return JSON.parse(rawText) as RawQuestion[];
}
