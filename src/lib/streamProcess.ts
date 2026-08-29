import type { ProcessEvent } from "./types";

const STALL_TIMEOUT_MS = 45_000;

/**
 * Reads the newline-delimited JSON progress stream from /api/process.
 *
 * Guards against two distinct ways the serverless function dying mid-stream
 * can otherwise strand the UI forever on the last progress message:
 *
 * 1. A true hang — the platform kills the function but the connection just
 *    goes silent, so reader.read() never resolves at all. Racing every read
 *    against a timeout turns that into a clear error instead of an infinite
 *    wait.
 * 2. A clean-but-premature close — the platform closes the connection in a
 *    way the browser reports as a normal end of stream (done: true), but
 *    that happened before a final {type:"done"} or {type:"error"} line ever
 *    arrived. This looks identical to a successful finish unless you
 *    explicitly check for it — silently returning here is what caused the
 *    "stuck on Grading answers" bug: the promise just resolved with nothing
 *    left to do, so nothing ever moved the UI out of "processing".
 */
export async function streamProcess(
  formData: FormData,
  onEvent: (event: ProcessEvent) => void
): Promise<void> {
  const controller = new AbortController();
  const res = await fetch("/api/process", { method: "POST", body: formData, signal: controller.signal });
  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed (${res.status})`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let sawTerminalEvent = false;

  function handleLine(line: string) {
    if (!line) return;
    const event = JSON.parse(line) as ProcessEvent;
    if (event.type === "done" || event.type === "error") sawTerminalEvent = true;
    onEvent(event);
  }

  while (true) {
    let result: ReadableStreamReadResult<Uint8Array>;
    try {
      result = await Promise.race([
        reader.read(),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("STALL")), STALL_TIMEOUT_MS);
        }),
      ]);
    } catch {
      controller.abort();
      throw new Error(
        "Processing stalled with no update for 45 seconds — this usually means the server ran out of time on a large document. Please try again; if it keeps happening, try a shorter document or fewer pages."
      );
    }

    const { done, value } = result;
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, newlineIndex).trim();
      buffer = buffer.slice(newlineIndex + 1);
      handleLine(line);
    }
  }

  if (buffer.trim()) handleLine(buffer.trim());

  if (!sawTerminalEvent) {
    throw new Error(
      "The connection closed before processing finished — this usually means the server ran out of time on a large document. Please try again; if it keeps happening, try a shorter document or fewer pages."
    );
  }
}
