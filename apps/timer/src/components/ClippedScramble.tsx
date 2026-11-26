"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { FaChevronDown } from "react-icons/fa6";

/**
 * The scramble in the space it's given, never scrolled. When it doesn't all fit,
 * the cut-off edge fades out (`.clip-fade` in globals.css) and the whole box
 * becomes a button that opens the full scramble (`onShowAll`).
 */
export default function ClippedScramble({ children, onShowAll }: { children: ReactNode; onShowAll: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [clipped, setClipped] = useState(false);

  useEffect(() => {
    const box = ref.current;
    if (!box) return () => {};
    // A pixel of slack, so rounding doesn't cut off a scramble that fits.
    const update = () => setClipped(box.scrollHeight > box.clientHeight + 1);
    update();
    // The box's size and its content's both change what fits.
    const observer = new ResizeObserver(update);
    observer.observe(box);
    for (const child of box.children) observer.observe(child);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative flex min-h-0 flex-col">
      <div ref={ref} className="clip-fade min-h-0 overflow-hidden" data-clipped={clipped || undefined}>
        {children}
      </div>
      {/* A button, so a touch here opens the scramble instead of starting the timer. */}
      {clipped && (
        <button type="button" className="absolute inset-0 flex cursor-zoom-in items-end justify-center rounded-field" onClick={(e) => { e.currentTarget.blur(); onShowAll(); }} aria-label="Show the full scramble">
          <span className="badge badge-sm gap-1 border-base-300 bg-base-200 text-muted shadow-sm">
            Full scramble <FaChevronDown className="size-2.5" aria-hidden />
          </span>
        </button>
      )}
    </div>
  );
}
