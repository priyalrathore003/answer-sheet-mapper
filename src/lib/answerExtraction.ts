import { Type } from "@google/genai";
import { cachedGenerateContent } from "./gemini";

// Bump this whenever the prompt or schema changes, so stale disk cache
// entries from an older prompt version don't get reused silently.
export const ANSWER_PROMPT_VERSION = "v3";

export const ANSWER_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";

export const ANSWER_SYSTEM_INSTRUCTION = `You are reading a single page from a student's handwritten exam answer sheet.

For every distinct handwritten answer region on the page, return one entry with:
- question_label: the question number/letter the student wrote next to the answer, exactly as written (e.g. "1", "2.", "Q3", "11(a)"). If no label is visible for a region, use an empty string.
- answer_text: your best transcription of the handwritten answer text in that region.
- box_2d: a tight bounding box around ONLY that answer's handwriting (not the whole page, not the margin), as [ymin, xmin, ymax, xmax] normalized to 0-1000, where [0,0] is the top-left corner of the image.

Rules:
- Treat each visually distinct answer block as its own entry, even if two blocks share the same question_label (e.g. an answer that continues after a diagram).
- Do not invent answers for blank space.
- Do not return a bounding box for the whole page or for printed page furniture (headers, footers, page numbers).
- Limit to the 25 most prominent answer regions on the page.
- Never return segmentation masks, only box_2d.
- Be especially careful with vertical (y) placement when many short answers are stacked closely (e.g. a list of one-line MCQ answers) — each box's top and bottom edge must line up with that exact row's handwriting, not a neighboring row.`;

export function buildAnswerPrompt(pageIndex: number) {
  return `This image is page ${pageIndex} of the student's answer sheet. Detect every handwritten answer region and return the JSON array described in the system instructions.`;
}

export const ANSWER_RESPONSE_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      question_label: { type: Type.STRING },
      answer_text: { type: Type.STRING },
      box_2d: {
        type: Type.ARRAY,
        items: { type: Type.INTEGER },
        minItems: 4,
        maxItems: 4,
      },
    },
    required: ["question_label", "answer_text", "box_2d"],
  },
};

export interface RawAnswerBox {
  question_label: string;
  answer_text: string;
  box_2d: [number, number, number, number]; // ymin, xmin, ymax, xmax normalized 0-1000
}

/** Extract every handwritten answer region on one answer-sheet page. */
export async function extractAnswerBoxesForPage(
  imageBytes: Buffer,
  imageMimeType: string,
  pageIndex: number
): Promise<RawAnswerBox[]> {
  const rawText = await cachedGenerateContent({
    model: ANSWER_MODEL,
    promptVersion: ANSWER_PROMPT_VERSION,
    systemInstruction: ANSWER_SYSTEM_INSTRUCTION,
    prompt: buildAnswerPrompt(pageIndex),
    imageBytes,
    imageMimeType,
    responseSchema: ANSWER_RESPONSE_SCHEMA,
  });
  return JSON.parse(rawText) as RawAnswerBox[];
}
