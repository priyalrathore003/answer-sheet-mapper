"use client";

interface Props {
  log: string[];
}

export function ProcessingProgress({ log }: Props) {
  return (
    <div className="w-full max-w-xl flex flex-col gap-2">
      {log.map((message, i) => {
        const isLast = i === log.length - 1;
        return (
          <div key={i} className="flex items-center gap-3 text-sm">
            <span
              className={
                isLast
                  ? "h-2 w-2 rounded-full bg-blue-500 animate-pulse shrink-0"
                  : "h-2 w-2 rounded-full bg-green-500 shrink-0"
              }
            />
            <span className={isLast ? "text-neutral-900 dark:text-neutral-100" : "text-neutral-400"}>
              {message}
            </span>
          </div>
        );
      })}
    </div>
  );
}
