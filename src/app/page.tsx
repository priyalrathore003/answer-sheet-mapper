"use client";

import { useState } from "react";
import { UploadForm } from "@/components/UploadForm";
import { ProcessingProgress } from "@/components/ProcessingProgress";
import { ResultsView } from "@/components/ResultsView";
import { streamProcess } from "@/lib/streamProcess";
import type { ProcessResult } from "@/lib/types";

type ViewState =
  | { kind: "upload" }
  | { kind: "processing"; log: string[] }
  | { kind: "results"; result: ProcessResult }
  | { kind: "error"; message: string };

export default function Home() {
  const [state, setState] = useState<ViewState>({ kind: "upload" });

  async function handleSubmit(questionFiles: File[], answerFiles: File[], grade: boolean) {
    setState({ kind: "processing", log: ["Uploading files…"] });

    const formData = new FormData();
    questionFiles.forEach((f) => formData.append("questionFiles", f));
    answerFiles.forEach((f) => formData.append("answerFiles", f));
    formData.append("grade", String(grade));

    try {
      await streamProcess(formData, (event) => {
        if (event.type === "progress") {
          setState((prev) =>
            prev.kind === "processing" ? { kind: "processing", log: [...prev.log, event.message] } : prev
          );
        } else if (event.type === "done") {
          setState({ kind: "results", result: event.result });
        } else if (event.type === "error") {
          setState({ kind: "error", message: event.message });
        }
      });
    } catch (err) {
      setState({ kind: "error", message: err instanceof Error ? err.message : String(err) });
    }
  }

  return (
    <div className="flex flex-col flex-1 items-center bg-white dark:bg-black font-sans px-6 py-16">
      <div className="w-full max-w-6xl flex flex-col items-center gap-10">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Answer Sheet Mapper</h1>
          <p className="text-neutral-500 mt-1">
            Upload a question paper and one student&apos;s handwritten answer sheet.
          </p>
        </div>

        {state.kind === "upload" && <UploadForm onSubmit={handleSubmit} disabled={false} />}

        {state.kind === "processing" && <ProcessingProgress log={state.log} />}

        {state.kind === "error" && (
          <div className="w-full max-w-xl flex flex-col gap-4 items-start">
            <p className="text-red-600 dark:text-red-400 text-sm">{state.message}</p>
            <button
              onClick={() => setState({ kind: "upload" })}
              className="text-sm underline text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
            >
              Try again
            </button>
          </div>
        )}

        {state.kind === "results" && (
          <ResultsView result={state.result} onReset={() => setState({ kind: "upload" })} />
        )}
      </div>
    </div>
  );
}
