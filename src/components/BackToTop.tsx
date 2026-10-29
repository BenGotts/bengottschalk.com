"use client";

import { useEffect, useState } from "react";
import { LuArrowUp } from "react-icons/lu";

const SHOW_AFTER_PX = 1200;

function toTop() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
}

/** A floating button back to the top of the page, shown once you've scrolled a long way down. */
export default function BackToTop() {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const update = () => setShown(window.scrollY > SHOW_AFTER_PX);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <button
      type="button"
      onClick={toTop}
      aria-label="Back to top"
      tabIndex={shown ? 0 : -1}
      aria-hidden={!shown}
      className={`btn btn-circle btn-primary fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 shadow-lg transition-[opacity,translate] duration-200 sm:right-6 sm:bottom-6 ${
        shown ? "opacity-100" : "pointer-events-none translate-y-2 opacity-0"
      }`}
    >
      <LuArrowUp className="size-5" aria-hidden="true" />
    </button>
  );
}
