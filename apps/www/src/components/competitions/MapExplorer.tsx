"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { LuX } from "react-icons/lu";
import ExternalLink from "@/components/ExternalLink";
import { formatIsoDate } from "@/lib/wca/format";
import type { GoalStatus, PlaceVisit } from "@/lib/wca/goals";
import type { RegionProgress } from "@/lib/wca/regions";

export interface PlaceInfo {
  name: string;
  status: GoalStatus;
  visits: PlaceVisit[];
  /** The CubingUSA region, for states. */
  region?: string;
}

type Selection = { place: string } | { region: string } | null;

const ROLE_BADGE: Record<PlaceVisit["role"], string | null> = {
  competed: null,
  delegated: "Delegated",
  upcoming: "Coming up",
};

/**
 * Makes a server-rendered map interactive. Anything inside with a
 * `data-place` code (map shapes, list buttons) selects that place, and the
 * place's competitions show below the map. Picking a region (states only)
 * highlights its states. Other shapes dim while something is selected.
 */
export default function MapExplorer({ map, places, regions, hint, children }: {
  map: ReactNode;
  places: Record<string, PlaceInfo>;
  regions?: RegionProgress[];
  /** Shown below the map while nothing is selected. */
  hint: string;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<Selection>(null);

  // Shapes and list buttons are server-rendered, so their clicks and keys are handled here.
  useEffect(() => {
    const element = ref.current;
    if (!element) return () => {};
    const target = (event: Event) => (event.target instanceof Element ? event.target.closest<HTMLElement | SVGElement>("[data-place]") : null);
    const toggle = (code: string) => setSelection((current) => (current && "place" in current && current.place === code ? null : { place: code }));
    const onClick = (event: MouseEvent) => {
      const place = target(event)?.dataset.place;
      if (place) toggle(place);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelection(null);
      const shape = target(event);
      // Native buttons click themselves on Enter and Space; the map's shapes don't.
      if (!shape?.dataset.place || shape instanceof HTMLButtonElement || (event.key !== "Enter" && event.key !== " ")) return;
      event.preventDefault();
      toggle(shape.dataset.place);
    };
    element.addEventListener("click", onClick);
    element.addEventListener("keydown", onKeyDown);
    return () => {
      element.removeEventListener("click", onClick);
      element.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  // Dim everything outside the selection, and mark what's selected for screen readers.
  useEffect(() => {
    const focus = !selection
      ? null
      : "place" in selection
        ? new Set([selection.place])
        : new Set(regions?.find((region) => region.name === selection.region)?.states);
    for (const element of ref.current?.querySelectorAll<HTMLElement | SVGElement>("[data-place]") ?? []) {
      const code = element.dataset.place ?? "";
      element.toggleAttribute("data-dim", focus !== null && !focus.has(code));
      if (element.getAttribute("role") === "button" || element instanceof HTMLButtonElement) {
        element.setAttribute("aria-pressed", String(focus !== null && "place" in selection! && selection.place === code));
      }
    }
  }, [selection, regions]);

  const place = selection && "place" in selection ? places[selection.place] : undefined;
  const region = selection && "region" in selection ? regions?.find((r) => r.name === selection.region) : undefined;

  return (
    <div ref={ref} className="flex flex-1 flex-col gap-4">
      {map}

      <div aria-live="polite" className="min-h-6">
        {place ? (
          <PlaceDetails place={place} onClose={() => setSelection(null)} onRegion={(name) => setSelection({ region: name })} />
        ) : region ? (
          <RegionDetails region={region} places={places} onClose={() => setSelection(null)} onPlace={(code) => setSelection({ place: code })} />
        ) : (
          <p className="text-sm text-muted">{hint}</p>
        )}
      </div>

      {regions && (
        <RegionList
          regions={regions}
          selected={region?.name}
          onSelect={(name) => setSelection((current) => (current && "region" in current && current.region === name ? null : { region: name }))}
        />
      )}

      {children}
    </div>
  );
}

function Panel({ title, subtitle, onClose, children }: { title: ReactNode; subtitle?: ReactNode; onClose: () => void; children: ReactNode }) {
  return (
    <div className="rounded-box border border-base-300 bg-base-100 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold">{title}</h3>
          {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
        </div>
        <button type="button" className="btn btn-ghost btn-sm btn-square -mt-1 -mr-2" onClick={onClose} aria-label="Close">
          <LuX className="size-4" aria-hidden="true" />
        </button>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function summary(place: PlaceInfo): string {
  const past = place.visits.filter((visit) => visit.role !== "upcoming").length;
  const competitions = `${past} ${past === 1 ? "competition" : "competitions"}`;
  if (place.status === "competed") return `Competed · ${competitions}`;
  if (place.status === "delegated") return `Delegated only · ${competitions}`;
  if (place.status === "upcoming") return "Coming up";
  return "Not yet";
}

function PlaceDetails({ place, onClose, onRegion }: { place: PlaceInfo; onClose: () => void; onRegion: (name: string) => void }) {
  return (
    <Panel
      title={place.name}
      subtitle={
        <>
          {summary(place)}
          {place.region && (
            <>
              {" · "}
              <button type="button" className="link link-hover" onClick={() => onRegion(place.region!)}>
                {place.region} region
              </button>
            </>
          )}
        </>
      }
      onClose={onClose}
    >
      {place.visits.length > 0 ? (
        <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
          {place.visits.map((visit) => (
            <li key={visit.id} className="flex items-baseline gap-3 text-sm">
              <span className="w-24 shrink-0 text-muted tabular-nums">{formatIsoDate(visit.start_date)}</span>
              <span className="min-w-0 flex-1">
                <ExternalLink href={`https://www.worldcubeassociation.org/competitions/${visit.id}`} className="link link-hover font-medium">
                  {visit.name}
                </ExternalLink>
              </span>
              {ROLE_BADGE[visit.role] && (
                <span className={`badge badge-sm shrink-0 whitespace-nowrap ${visit.role === "delegated" ? "border-primary/60 bg-primary/10" : "border-dashed border-secondary"}`}>
                  {ROLE_BADGE[visit.role]}
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">No competitions here yet. Know of one coming up?</p>
      )}
    </Panel>
  );
}

const STATUS_DOT: Record<GoalStatus, string> = {
  competed: "bg-secondary",
  delegated: "bg-primary/50",
  upcoming: "bg-[repeating-linear-gradient(135deg,var(--color-secondary)_0_2px,transparent_2px_5px)] ring-1 ring-secondary ring-inset",
  none: "bg-base-300",
};

function RegionDetails({ region, places, onClose, onPlace }: {
  region: RegionProgress;
  places: Record<string, PlaceInfo>;
  onClose: () => void;
  onPlace: (code: string) => void;
}) {
  const left = region.states.length - region.competed;
  return (
    <Panel
      title={`${region.name} region`}
      subtitle={left === 0 ? `All ${region.states.length} states competed in` : `${region.competed} of ${region.states.length} states · ${left} to go`}
      onClose={onClose}
    >
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-3">
        {region.states
          .map((code) => ({ code, place: places[code] }))
          .toSorted((a, b) => a.place.name.localeCompare(b.place.name))
          .map(({ code, place }) => (
            <li key={code}>
              <button type="button" className="flex items-center gap-2 text-left hover:underline" onClick={() => onPlace(code)}>
                <span className={`size-2.5 shrink-0 rounded-[3px] ${STATUS_DOT[place.status]}`} aria-hidden="true" />
                {place.name}
                <span className="sr-only">: {summary(place)}</span>
              </button>
            </li>
          ))}
      </ul>
    </Panel>
  );
}

function RegionList({ regions, selected, onSelect }: { regions: RegionProgress[]; selected?: string; onSelect: (name: string) => void }) {
  const complete = regions.filter((region) => region.competed === region.states.length).length;
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <h3 className="font-semibold">CubingUSA regions</h3>
        <p className="text-xs text-muted">
          {complete} of {regions.length} regions complete
        </p>
      </div>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {regions.map((region) => {
          const done = region.competed === region.states.length;
          return (
            <li key={region.name}>
              <button
                type="button"
                aria-pressed={selected === region.name}
                aria-label={`${region.name}: ${region.competed} of ${region.states.length} states`}
                onClick={() => onSelect(region.name)}
                className="w-full rounded-field border border-base-300 bg-base-100 px-3 py-2 text-left transition-colors hover:border-secondary/60 aria-pressed:border-secondary aria-pressed:bg-secondary/10"
              >
                <span className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="font-medium">{region.name}</span>
                  <span className={`shrink-0 tabular-nums ${done ? "font-semibold text-secondary" : "text-muted"}`}>
                    {region.competed}/{region.states.length}
                  </span>
                </span>
                <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-base-300" aria-hidden="true">
                  <span className="block h-full rounded-full bg-secondary" style={{ width: `${(region.competed / region.states.length) * 100}%` }} />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
