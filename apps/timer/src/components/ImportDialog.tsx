"use client";

import { useState } from "react";
import { parseCsTimerExport, type CsTimerSession } from "@bengottschalk/timer-core/cstimer";
import { TIMER_EVENTS, timerEvent } from "@bengottschalk/timer-core/events";
import { uuidv7 } from "@bengottschalk/timer-core/id";
import { createBranch } from "@bengottschalk/timer-core/sessions";
import type { Solve } from "@bengottschalk/timer-core/solve";
import { db, ensureMainSession, saveSession } from "@/lib/db";
import Modal from "./Modal";

interface Plan {
  session: CsTimerSession;
  eventId: string;
  target: "main" | "branch" | "skip";
}

const isTarget = (value: string): value is Plan["target"] => value === "main" || value === "branch" || value === "skip";

export default function ImportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const read = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setResult(null);
    try {
      const sessions = parseCsTimerExport(await file.text());
      setPlans(sessions.map((session) => {
        const timed = session.eventId !== null && timerEvent(session.eventId).kind === "time";
        return { session, eventId: timed ? session.eventId! : "", target: session.solves.length === 0 || !timed ? "skip" : "main" };
      }));
    } catch (e) {
      setPlans(null);
      setError(e instanceof Error ? e.message : "Couldn't read that file.");
    }
  };

  const update = (index: number, changes: Partial<Plan>) => setPlans((current) => current && current.map((plan, i) => (i === index ? { ...plan, ...changes } : plan)));

  const run = async () => {
    if (!plans) return;
    setBusy(true);
    let added = 0;
    let skipped = 0;
    try {
      for (const plan of plans) {
        if (plan.target === "skip" || !plan.eventId) continue;
        const main = await ensureMainSession(plan.eventId);
        let sessionId = main.id;
        if (plan.target === "branch") {
          const branch = createBranch(main, { id: uuidv7(), name: `csTimer: ${plan.session.name}`, goal: null, now: Date.now() });
          await saveSession(branch);
          sessionId = branch.id;
        }
        // Importing the same file twice doesn't duplicate solves.
        const existing = await db.solves.where("eventId").equals(plan.eventId).toArray();
        const seen = new Set(existing.map((s) => `${s.startedAt}|${s.timeMs}|${s.scramble}`));
        const now = Date.now();
        const solves: Solve[] = [];
        for (const solve of plan.session.solves) {
          const key = `${solve.startedAt}|${solve.timeMs}|${solve.scramble}`;
          if (seen.has(key)) {
            skipped++;
            continue;
          }
          seen.add(key);
          const blindfolded = plan.eventId.endsWith("bf");
          const memoMs = blindfolded && solve.phasesMs && solve.phasesMs.length === 2 ? solve.phasesMs[0] : null;
          solves.push({
            id: uuidv7(solve.startedAt || now),
            eventId: plan.eventId,
            sessionId,
            timeMs: solve.timeMs,
            penalty: solve.penalty,
            scramble: solve.scramble,
            comment: solve.comment,
            startedAt: solve.startedAt,
            endedAt: null,
            source: "home",
            competition: null,
            memoMs,
            fmc: null,
            multi: null,
            entry: "import",
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
          });
        }
        await db.solves.bulkAdd(solves);
        added += solves.length;
      }
      setResult(`Imported ${added} solves${skipped ? ` (${skipped} were already here)` : ""}.`);
      setPlans(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "The import stopped partway.");
    } finally {
      setBusy(false);
    }
  };

  const close = () => {
    setPlans(null);
    setError(null);
    setResult(null);
    onClose();
  };

  return (
    <Modal open={open} onClose={close} title="Import from csTimer" wide>
      <div className="space-y-4">
        <p className="text-sm text-muted">
          In csTimer, open Export, choose <em>Export to file</em>, then pick that file here. Each csTimer session goes into an event's Main session, or into a new branch if you'd rather keep it separate.
        </p>
        <input type="file" accept=".txt,.json,application/json,text/plain" className="file-input file-input-sm w-full" onChange={(e) => void read(e.target.files?.[0])} />
        {error && <p className="text-sm text-error" role="alert">{error}</p>}
        {result && <output className="block text-sm text-success">{result}</output>}

        {plans && (
          <>
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr><th scope="col">csTimer session</th><th scope="col">Solves</th><th scope="col">Event</th><th scope="col">Into</th></tr>
                </thead>
                <tbody>
                  {plans.map((plan, i) => (
                    <tr key={plan.session.index}>
                      <td>{plan.session.name}</td>
                      <td>{plan.session.solves.length}</td>
                      <td>
                        <select className="select select-xs" aria-label={`Event for ${plan.session.name}`} value={plan.eventId} onChange={(e) => update(i, { eventId: e.target.value })}>
                          <option value="">Choose…</option>
                          {TIMER_EVENTS.filter((event) => event.kind === "time").map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}
                        </select>
                      </td>
                      <td>
                        <select className="select select-xs" aria-label={`Where to put ${plan.session.name}`} value={plan.target} onChange={(e) => isTarget(e.target.value) && update(i, { target: e.target.value })}>
                          <option value="main">Main session</option>
                          <option value="branch">New branch</option>
                          <option value="skip">Don't import</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted">FMC and Multi-Blind sessions aren't imported, since csTimer doesn't keep their move counts or cube counts.</p>
            <button type="button" className="btn btn-primary" disabled={busy || plans.every((p) => p.target === "skip" || !p.eventId)} onClick={() => void run()}>
              {busy ? "Importing…" : "Import"}
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}
