import { filesToPngPages, pngToDataUrl } from "@/lib/files";
import { extractQuestionsForPage } from "@/lib/questionExtraction";
import { extractAnswerBoxesForPage } from "@/lib/answerExtraction";
import { mapAnswersToQuestions, normalizeLabel } from "@/lib/mapping";
import { gradeAnswers } from "@/lib/grading";
import type { AnswerRegion, ProcessEvent, ProcessResult, Question } from "@/lib/types";

// Needs Node APIs (mupdf, sharp, the Gemini SDK) — not compatible with the edge runtime.
export const runtime = "nodejs";
// Vercel's Hobby plan hard-caps serverless functions at 60s regardless of
// this value; pages are extracted in parallel (not sequentially) precisely
// so a multi-page document has a real chance of finishing inside that.
export const maxDuration = 60;

export async function POST(req: Request) {
  const formData = await req.formData();
  const questionFiles = formData.getAll("questionFiles").filter((f): f is File => f instanceof File);
  const answerFiles = formData.getAll("answerFiles").filter((f): f is File => f instanceof File);
  const gradeEnabled = formData.get("grade") === "true";

  if (questionFiles.length === 0 || answerFiles.length === 0) {
    return new Response(JSON.stringify({ error: "Both a question paper and an answer sheet are required." }), {
      status: 400,
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: ProcessEvent) => controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));

      try {
        send({ type: "progress", step: "loading", message: "Reading uploaded files…" });
        const [questionPages, answerPages] = await Promise.all([
          filesToPngPages(questionFiles),
          filesToPngPages(answerFiles),
        ]);

        // Pages within each document are extracted in parallel — these are
        // independent Gemini calls, and running them one-at-a-time was the
        // direct cause of a real multi-page document exceeding Vercel's
        // serverless time limit and hanging the client forever mid-stream.
        send({
          type: "progress",
          step: "extracting_questions",
          message: `Extracting questions from ${questionPages.length} page${questionPages.length > 1 ? "s" : ""}…`,
        });
        let questionsDone = 0;
        const questionResults = await Promise.all(
          questionPages.map(async (page, i) => {
            const raw = await extractQuestionsForPage(page, "image/png", i + 1);
            questionsDone++;
            send({
              type: "progress",
              step: "extracting_questions",
              message: `Extracted questions — page ${i + 1} done (${questionsDone}/${questionPages.length})`,
            });
            return raw.map((rq, idx) => ({
              id: `${normalizeLabel(rq.label) || "q"}-${i}-${idx}`,
              label: rq.label,
              text: rq.text,
              pageIndex: i,
            }));
          })
        );
        const questions: Question[] = questionResults.flat();

        send({
          type: "progress",
          step: "extracting_answers",
          message: `Extracting answers from ${answerPages.length} page${answerPages.length > 1 ? "s" : ""}…`,
        });
        let answersDone = 0;
        const answerResults = await Promise.all(
          answerPages.map(async (page, i) => {
            const raw = await extractAnswerBoxesForPage(page, "image/png", i + 1);
            answersDone++;
            send({
              type: "progress",
              step: "extracting_answers",
              message: `Extracted answers — page ${i + 1} done (${answersDone}/${answerPages.length})`,
            });
            return raw.map((ra, idx) => ({
              id: `a-${i}-${idx}`,
              questionLabel: ra.question_label,
              text: ra.answer_text,
              pageIndex: i,
              box: ra.box_2d,
            }));
          })
        );
        const answers: AnswerRegion[] = answerResults.flat();

        send({ type: "progress", step: "mapping", message: "Mapping answers to questions…" });
        const mapping = mapAnswersToQuestions(questions, answers);

        let grading: ProcessResult["grading"] = [];
        if (gradeEnabled) {
          send({ type: "progress", step: "grading", message: "Grading answers…" });
          const gradableItems = mapping.mapped
            .filter((m) => m.status !== "unanswered")
            .map((m) => ({
              id: m.question.id,
              questionLabel: m.question.label,
              questionText: m.question.text,
              answerText: m.answers.map((a) => a.text).join(" "),
            }));
          grading = await gradeAnswers(gradableItems);
        }

        const answerPageImages = answerPages.map((buf, i) => ({
          pageIndex: i,
          imageDataUrl: pngToDataUrl(buf),
        }));

        const result: ProcessResult = { questions, answerPages: answerPageImages, mapping, grading };
        send({ type: "done", result });
      } catch (err) {
        send({ type: "error", message: err instanceof Error ? err.message : String(err) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-cache" },
  });
}
