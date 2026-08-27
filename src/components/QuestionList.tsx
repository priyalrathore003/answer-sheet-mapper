"use client";

import type { AnswerRegion, GradingResult, MappedQuestion } from "@/lib/types";

export type Selection = { kind: "question"; id: string } | { kind: "orphan"; id: string } | null;

interface Props {
  mapped: MappedQuestion[];
  orphanAnswers: AnswerRegion[];
  grading: GradingResult[];
  selection: Selection;
  onSelect: (selection: Selection) => void;
}

function ScoreBadge({ result }: { result: GradingResult }) {
  const styles: Record<GradingResult["verdict"], string> = {
    correct: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
    partially_correct: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
    incorrect: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
    ungradable: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
  };
  return (
    <span className={`text-xs font-semibold tabular-nums px-2 py-0.5 rounded-full shrink-0 ${styles[result.verdict]}`}>
      {result.marksAwarded}/{result.maxMarks}
    </span>
  );
}

function NoAnswerBadge() {
  return (
    <span className="text-xs px-2 py-0.5 rounded-full shrink-0 bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
      No answer
    </span>
  );
}

function MultiPageTag() {
  return (
    <span className="text-xs px-2 py-0.5 rounded-full shrink-0 bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300">
      Spans pages
    </span>
  );
}

export function QuestionList({ mapped, orphanAnswers, grading, selection, onSelect }: Props) {
  const gradingById = new Map(grading.map((g) => [g.questionId, g]));

  return (
    <div className="flex flex-col gap-1 w-full">
      {mapped.map(({ question, status, answers }) => {
        const isSelected = selection?.kind === "question" && selection.id === question.id;
        const clickable = status !== "unanswered";
        const gradeResult = gradingById.get(question.id);

        return (
          <div
            key={question.id}
            className={
              "rounded-lg border transition-colors " +
              (isSelected ? "border-orange-500 bg-orange-50 dark:bg-orange-950/20" : "border-transparent")
            }
          >
            <button
              disabled={!clickable}
              onClick={() => onSelect(clickable ? (isSelected ? null : { kind: "question", id: question.id }) : null)}
              className={
                "text-left w-full px-3 py-2.5 rounded-lg transition-colors " +
                (!isSelected && clickable ? "hover:bg-neutral-50 dark:hover:bg-neutral-900" : "") +
                (clickable ? " cursor-pointer" : " cursor-default")
              }
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-medium shrink-0">{question.label}</span>
                <span className="text-sm text-neutral-600 dark:text-neutral-400 truncate flex-1">{question.text}</span>
                {status === "answered_multi_page" && <MultiPageTag />}
                {gradeResult ? <ScoreBadge result={gradeResult} /> : status === "unanswered" ? <NoAnswerBadge /> : null}
              </div>
            </button>

            {isSelected && (
              <div className="px-3 pb-3 pl-9 flex flex-col gap-2">
                {answers.map((a) => (
                  <p key={a.id} className="text-sm text-neutral-700 dark:text-neutral-300 italic">
                    &ldquo;{a.text}&rdquo;
                    {answers.length > 1 && <span className="not-italic text-neutral-400"> — page {a.pageIndex + 1}</span>}
                  </p>
                ))}
                {gradeResult && (
                  <div className="text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-md px-3 py-2">
                    <span className="font-medium text-neutral-500">AI Feedback</span>
                    <p className="text-neutral-700 dark:text-neutral-300 mt-0.5">{gradeResult.feedback}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {orphanAnswers.length > 0 && (
        <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
          <p className="text-xs font-medium text-orange-700 dark:text-orange-400 mb-2">
            {orphanAnswers.length} answer{orphanAnswers.length > 1 ? "s" : ""} didn&apos;t match any question
          </p>
          {orphanAnswers.map((answer) => {
            const isSelected = selection?.kind === "orphan" && selection.id === answer.id;
            return (
              <button
                key={answer.id}
                onClick={() => onSelect(isSelected ? null : { kind: "orphan", id: answer.id })}
                className={
                  "text-left w-full rounded-lg px-3 py-2 border transition-colors " +
                  (isSelected
                    ? "border-orange-500 bg-orange-50 dark:bg-orange-950/20"
                    : "border-transparent hover:bg-neutral-50 dark:hover:bg-neutral-900")
                }
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-medium shrink-0 text-orange-700 dark:text-orange-400">
                    {answer.questionLabel || "(no label)"}
                  </span>
                  <span className="text-sm text-neutral-500 truncate flex-1">{answer.text}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
