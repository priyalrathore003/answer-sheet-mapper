"use client";

interface Props {
  log: string[];
}

export function ProcessingProgress({ log }: Props) {
  return (
    <div className="w-full max-w-lg flex flex-col items-center gap-8 py-6">
      <div className="relative h-16 w-16 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-2 border-accent/20" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent animate-spin" />
        <span className="text-accent text-xl">✦</span>
      </div>

      <div className="w-full flex flex-col gap-2.5">
        {log.map((message, i) => {
          const isLast = i === log.length - 1;
          return (
            <div key={i} className="flex items-center gap-3 text-sm">
              <span
                className={
                  isLast
                    ? "h-1.5 w-1.5 rounded-full bg-accent animate-pulse shrink-0"
                    : "h-1.5 w-1.5 rounded-full bg-green-500 shrink-0"
                }
              />
              <span className={isLast ? "text-neutral-900 dark:text-neutral-100 font-medium" : "text-neutral-400"}>
                {message}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
