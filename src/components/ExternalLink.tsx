import type { ComponentPropsWithoutRef } from "react";
import { LuArrowUpRight } from "react-icons/lu";

type ExternalLinkProps = Omit<ComponentPropsWithoutRef<"a">, "target" | "rel"> & {
  /** A ↗ arrow after the text, for standalone links and buttons; off for titles, lists and links in sentences. */
  arrow?: boolean;
  /** Classes for the arrow's size, spacing and colour; replaces the default, which scales with the text. */
  iconClassName?: string;
};

/**
 * A link to another site: opens in a new tab, which screen readers announce,
 * optionally with a ↗ arrow.
 */
export default function ExternalLink({ children, arrow = false, iconClassName = "ml-1 size-[0.9em]", ...props }: ExternalLinkProps) {
  return (
    <a {...props} target="_blank" rel="noopener noreferrer">
      {children}
      {arrow && <LuArrowUpRight className={`inline shrink-0 align-[-0.1em] ${iconClassName}`} aria-hidden="true" />}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
