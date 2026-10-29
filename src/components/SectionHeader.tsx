import Link from "next/link";
import { LuArrowRight } from "react-icons/lu";

/** A section's heading with a link to its full page, e.g. "Latest videos · All videos →". */
export default function SectionHeader({ id, title, href, linkLabel }: { id: string; title: string; href: string; linkLabel: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <h2 id={id} className="text-2xl font-bold">{title}</h2>
      <Link href={href} className="link link-primary inline-flex items-center gap-1 text-sm font-medium">
        {linkLabel} <LuArrowRight aria-hidden="true" />
      </Link>
    </div>
  );
}
