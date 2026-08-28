"use client";

interface Props {
  log: string[];
}

export function ProcessingProgress({ log }: Props) {
  const current = log[log.length - 1] ?? "Extracting…";

  return (
    <div className="w-full max-w-lg flex flex-col items-center gap-3 py-16">
      <div className="relative h-16 w-16 flex items-center justify-center mb-3">
        <div className="absolute inset-0 rounded-full border-2 border-accent/20" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent animate-spin" />
        <span className="text-accent text-2xl">✦</span>
      </div>

      <h2 className="text-xl font-semibold">Extracting…</h2>
      <p className="text-neutral-500 dark:text-neutral-400 text-sm">This may take a while</p>

      <p key={current} className="text-xs text-neutral-400 mt-4 tabular-nums">
        {current}
      </p>
    </div>
  );
}
