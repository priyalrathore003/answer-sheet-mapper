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
    <div className="flex flex-col flex-1 min-h-screen font-sans">
      <header className="flex items-center gap-2.5 px-6 sm:px-10 py-5 border-b border-neutral-900/[.06] dark:border-white/[.08]">
        <div className="h-7 w-7 rounded-md bg-accent text-white flex items-center justify-center text-sm font-bold shrink-0">
          A
        </div>
        <span className="font-semibold tracking-tight">Answer Sheet Mapper</span>
      </header>

      <main className="flex flex-1 flex-col items-center px-6 py-14 sm:py-20">
        <div className="w-full max-w-6xl flex flex-col items-center gap-10">
          {state.kind === "upload" && (
            <div className="text-center max-w-lg">
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-balance">
                Upload <span className="text-accent">question paper &amp; answer sheet</span>
              </h1>
              <p className="text-neutral-500 dark:text-neutral-400 mt-3">
                Extract questions, map handwritten answers, and highlight exactly where each one was written.
              </p>
            </div>
          )}

          {state.kind === "upload" && <UploadForm onSubmit={handleSubmit} disabled={false} />}

          {state.kind === "processing" && <ProcessingProgress log={state.log} />}

          {state.kind === "error" && (
            <div className="w-full max-w-xl flex flex-col gap-4 items-start bg-white dark:bg-neutral-950 border border-red-200 dark:border-red-900/40 rounded-xl px-5 py-4">
              <p className="text-red-700 dark:text-red-400 text-sm leading-relaxed">{state.message}</p>
              <button
                onClick={() => setState({ kind: "upload" })}
                className="text-sm font-medium text-accent hover:opacity-80"
              >
                Try again →
              </button>
            </div>
          )}

          {state.kind === "results" && (
            <ResultsView result={state.result} onReset={() => setState({ kind: "upload" })} />
          )}
        </div>
      </main>
    </div>
  );
}
