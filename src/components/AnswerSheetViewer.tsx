"use client";

import type { AnswerPageImage, AnswerRegion } from "@/lib/types";

interface Props {
  pages: AnswerPageImage[];
  currentPageIndex: number;
  onPageChange: (index: number) => void;
  highlighted: AnswerRegion[];
}

export function AnswerSheetViewer({ pages, currentPageIndex, onPageChange, highlighted }: Props) {
  const page = pages.find((p) => p.pageIndex === currentPageIndex) ?? pages[0];
  const boxesOnThisPage = highlighted.filter((h) => h.pageIndex === page?.pageIndex);

  return (
    <div className="flex flex-col gap-3 w-full">
      {pages.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {pages.map((p) => (
            <button
              key={p.pageIndex}
              onClick={() => onPageChange(p.pageIndex)}
              className={
                "px-3 py-1 rounded-full text-sm border " +
                (p.pageIndex === page?.pageIndex
                  ? "bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-neutral-900"
                  : "border-neutral-300 dark:border-neutral-700 text-neutral-500")
              }
            >
              Page {p.pageIndex + 1}
              {highlighted.some((h) => h.pageIndex === p.pageIndex) && " •"}
            </button>
          ))}
        </div>
      )}

      <div className="relative w-full border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden">
        {page && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={page.imageDataUrl} alt={`Answer sheet page ${page.pageIndex + 1}`} className="w-full h-auto block" />
        )}
        {boxesOnThisPage.map((box) => {
          const [yMin, xMin, yMax, xMax] = box.box;
          return (
            <div
              key={box.id}
              className="absolute border-2 border-amber-500 bg-amber-400/20 rounded-sm pointer-events-none"
              style={{
                top: `${yMin / 10}%`,
                left: `${xMin / 10}%`,
                width: `${(xMax - xMin) / 10}%`,
                height: `${(yMax - yMin) / 10}%`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
