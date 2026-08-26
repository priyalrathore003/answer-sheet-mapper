import { filesToPngPages, pngToDataUrl } from "@/lib/files";
import { extractQuestionsForPage } from "@/lib/questionExtraction";
import { extractAnswerBoxesForPage } from "@/lib/answerExtraction";
import { mapAnswersToQuestions, normalizeLabel } from "@/lib/mapping";
import { gradeAnswers } from "@/lib/grading";
import type { AnswerRegion, ProcessEvent, ProcessResult, Question } from "@/lib/types";

// Needs Node APIs (mupdf, sharp, the Gemini SDK) — not compatible with the edge runtime.
export const runtime = "nodejs";
export const maxDuration = 120;

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

        const questions: Question[] = [];
        for (let i = 0; i < questionPages.length; i++) {
          send({
            type: "progress",
            step: "extracting_questions",
            message: `Extracting questions (page ${i + 1}/${questionPages.length})…`,
          });
          const raw = await extractQuestionsForPage(questionPages[i], "image/png", i + 1);
          raw.forEach((rq, idx) => {
            questions.push({
              id: `${normalizeLabel(rq.label) || "q"}-${i}-${idx}`,
              label: rq.label,
              text: rq.text,
              pageIndex: i,
            });
          });
        }

        const answers: AnswerRegion[] = [];
        for (let i = 0; i < answerPages.length; i++) {
          send({
            type: "progress",
            step: "extracting_answers",
            message: `Extracting answers (page ${i + 1}/${answerPages.length})…`,
          });
          const raw = await extractAnswerBoxesForPage(answerPages[i], "image/png", i + 1);
          raw.forEach((ra, idx) => {
            answers.push({
              id: `a-${i}-${idx}`,
              questionLabel: ra.question_label,
              text: ra.answer_text,
              pageIndex: i,
              box: ra.box_2d,
            });
          });
        }

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
