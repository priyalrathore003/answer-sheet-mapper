import type { AnswerRegion, MappedQuestion, MappingResult, Question } from "./types";

/**
 * Collapse different ways of writing the same label down to one comparable
 * key: "11(a)", "11 a", "11a)", "Q11a", and "Ans. 11(a)" all become "11a".
 * This is what lets matching survive a student's slightly different
 * notation from the question paper's — including students who label their
 * answers by what they're answering ("Ans", "Answer", "Sol") rather than
 * echoing the question's own numbering style.
 */
export function normalizeLabel(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^(answer|ans|solution|sol|question|q)s?\.?:?\s*/, "")
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Match answer regions to questions by normalized label. Every requirement
 * from the brief falls out of this being label-based rather than
 * position/order-based:
 * - answers out of order: label lookup doesn't care about array order.
 * - questions with no answer: the label simply has no entries -> "unanswered".
 * - answers matching no question: collected separately as orphanAnswers.
 * - answers spanning multiple pages: same label, entries on >1 pageIndex -> "answered_multi_page".
 */
export function mapAnswersToQuestions(questions: Question[], answers: AnswerRegion[]): MappingResult {
  // Gemini sometimes reports a printed-but-unfilled row (e.g. "18." with
  // nothing written after it) as its own region with empty text — that's
  // an honest signal, not a hallucination, but it means "no answer" to us.
  const nonBlankAnswers = answers.filter((a) => a.text.trim().length > 0);

  const answersByLabel = new Map<string, AnswerRegion[]>();
  for (const answer of nonBlankAnswers) {
    const key = normalizeLabel(answer.questionLabel);
    if (!key) continue;
    const bucket = answersByLabel.get(key);
    if (bucket) bucket.push(answer);
    else answersByLabel.set(key, [answer]);
  }

  const matchedKeys = new Set<string>();
  const mapped: MappedQuestion[] = questions.map((question) => {
    const key = normalizeLabel(question.label);
    const matches = answersByLabel.get(key) ?? [];
    if (matches.length > 0) matchedKeys.add(key);

    if (matches.length === 0) {
      return { question, status: "unanswered", answers: [] };
    }
    const distinctPages = new Set(matches.map((m) => m.pageIndex));
    return {
      question,
      status: distinctPages.size > 1 ? "answered_multi_page" : "answered",
      answers: matches,
    };
  });

  const orphanAnswers = nonBlankAnswers.filter((answer) => {
    const key = normalizeLabel(answer.questionLabel);
    return !key || !matchedKeys.has(key);
  });

  return { mapped, orphanAnswers };
}
