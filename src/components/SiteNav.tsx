"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { LuMenu, LuX } from "react-icons/lu";
import ExternalLink from "@/components/ExternalLink";
import { HEADER_LINKS, NAV_LINKS, SOCIAL_LINKS, type NavLink } from "@/content/links";

// Tailwind's `lg` breakpoint, where the full header nav takes over from the menu.
const DESKTOP_QUERY = "(min-width: 64rem)";

function NavItem({ link, active, indicator, onClick }: {
  link: NavLink;
  active: boolean;
  indicator?: ReactNode;
  onClick?: () => void;
}) {
  return (
    <li>
      <Link
        href={link.href}
        aria-current={active ? "page" : undefined}
        className={active ? "menu-active" : undefined}
        onClick={onClick}
      >
        {link.label}
        {indicator}
      </Link>
    </li>
  );
}

export default function SiteNav({ cubingIndicator, menuIndicator }: {
  /** Shown after the Cubing link while a competition is happening. */
  cubingIndicator: ReactNode;
  /** Shown on the phone menu button, since the link is hidden inside it. */
  menuIndicator: ReactNode;
}) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const contactActive = isActive("/contact");
  const indicatorFor = (link: NavLink) => (link.href === "/cubing" ? cubingIndicator : undefined);

  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  // Menu links close it themselves, since one to the page already showing doesn't navigate.
  const close = () => setOpen(false);

  // Close after navigating, including with the browser's back button.
  const [openedOn, setOpenedOn] = useState(pathname);
  if (openedOn !== pathname) {
    setOpenedOn(pathname);
    setOpen(false);
  }

  // While open: the page behind doesn't scroll, Esc closes (back to the button),
  // and widening past the phone layout closes it.
  useEffect(() => {
    if (!open) return () => {};
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    const desktop = window.matchMedia(DESKTOP_QUERY);
    const onDesktop = () => {
      if (desktop.matches) setOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    desktop.addEventListener("change", onDesktop);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      desktop.removeEventListener("change", onDesktop);
    };
  }, [open]);

  return (
    <>
      <ul className="menu menu-horizontal hidden gap-0.5 text-[15px] lg:flex">
        {HEADER_LINKS.map((link) => (
          <NavItem key={link.href} link={link} active={isActive(link.href)} indicator={indicatorFor(link)} />
        ))}
      </ul>
      <Link
        href="/contact"
        aria-current={contactActive ? "page" : undefined}
        className={`btn btn-sm ml-2 hidden lg:inline-flex ${contactActive ? "btn-primary" : "btn-outline btn-primary"}`}
      >
        Contact
      </Link>

      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={open ? "Close menu" : "Open menu"}
        className="btn btn-ghost btn-square relative lg:hidden"
      >
        {open ? <LuX className="size-6" aria-hidden="true" /> : <LuMenu className="size-6" aria-hidden="true" />}
        {!open && menuIndicator}
      </button>

      {/* Positioned against the sticky header (its backdrop blur makes it the
          containing block even for fixed elements), so both start just below it. */}
      {open && (
        <>
          <div
            className="menu-backdrop absolute inset-x-0 top-full h-dvh bg-base-100/70 backdrop-blur-sm lg:hidden"
            onClick={close}
            aria-hidden="true"
          />
          <div
            id={menuId}
            className="menu-panel absolute inset-x-0 top-full max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-base-300 bg-base-200 px-4 pt-3 pb-6 shadow-xl sm:px-6 lg:hidden"
          >
            <ul className="menu w-full gap-1 p-0 text-lg [&_a]:py-3">
              {NAV_LINKS.filter((link) => link.href !== "/contact").map((link) => (
                <NavItem key={link.href} link={link} active={isActive(link.href)} indicator={indicatorFor(link)} onClick={close} />
              ))}
            </ul>
            <Link
              href="/contact"
              aria-current={contactActive ? "page" : undefined}
              className="btn btn-primary btn-lg mt-4 w-full"
              onClick={close}
            >
              Contact
            </Link>
            <ul className="mt-5 flex justify-center gap-2">
              {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
                <li key={href}>
                  <ExternalLink href={href} className="btn btn-ghost btn-square" onClick={close}>
                    <Icon className="size-5" aria-hidden="true" />
                    <span className="sr-only">{label}</span>
                  </ExternalLink>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </>
  );
}
