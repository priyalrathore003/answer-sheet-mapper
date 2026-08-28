"use client";

import { useState } from "react";

interface Props {
  onSubmit: (questionFiles: File[], answerFiles: File[], grade: boolean) => void;
  disabled: boolean;
}

function UploadIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M10 13V3M10 3L6.5 6.5M10 3l3.5 3.5M4 14v1.5a1.5 1.5 0 0 0 1.5 1.5h9a1.5 1.5 0 0 0 1.5-1.5V14"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M4 2.5h6l3.5 3.5v9a1 1 0 0 1-1 1h-8.5a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path d="M10 2.5V6h3.5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function formatSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(mb < 10 ? 1 : 0)}MB` : `${Math.max(1, Math.round(bytes / 1024))}KB`;
}

const MAX_BYTES = 10 * 1024 * 1024;

function FilePicker({
  label,
  files,
  onChange,
}: {
  label: string;
  files: File[];
  onChange: (files: File[]) => void;
}) {
  const filled = files.length > 0;
  return (
    <label
      className={
        "group relative flex flex-col gap-3 rounded-2xl border p-6 cursor-pointer transition-all " +
        (filled
          ? "border-accent/40 bg-accent-soft"
          : "border-dashed border-neutral-900/12 dark:border-white/12 bg-white dark:bg-neutral-950 hover:border-accent/50 hover:bg-accent-soft/60")
      }
    >
      <div
        className={
          "h-10 w-10 rounded-full flex items-center justify-center transition-colors " +
          (filled ? "bg-accent text-white" : "bg-neutral-900/[.04] dark:bg-white/10 text-neutral-500 group-hover:bg-accent group-hover:text-white")
        }
      >
        <UploadIcon />
      </div>
      <div>
        <div className="font-medium">
          Upload <span className="text-accent">{label}</span>
        </div>
        <div className="text-sm text-neutral-500 dark:text-neutral-400">Max 10MB</div>
      </div>
      <input
        type="file"
        accept="application/pdf,image/*"
        multiple
        className="hidden"
        onChange={(e) => onChange(Array.from(e.target.files ?? []))}
      />
      {filled && (
        <ul className="flex flex-col gap-1.5 mt-1">
          {files.map((f, i) => (
            <li
              key={f.name}
              className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-900 border border-neutral-900/[.06] dark:border-white/10 rounded-lg px-2.5 py-1.5"
            >
              <FileIcon />
              <span className="truncate flex-1">{f.name}</span>
              <span className="text-xs text-neutral-400 shrink-0">{formatSize(f.size)}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onChange(files.filter((_, idx) => idx !== i));
                }}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 shrink-0"
                aria-label={`Remove ${f.name}`}
              >
                <CloseIcon />
              </button>
            </li>
          ))}
        </ul>
      )}
    </label>
  );
}

export function UploadForm({ onSubmit, disabled }: Props) {
  const [questionFiles, setQuestionFiles] = useState<File[]>([]);
  const [answerFiles, setAnswerFiles] = useState<File[]>([]);
  const [grade, setGrade] = useState(true);

  const oversized = [...questionFiles, ...answerFiles].some((f) => f.size > MAX_BYTES);
  const canSubmit = questionFiles.length > 0 && answerFiles.length > 0 && !disabled && !oversized;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) onSubmit(questionFiles, answerFiles, grade);
      }}
      className="flex flex-col gap-5 w-full max-w-2xl"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FilePicker label="Question Paper" files={questionFiles} onChange={setQuestionFiles} />
        <FilePicker label="Answer Sheet" files={answerFiles} onChange={setAnswerFiles} />
      </div>

      {oversized && <p className="text-sm text-red-600 dark:text-red-400 text-center -mt-1">One of the files is over 10MB — remove or replace it to continue.</p>}

      <label className="flex items-center gap-2.5 text-sm text-neutral-600 dark:text-neutral-300 select-none justify-center">
        <input
          type="checkbox"
          checked={grade}
          onChange={(e) => setGrade(e.target.checked)}
          className="h-4 w-4 rounded accent-accent"
        />
        Grade the answers (score, correct/incorrect, AI feedback)
      </label>

      <button
        type="submit"
        disabled={!canSubmit}
        className="rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-medium py-3.5 transition-opacity hover:opacity-90 disabled:bg-neutral-900/20 disabled:dark:bg-white/20 disabled:text-neutral-500 disabled:dark:text-neutral-500 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {disabled ? "Processing…" : "Start Mapping"}
        {canSubmit && <span aria-hidden="true">→</span>}
      </button>

      <p className="text-xs text-center text-neutral-400">
        Once both files are uploaded, you&apos;ll be able to map answers with questions
      </p>
    </form>
  );
}
