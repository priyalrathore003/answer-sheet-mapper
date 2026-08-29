"use client";

import { useMemo, useState } from "react";
import type { ProcessResult } from "@/lib/types";
import { QuestionList, type Selection } from "./QuestionList";
import { AnswerSheetViewer } from "./AnswerSheetViewer";
import { GradingSummary } from "./GradingSummary";

interface Props {
  result: ProcessResult;
  onReset: () => void;
}

type MobileTab = "questions" | "sheet";

export function ResultsView({ result, onReset }: Props) {
  const [selection, setSelection] = useState<Selection>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [mobileTab, setMobileTab] = useState<MobileTab>("questions");

  const highlighted = useMemo(() => {
    if (!selection) return [];
    if (selection.kind === "question") {
      return result.mapping.mapped.find((m) => m.question.id === selection.id)?.answers ?? [];
    }
    const orphan = result.mapping.orphanAnswers.find((a) => a.id === selection.id);
    return orphan ? [orphan] : [];
  }, [selection, result]);

  function handleSelect(next: Selection) {
    setSelection(next);
    if (next) {
      const answers =
        next.kind === "question"
          ? result.mapping.mapped.find((m) => m.question.id === next.id)?.answers ?? []
          : result.mapping.orphanAnswers.filter((a) => a.id === next.id);
      if (answers[0]) setCurrentPageIndex(answers[0].pageIndex);
      // On mobile, jump straight to the highlighted region rather than
      // making the teacher tap a second control to see it.
      setMobileTab("sheet");
    }
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-6xl">
      <div className="flex items-center justify-end">
        <button onClick={onReset} className="text-sm font-medium text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200">
          Start over
        </button>
      </div>
      {result.gradingSkippedReason && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
          Grading was skipped. {result.gradingSkippedReason}
        </p>
      )}
      <GradingSummary mapped={result.mapping.mapped} grading={result.grading} />

      <div className="lg:hidden flex rounded-lg bg-neutral-100 dark:bg-neutral-900 p-1">
        {(["questions", "sheet"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setMobileTab(tab)}
            className={
              "flex-1 text-sm font-medium py-1.5 rounded-md transition-colors " +
              (mobileTab === tab
                ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm"
                : "text-neutral-500")
            }
          >
            {tab === "questions" ? "Questions" : "Answer Sheet"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={mobileTab === "questions" ? "block" : "hidden lg:block"}>
          <QuestionList
            mapped={result.mapping.mapped}
            orphanAnswers={result.mapping.orphanAnswers}
            grading={result.grading}
            selection={selection}
            onSelect={handleSelect}
          />
        </div>
        <div className={(mobileTab === "sheet" ? "block" : "hidden lg:block") + " lg:sticky lg:top-4 self-start"}>
          <AnswerSheetViewer
            pages={result.answerPages}
            currentPageIndex={currentPageIndex}
            onPageChange={setCurrentPageIndex}
            highlighted={highlighted}
          />
        </div>
      </div>
    </div>
  );
}
