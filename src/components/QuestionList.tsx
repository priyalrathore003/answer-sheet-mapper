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

function StatusBadge({ status }: { status: MappedQuestion["status"] }) {
  const styles: Record<MappedQuestion["status"], string> = {
    answered: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
    answered_multi_page: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
    unanswered: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
  };
  const text: Record<MappedQuestion["status"], string> = {
    answered: "Answered",
    answered_multi_page: "Spans pages",
    unanswered: "No answer",
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${styles[status]}`}>{text[status]}</span>;
}

function GradeBadge({ result }: { result?: GradingResult }) {
  if (!result) return null;
  const styles: Record<GradingResult["verdict"], string> = {
    correct: "bg-green-500",
    partially_correct: "bg-yellow-500",
    incorrect: "bg-red-500",
    ungradable: "bg-neutral-400",
  };
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full shrink-0 ${styles[result.verdict]}`}
      title={result.feedback}
    />
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
          <button
            key={question.id}
            disabled={!clickable}
            onClick={() => onSelect(clickable ? { kind: "question", id: question.id } : null)}
            className={
              "text-left rounded-lg px-3 py-2.5 border transition-colors " +
              (isSelected
                ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30"
                : "border-transparent hover:bg-neutral-50 dark:hover:bg-neutral-900") +
              (clickable ? " cursor-pointer" : " cursor-default")
            }
          >
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-medium shrink-0">{question.label}</span>
              <span className="text-sm text-neutral-600 dark:text-neutral-400 truncate flex-1">{question.text}</span>
              <GradeBadge result={gradeResult} />
              <StatusBadge status={status} />
            </div>
            {gradeResult && (
              <p className="text-xs text-neutral-500 mt-1 pl-7">{gradeResult.feedback}</p>
            )}
            {isSelected && answers.length > 0 && (
              <p className="text-xs text-neutral-500 mt-1 pl-7 italic">&ldquo;{answers[0].text}&rdquo;</p>
            )}
          </button>
        );
      })}

      {orphanAnswers.length > 0 && (
        <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
          <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-2">
            {orphanAnswers.length} answer{orphanAnswers.length > 1 ? "s" : ""} didn&apos;t match any question
          </p>
          {orphanAnswers.map((answer) => {
            const isSelected = selection?.kind === "orphan" && selection.id === answer.id;
            return (
              <button
                key={answer.id}
                onClick={() => onSelect({ kind: "orphan", id: answer.id })}
                className={
                  "text-left w-full rounded-lg px-3 py-2 border transition-colors " +
                  (isSelected
                    ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30"
                    : "border-transparent hover:bg-neutral-50 dark:hover:bg-neutral-900")
                }
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-medium shrink-0 text-amber-700 dark:text-amber-400">
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
