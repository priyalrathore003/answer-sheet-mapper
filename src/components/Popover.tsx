"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  trigger: (opts: { open: boolean; toggle: () => void }) => React.ReactNode;
  children: React.ReactNode;
  align?: "left" | "right";
  width?: number;
}

/** A minimal click-to-toggle popover: closes on outside click or Escape. */
export function Popover({ trigger, children, align = "right", width = 260 }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      {open && (
        <div
          className={
            "absolute top-full mt-2 z-50 rounded-xl border border-neutral-900/[.08] bg-white card-elevated p-3 text-sm " +
            (align === "right" ? "right-0" : "left-0")
          }
          style={{ width }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
