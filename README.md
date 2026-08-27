# Answer Sheet Mapper

A teacher uploads a question paper and one student's handwritten answer sheet (PDF or images). The app extracts every question and every handwritten answer, maps answers to questions, and — when a question is clicked — highlights the exact region of the answer sheet where that answer was written. Optional AI grading (per-question score, verdict, and short feedback, plus a summary) can be toggled on before processing.

For module boundaries, data flow, and the two algorithms that carry the actual logic (label matching, and the row-based fix for answers split across a table), see **[LLD.md](./LLD.md)**.

## Live demo

- Deployed URL: https://answer-sheet-mapper.vercel.app
- GitHub: https://github.com/priyalrathore003/answer-sheet-mapper

## Approach

**Pipeline:** `PDF/image upload → rasterize pages → question extraction → answer extraction (with bounding boxes) → label-based mapping → optional grading → results UI`

1. **Rasterization** (`src/lib/pdf.ts`, `src/lib/files.ts`) — PDFs are rendered to PNG per page with [mupdf.js](https://www.npmjs.com/package/mupdf) (a WASM build with no native dependency, so it runs on Vercel's serverless functions without a Cairo/Canvas build step). Plain image uploads pass through `sharp` for normalization. Multiple files per upload slot are supported and concatenated in order, since the brief allows either one PDF or several page images.

2. **Question extraction** (`src/lib/questionExtraction.ts`) — each question-paper page is sent to Gemini with a JSON schema (`{label, text}[]`) and instructed to preserve printed order and split labelled sub-parts (e.g. `11(a)`, `11(b)`) into separate entries, each carrying the parent question number in its label (so it can later be matched against how a student would actually write it).

3. **Answer extraction** (`src/lib/answerExtraction.ts`) — each answer-sheet page is sent to Gemini with a JSON schema (`{question_label, answer_text, box_2d}[]`). `box_2d` follows Gemini's documented convention: `[ymin, xmin, ymax, xmax]`, integers normalized 0–1000 relative to the image sent, origin top-left. The UI positions the highlight overlay with plain CSS percentages (`left: xmin/10%`, etc.), so no pixel-dimension bookkeeping is needed client-side.

4. **Mapping** (`src/lib/mapping.ts`) — a pure function that matches answers to questions by a normalized label key (strips punctuation/whitespace/case, so `"11 (a)"`, `"11a)"`, and `"Q11a"` all collapse to the same key as `"11(a)"`). Being label-based rather than position-based is what makes the required edge cases fall out naturally rather than needing special-case code:
   - **Out-of-order answers** — label lookup doesn't care about array order.
   - **Unanswered questions** — the label simply has zero matches → `status: "unanswered"`.
   - **Answers matching no question** — collected separately as `orphanAnswers`, shown in their own UI section.
   - **Answers spanning multiple pages** — same label, matches on >1 `pageIndex` → `status: "answered_multi_page"`, and the viewer shows page-switch chips marking which pages hold a piece of the answer.
   - **A printed-but-blank row** (e.g. "18." with nothing written after it) — Gemini honestly returns this as a region with empty `answer_text` rather than inventing content; the mapper treats empty-text regions as "no answer" so they don't masquerade as answered.

5. **Grading** (`src/lib/grading.ts`, optional) — one batched, text-only Gemini call grades every answered question at once (cheap: no images, one request regardless of question count) and returns a verdict + one-sentence feedback per question. No answer key is uploaded in this flow, so grading is the model's own subject-matter judgment, not a comparison against ground truth.

6. **Progress streaming** — `/api/process` returns newline-delimited JSON over a streamed `Response`; the client reads it incrementally to show live step-by-step progress (uploading → converting → extracting questions per page → extracting answers per page → mapping → grading → done).

## AI model / API used

Google Gemini (`gemini-3.6-flash` by default, overridable via `GEMINI_MODEL`), via the official `@google/genai` SDK, using `responseSchema` for structured JSON output and `temperature: 0` for consistent grounding. Confirmed against current Gemini API docs (not assumed from memory) before implementation — see the bounding-box coordinate convention above.

## Development note: disk-backed Gemini cache

Every Gemini call is cached to disk (`src/lib/gemini.ts`), keyed on a hash of the model, prompt, schema, and image bytes. Re-running the same file through the UI during development never re-spends free-tier quota. Locally this lives in `.cache/gemini/`; on Vercel (read-only filesystem outside `/tmp`) it automatically switches to `os.tmpdir()`.

## Important assumptions / limitations

- **No answer key upload** — per the assignment's scope, only a question paper and one answer sheet are uploaded. Grading is therefore the LLM's own judgment of correctness, not a comparison to a teacher-supplied key.
- **Bounding-box accuracy was verified empirically**, not assumed: an initial visual check suggested Gemini's boxes drifted on a dense list of one-line MCQ answers, but a pixel-level crop-and-inspect check showed the boxes were in fact accurate — the apparent drift was an artifact of this project's own debug-image label rendering, since fixed. Validated against a real scanned handwriting sample (Mendeley's [CC BY 4.0 student examination dataset](https://data.mendeley.com/datasets/sf3kvjwknt/1)), not synthetic text.
- **Label matching is normalization-based**, not fuzzy/semantic — it handles punctuation and spacing variants (`"11(a)"` vs `"11 a"` vs `"Q11a"`) but not, e.g., a student writing out "eleven a" in words.
- **Vercel request body limits** — file uploads go through a single serverless function call; very large multi-page scans could approach Vercel's request body ceiling. Typical single-student answer sheets (tested up to ~700KB/2 pages) are well within range.
- **No auth, no database** — per the brief; all state is in-memory for the duration of one request/response cycle.
- **Gemini free-tier rate limit (confirmed live, not theoretical)** — `gemini-3.6-flash`'s free tier caps out at a modest requests-per-window budget per API key, shared across every caller using that key (local dev, this deployment, anyone testing it). One document pair typically needs 4-6 calls (one per page extracted, plus one for grading), so a single upload comfortably fits — but back-to-back test runs in a short window can hit `RESOURCE_EXHAUSTED`. This was hit and observed directly while testing the live deployment, and it recovers on its own after a short wait (observed anywhere from ~20s to a couple minutes).
- **Automatic quota fallback** (`src/lib/gemini.ts`) — if the primary model (`gemini-3.6-flash`) returns a 429/`RESOURCE_EXHAUSTED`, the app automatically retries once against a fallback model (`gemini-3.1-flash-lite` by default, override with `GEMINI_FALLBACK_MODEL`) instead of failing the request outright. This is a deliberately *degraded, not equal* path: direct A/B testing against the same real answer sheet found the fallback model attributes paragraph-answer labels slightly less reliably, and can occasionally misread a blank page's ink bleed-through from the reverse side as real content. It's kept as a fallback (better than a hard failure under load) but not the default (accuracy is explicitly part of the evaluation, so the best-tested model leads).
