"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { LuChevronDown, LuMenu, LuX } from "react-icons/lu";
import ExternalLink from "@/components/ExternalLink";
import { SOCIAL_LINKS } from "@bengottschalk/content/links";
import { CUBING_SECTIONS, HEADER_LINKS, NAV_LINKS, type NavLink } from "@/content/nav";
import { TONE_TEXT } from "@/lib/tones";

// Tailwind's `lg` breakpoint, where the full header nav takes over from the menu.
const DESKTOP_QUERY = "(min-width: 64rem)";

function NavItem({ link, active, indicator, onClick, children }: {
  link: NavLink;
  active: boolean;
  indicator?: ReactNode;
  onClick?: () => void;
  /** A nested list under the link, in the phone menu. */
  children?: ReactNode;
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
      {children}
    </li>
  );
}

// Hovering either the Cubing link or its arrow highlights both, like daisyUI's
// own menu hover, so they read as one item.
const PAIR_HOVER = "[@media(hover:hover)]:group-hover/cubing:bg-base-content/10";

/**
 * The desktop header's Cubing link, with a menu of the Cubing section's pages.
 * The link still goes to the overview; the menu opens on hover (CSS), or with
 * the arrow button (for keyboards and touch). Esc, clicking or tabbing
 * elsewhere, or navigating closes it.
 */
function CubingMenu({ active, indicator, isActive }: { active: boolean; indicator: ReactNode; isActive: (href: string) => boolean }) {
  const pathname = usePathname();
  const menuId = useId();
  const itemRef = useRef<HTMLLIElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  const [openedOn, setOpenedOn] = useState(pathname);
  if (openedOn !== pathname) {
    setOpenedOn(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return () => {};
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    // A click or focus anywhere outside closes it.
    const onOutside = (event: Event) => {
      if (event.target instanceof Node && !itemRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onOutside);
    document.addEventListener("focusin", onOutside);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onOutside);
      document.removeEventListener("focusin", onOutside);
    };
  }, [open]);

  return (
    // The link and arrow stretch to the same height, so when active they read as one pill.
    <li ref={itemRef} className="group/cubing relative flex-row items-stretch">
      <Link href="/cubing" aria-current={active ? "page" : undefined} className={`rounded-r-none pr-1.5 ${active ? "menu-active" : PAIR_HOVER}`}>
        Cubing
        {indicator}
      </Link>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label="Cubing pages"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center rounded-l-none px-1.5 ${active ? "menu-active" : PAIR_HOVER}`}
      >
        <LuChevronDown className={`size-4 transition-transform group-hover/cubing:rotate-180 ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {/* Hidden (and out of the tab order) until hovered or opened. The top
          padding bridges the gap, so moving the mouse down into it keeps it open.
          `block px-0 pb-0` and the list's `ms-0 whitespace-normal before:hidden`
          undo daisyUI's menu item and submenu styles, which it applies to
          anything inside a menu's list item. */}
      <div
        id={menuId}
        className={`absolute right-0 top-full z-50 block w-[30rem] cursor-default bg-transparent px-0 pb-0 pt-2 transition-opacity hover:bg-transparent [@media(hover:hover)]:group-hover/cubing:visible [@media(hover:hover)]:group-hover/cubing:opacity-100 ${
          open ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        <ul className="ms-0 grid grid-cols-2 gap-1 whitespace-normal rounded-box border border-base-300 bg-base-100 p-2 shadow-xl before:hidden">
          {CUBING_SECTIONS.map(({ label, href, description, icon: Icon, tone }) => {
            const current = href === "/cubing" ? pathname === href : isActive(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={current ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className={`flex items-start gap-3 rounded-field p-3 text-base-content transition-colors hover:bg-base-200 ${current ? "bg-base-200 ring-1 ring-base-300" : ""}`}
                >
                  <Icon className={`mt-0.5 size-5 shrink-0 ${TONE_TEXT[tone]}`} aria-hidden="true" />
                  <span>
                    <span className="block font-semibold">{label}</span>
                    <span className="block text-xs leading-snug text-muted">{description}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
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
        {HEADER_LINKS.map((link) =>
          link.href === "/cubing" ? (
            <CubingMenu key={link.href} active={isActive(link.href)} indicator={cubingIndicator} isActive={isActive} />
          ) : (
            <NavItem key={link.href} link={link} active={isActive(link.href)} indicator={indicatorFor(link)} />
          ),
        )}
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
                <NavItem key={link.href} link={link} active={isActive(link.href)} indicator={indicatorFor(link)} onClick={close}>
                  {/* Every Cubing page, one tap away. */}
                  {link.href === "/cubing" && (
                    <ul className="text-base [&_a]:py-2">
                      {CUBING_SECTIONS.filter((section) => section.href !== "/cubing").map(({ label, href, icon: Icon, tone }) => (
                        <li key={href}>
                          <Link
                            href={href}
                            aria-current={isActive(href) ? "page" : undefined}
                            className={isActive(href) ? "menu-active" : undefined}
                            onClick={close}
                          >
                            <Icon className={`size-4 ${TONE_TEXT[tone]}`} aria-hidden="true" />
                            {label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </NavItem>
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
