"use client";

import type { GradingResult, MappedQuestion } from "@/lib/types";

interface Props {
  mapped: MappedQuestion[];
  grading: GradingResult[];
}

/**
 * The brief's optional grading scope explicitly calls out "a clear grading
 * summary" alongside per-question feedback. This is that summary: derived
 * client-side from the already-fetched grading results, so it costs no
 * extra Gemini call.
 */
export function GradingSummary({ mapped, grading }: Props) {
  if (grading.length === 0) return null;

  const counts = { correct: 0, partially_correct: 0, incorrect: 0, ungradable: 0 };
  let marksAwarded = 0;
  let maxMarks = 0;
  for (const g of grading) {
    counts[g.verdict]++;
    marksAwarded += g.marksAwarded;
    maxMarks += g.maxMarks;
  }

  const totalQuestions = mapped.length;
  const answered = mapped.filter((m) => m.status !== "unanswered").length;

  const stats: { label: string; value: string; tone: string }[] = [
    { label: "Total score", value: `${marksAwarded} / ${maxMarks}`, tone: "text-neutral-900 dark:text-white" },
    { label: "Correct", value: String(counts.correct), tone: "text-green-700 dark:text-green-400" },
    { label: "Partially correct", value: String(counts.partially_correct), tone: "text-yellow-700 dark:text-yellow-400" },
    { label: "Incorrect", value: String(counts.incorrect), tone: "text-red-700 dark:text-red-400" },
    { label: "Answered / Total", value: `${answered} / ${totalQuestions}`, tone: "text-neutral-600 dark:text-neutral-300" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-px bg-neutral-200 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden mb-2">
      {stats.map((s) => (
        <div key={s.label} className="bg-white dark:bg-neutral-950 px-4 py-3">
          <div className="text-xs text-neutral-500">{s.label}</div>
          <div className={`text-lg font-semibold tabular-nums ${s.tone}`}>{s.value}</div>
        </div>
      ))}
    </div>
  );
}
