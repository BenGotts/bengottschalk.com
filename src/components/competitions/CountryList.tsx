"use client";

import { useState } from "react";
import { ReactCountryFlag } from "react-country-flag";

export interface CountryRow {
  iso2: string;
  name: string;
  /** e.g. "42 competitions · since 2016". */
  detail: string;
  badge: { label: string; className: string } | null;
}

/**
 * Countries, most-visited first. Only the first few show until "Show all",
 * so the card stays about the size of the states card however many there are.
 */
export default function CountryList({ rows, initial = 6 }: { rows: CountryRow[]; initial?: number }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? rows : rows.slice(0, initial);

  return (
    <div className="space-y-3">
      <ul className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {visible.map((row) => (
          <li key={row.iso2} className="flex items-center gap-3">
            <ReactCountryFlag countryCode={row.iso2} svg aria-hidden="true" className="shrink-0 rounded-[2px]" style={{ width: "1.5em", height: "1.125em" }} />
            <span className="min-w-0 flex-1">
              <span className="block font-medium">{row.name}</span>
              <span className="block text-xs text-muted">{row.detail}</span>
            </span>
            {row.badge && <span className={`badge badge-sm whitespace-nowrap ${row.badge.className}`}>{row.badge.label}</span>}
          </li>
        ))}
      </ul>
      {rows.length > initial && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          className="btn btn-sm w-full border-base-300 bg-base-100 hover:border-primary"
        >
          {expanded ? "Show fewer" : `Show all ${rows.length} countries`}
        </button>
      )}
    </div>
  );
}
