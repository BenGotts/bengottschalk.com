"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { FaChevronDown } from "react-icons/fa6";

type Hidden = { above: boolean; below: boolean };

/**
 * A box that scrolls what doesn't fit, and shows it: the edge with text hidden
 * past it fades out (`.scroll-fade` in globals.css), with a chevron while more is below.
 * Give it a `key` that changes with its content (the scramble), so a new one starts at the top.
 */
export default function ScrollFade({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState<Hidden>({ above: false, below: false });

  useEffect(() => {
    const box = ref.current;
    if (!box) return () => {};
    // A pixel of slack, so rounding doesn't leave a fade on text that fits.
    const update = () => {
      const above = box.scrollTop > 1;
      const below = box.scrollTop + box.clientHeight < box.scrollHeight - 1;
      setHidden((h) => (h.above === above && h.below === below ? h : { above, below }));
    };
    update();
    box.addEventListener("scroll", update, { passive: true });
    // The box's size and its content's both change what fits.
    const observer = new ResizeObserver(update);
    observer.observe(box);
    for (const child of box.children) observer.observe(child);
    return () => {
      box.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, []);

  const overflows = hidden.above || hidden.below;
  return (
    <div className={`relative flex min-h-0 flex-col ${className}`}>
      <div
        ref={ref}
        className="scroll-fade min-h-0 overflow-y-auto overscroll-contain"
        data-fade-above={hidden.above || undefined}
        data-fade-below={hidden.below || undefined}
        // While it scrolls, a touch here scrolls it rather than starting the timer.
        data-timer-ignore={overflows || undefined}
      >
        {children}
      </div>
      {hidden.below && (
        <FaChevronDown className="pointer-events-none absolute bottom-0 left-1/2 size-3 -translate-x-1/2 text-muted" aria-hidden />
      )}
    </div>
  );
}
