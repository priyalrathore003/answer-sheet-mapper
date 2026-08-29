"use client";

import { useEffect, useState } from "react";

/** A tiny self-contained toast: call show(message) to display it for a few seconds. */
export function useToast() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 2200);
    return () => clearTimeout(t);
  }, [message]);

  const node = message ? (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-neutral-900 text-white text-sm px-4 py-2.5 rounded-full shadow-lg animate-[fadein_.15s_ease-out]">
      {message}
    </div>
  ) : null;

  return { show: setMessage, node };
}
