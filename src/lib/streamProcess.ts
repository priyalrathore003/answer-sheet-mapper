import type { ProcessEvent } from "./types";

/** Reads the newline-delimited JSON progress stream from /api/process. */
export async function streamProcess(
  formData: FormData,
  onEvent: (event: ProcessEvent) => void
): Promise<void> {
  const res = await fetch("/api/process", { method: "POST", body: formData });
  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed (${res.status})`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
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
