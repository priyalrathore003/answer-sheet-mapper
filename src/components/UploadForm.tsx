"use client";

import { useState } from "react";

interface Props {
  onSubmit: (questionFiles: File[], answerFiles: File[], grade: boolean) => void;
  disabled: boolean;
}

function FilePicker({
  label,
  hint,
  files,
  onChange,
}: {
  label: string;
  hint: string;
  files: File[];
  onChange: (files: File[]) => void;
}) {
  return (
    <label className="flex flex-col gap-2 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 p-5 cursor-pointer hover:border-neutral-500 transition-colors">
      <span className="font-medium">{label}</span>
      <span className="text-sm text-neutral-500">{hint}</span>
      <input
        type="file"
        accept="application/pdf,image/*"
        multiple
        className="hidden"
        onChange={(e) => onChange(Array.from(e.target.files ?? []))}
      />
      <span className="text-sm mt-1">
        {files.length === 0 ? (
          <span className="text-neutral-400">No file selected</span>
        ) : (
          <span className="text-blue-600 dark:text-blue-400">
            {files.map((f) => f.name).join(", ")}
          </span>
        )}
      </span>
    </label>
  );
}

export function UploadForm({ onSubmit, disabled }: Props) {
  const [questionFiles, setQuestionFiles] = useState<File[]>([]);
  const [answerFiles, setAnswerFiles] = useState<File[]>([]);
  const [grade, setGrade] = useState(true);

  const canSubmit = questionFiles.length > 0 && answerFiles.length > 0 && !disabled;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) onSubmit(questionFiles, answerFiles, grade);
      }}
      className="flex flex-col gap-5 w-full max-w-xl"
    >
      <FilePicker
        label="Question paper"
        hint="PDF or one/more images"
        files={questionFiles}
        onChange={setQuestionFiles}
      />
      <FilePicker
        label="Student's answer sheet"
        hint="PDF or one/more images"
        files={answerFiles}
        onChange={setAnswerFiles}
      />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={grade} onChange={(e) => setGrade(e.target.checked)} />
        Grade the answers (correct/incorrect + short feedback)
      </label>
      <button
        type="submit"
        disabled={!canSubmit}
        className="rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-medium py-3 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {disabled ? "Processing…" : "Process answer sheet"}
      </button>
    </form>
  );
}
