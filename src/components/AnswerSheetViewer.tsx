"use client";

import { useState } from "react";
import type { AnswerPageImage, AnswerRegion } from "@/lib/types";
import { IconMinus, IconPlus } from "./icons";

interface Props {
  pages: AnswerPageImage[];
  currentPageIndex: number;
  onPageChange: (index: number) => void;
  highlighted: AnswerRegion[];
}

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.1;

export function AnswerSheetViewer({ pages, currentPageIndex, onPageChange, highlighted }: Props) {
  const [zoom, setZoom] = useState(1);
  const page = pages.find((p) => p.pageIndex === currentPageIndex) ?? pages[0];
  const boxesOnThisPage = highlighted.filter((h) => h.pageIndex === page?.pageIndex);
  const canGoPrev = currentPageIndex > 0;
  const canGoNext = currentPageIndex < pages.length - 1;

  return (
    <div className="flex flex-col w-full border border-neutral-200 rounded-lg overflow-hidden card-elevated bg-white">
      <div className="flex items-center justify-between flex-wrap gap-x-3 gap-y-1.5 px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900">
        <span className="text-sm font-medium shrink-0">Answer Sheet</span>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1 text-xs text-neutral-500">
            <button
              onClick={() => setZoom((z) => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2)))}
              disabled={zoom <= ZOOM_MIN}
              aria-label="Zoom out"
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 disabled:opacity-30"
            >
              <IconMinus className="w-3.5 h-3.5" />
            </button>
            <span className="tabular-nums w-9 text-center">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2)))}
              disabled={zoom >= ZOOM_MAX}
              aria-label="Zoom in"
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 disabled:opacity-30"
            >
              <IconPlus className="w-3.5 h-3.5" />
            </button>
          </div>
          {pages.length > 1 && (
            <div className="flex items-center gap-1 text-sm text-neutral-500 border-l border-neutral-200 dark:border-neutral-800 pl-3">
              <button
                onClick={() => canGoPrev && onPageChange(currentPageIndex - 1)}
                disabled={!canGoPrev}
                aria-label="Previous page"
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                ‹
              </button>
              <span className="tabular-nums px-1">
                Page {currentPageIndex + 1} of {pages.length}
              </span>
              <button
                onClick={() => canGoNext && onPageChange(currentPageIndex + 1)}
                disabled={!canGoNext}
                aria-label="Next page"
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                ›
              </button>
            </div>
          )}
        </div>
      </div>

      {pages.length > 1 && (
        <div className="flex gap-2 flex-wrap px-3 py-2 border-b border-neutral-200 dark:border-neutral-800">
          {pages.map((p) => (
            <button
              key={p.pageIndex}
              onClick={() => onPageChange(p.pageIndex)}
              className={
                "px-2.5 py-0.5 rounded-full text-xs border " +
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

      <div className="overflow-auto max-h-[75vh]">
        <div className="relative" style={{ width: `${zoom * 100}%` }}>
          {page && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={page.imageDataUrl} alt={`Answer sheet page ${page.pageIndex + 1}`} className="w-full h-auto block" />
          )}
          {boxesOnThisPage.map((box) => {
            const [yMin, xMin, yMax, xMax] = box.box;
            const label = box.questionLabel.replace(/\.$/, "") || "?";
            return (
              <div
                key={box.id}
                className="absolute border-2 border-green-500 bg-green-400/15 rounded-sm pointer-events-none"
                style={{
                  top: `${yMin / 10}%`,
                  left: `${xMin / 10}%`,
                  width: `${(xMax - xMin) / 10}%`,
                  height: `${(yMax - yMin) / 10}%`,
                }}
              >
                <span className="absolute -top-2.5 -left-0.5 bg-green-500 text-white text-[10px] font-semibold leading-none px-1.5 py-1 rounded">
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
