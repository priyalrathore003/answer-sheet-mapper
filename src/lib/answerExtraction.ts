import { Type } from "@google/genai";
import { cachedGenerateContent } from "./gemini";

// Bump this whenever the prompt or schema changes, so stale disk cache
// entries from an older prompt version don't get reused silently.
export const ANSWER_PROMPT_VERSION = "v4";

export const ANSWER_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";

export const ANSWER_SYSTEM_INSTRUCTION = `You are reading a single page from a student's handwritten exam answer sheet.

For every distinct handwritten answer region on the page, return one entry with:
- question_label: the question number/letter the student wrote next to the answer, exactly as written (e.g. "1", "2.", "Q3", "11(a)"). If no label is visible for a region, use an empty string.
- answer_text: your best transcription of the handwritten answer text in that region.
- box_2d: a tight bounding box around ONLY that answer's handwriting (not the whole page, not the margin), as [ymin, xmin, ymax, xmax] normalized to 0-1000, where [0,0] is the top-left corner of the image.

Rules:
- Treat each visually distinct answer block as its own entry, even if two blocks share the same question_label (e.g. an answer that continues after a diagram).
- If a student splits one answer into side-by-side parts under a single question number (e.g. a two-column comparison table, like "Structured data | Semi-structured data" both answering the same question), give BOTH parts the SAME question_label as the labelled part — do not leave the unlabelled side blank just because the number wasn't re-written next to it.
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

/**
 * Safety net for a real failure mode the prompt alone can't fully guarantee:
 * a student splits one answer into side-by-side blocks under a single
 * question number (e.g. a two-column comparison table) and only one side
 * gets a label from the model. Any unlabelled region that shares a row with
 * — and sits immediately to the right of — a labelled region on the same
 * page inherits that label, rather than being silently dropped as an
 * "orphan" (which would also make the highlight only cover half the real
 * answer, and let grading judge an incomplete answer as if it were whole).
 *
 * Deliberately conservative: requires >50% vertical (row) overlap AND
 * horizontal adjacency, so it won't misfire on something like two
 * side-by-side MCQ columns at the same row height — those already carry
 * their own labels and are never "unlabelled" in the first place.
 */
export function reattachOrphanLabelsByRow(boxes: RawAnswerBox[]): RawAnswerBox[] {
  const labeled = boxes.filter((b) => b.question_label.trim() !== "");

  return boxes.map((box) => {
    if (box.question_label.trim() !== "") return box;

    const [yMin, xMin, yMax] = box.box_2d;
    let best: RawAnswerBox | null = null;
    let smallestGap = Infinity;

    for (const candidate of labeled) {
      const [cYMin, , cYMax, cXMax] = candidate.box_2d;
      const overlap = Math.min(yMax, cYMax) - Math.max(yMin, cYMin);
      const rowHeight = Math.min(yMax - yMin, cYMax - cYMin);
      const rowOverlapRatio = rowHeight > 0 ? overlap / rowHeight : 0;
      const gap = xMin - cXMax; // positive if candidate ends before this box starts

      if (rowOverlapRatio > 0.5 && gap >= -20 && gap < smallestGap) {
        smallestGap = gap;
        best = candidate;
      }
    }

    return best ? { ...box, question_label: best.question_label } : box;
  });
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
  const boxes = JSON.parse(rawText) as RawAnswerBox[];
  return reattachOrphanLabelsByRow(boxes);
}
