import type { ProcessEvent } from "./types";

const STALL_TIMEOUT_MS = 45_000;

/**
 * Reads the newline-delimited JSON progress stream from /api/process.
 *
 * Guards against a real failure mode: if the serverless function is killed
 * by the platform's own time limit mid-stream, the HTTP connection can just
 * go silent — no error, no close event, the client's reader.read() simply
 * never resolves. Without a watchdog that hangs the UI forever with no way
 * out but a refresh. Racing each read against a timeout turns that into a
 * clear, actionable error instead.
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
      if (line) onEvent(JSON.parse(line) as ProcessEvent);
    }
  }
  if (buffer.trim()) onEvent(JSON.parse(buffer.trim()) as ProcessEvent);
}
