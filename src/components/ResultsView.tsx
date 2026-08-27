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

export function ResultsView({ result, onReset }: Props) {
  const [selection, setSelection] = useState<Selection>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

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
    }
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-6xl">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Results</h2>
        <button onClick={onReset} className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white">
          Start over
        </button>
      </div>
      <GradingSummary mapped={result.mapping.mapped} grading={result.grading} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QuestionList
          mapped={result.mapping.mapped}
          orphanAnswers={result.mapping.orphanAnswers}
          grading={result.grading}
          selection={selection}
          onSelect={handleSelect}
        />
        <div className="lg:sticky lg:top-4 self-start">
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
