"use client";

export function BackToTopButton() {
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="group inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-sky-400 transition-colors"
    >
      Back to top
      <span className="group-hover:-translate-y-0.5 transition-transform">↑</span>
    </button>
  );
}
