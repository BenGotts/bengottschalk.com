"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV_LINKS, isNavActive } from "@/lib/nav";

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEscape);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-slate-700 bg-slate-950 text-slate-300 hover:text-emerald-400 hover:border-slate-600 transition-colors"
      >
        <span className="sr-only">Menu</span>
        {open ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close menu overlay"
            className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <nav
            id="mobile-nav-panel"
            className="fixed top-[65px] inset-x-0 z-50 border-b border-slate-800 bg-slate-900 shadow-lg"
          >
            <ul className="max-w-7xl mx-auto px-4 py-3 flex flex-col">
              {NAV_LINKS.map(({ href, label }) => {
                const active = isNavActive(pathname, href);

                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={`block py-3 text-sm font-semibold tracking-wider uppercase border-b border-slate-800/80 last:border-0 transition-colors ${
                        active
                          ? "text-emerald-400"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </>
      )}
    </div>
  );
}
