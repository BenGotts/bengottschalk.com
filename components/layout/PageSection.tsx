import { ReactNode } from "react";

interface PageSectionProps {
  children: ReactNode;
  title?: string;
  description?: ReactNode;
  actions?: ReactNode;
  id?: string;
  className?: string;
  bleed?: boolean;
}

export function PageSection({
  children,
  title,
  description,
  actions,
  id,
  className = "",
  bleed = false,
}: PageSectionProps) {
  return (
    <section
      id={id}
      className={`py-10 sm:py-12 border-b border-slate-800/70 last:border-b-0 ${className}`}
    >
      {(title || description || actions) && (
        <header
          className={`flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6 sm:mb-8 ${
            bleed ? "px-4 sm:px-6" : ""
          }`}
        >
          <div>
            {title && <h2 className="text-xl sm:text-2xl font-black text-white">{title}</h2>}
            {description && <p className="text-sm text-slate-400 mt-1 max-w-2xl">{description}</p>}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </header>
      )}
      <div className={bleed ? "" : ""}>{children}</div>
    </section>
  );
}

interface StatItemProps {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
}

export function StatStrip({ children }: { children: ReactNode }) {
  return (
    <dl className="grid grid-cols-2 sm:flex sm:flex-wrap sm:divide-x sm:divide-slate-800 gap-6 sm:gap-0">
      {children}
    </dl>
  );
}

export function StatItem({ label, value, detail }: StatItemProps) {
  return (
    <div className="sm:px-8 first:sm:pl-0 last:sm:pr-0">
      <dt className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</dt>
      <dd className="text-2xl sm:text-3xl font-black text-white mt-1 tabular-nums">{value}</dd>
      {detail && <dd className="text-xs text-slate-400 mt-1">{detail}</dd>}
    </div>
  );
}
