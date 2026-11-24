"use client";

import { useState } from "react";
import type { Settings } from "@/lib/settings";
import { useLiveQuery } from "dexie-react-hooks";
import { exportBackup, importBackup } from "@/lib/db";
import { currentWcaId, setWcaId } from "@/lib/wca/results";
import Modal from "./Modal";
import ThemeToggle from "./ThemeToggle";

interface Props {
  open: boolean;
  onClose: () => void;
  settings: Settings;
  onChange: (settings: Settings) => void;
  onImportCsTimer: () => void;
}

/** Saves everything on this device as a JSON file. */
async function download() {
  const blob = new Blob([await exportBackup()], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cube-timer-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

const isEntry = (value: string): value is Settings["entry"] => value === "timer" || value === "typing";
const isPrecision = (value: string): value is Settings["precision"] => value === "hundredths" || value === "thousandths";

export default function SettingsDialog({ open, onClose, settings, onChange, onImportCsTimer }: Props) {
  const [message, setMessage] = useState<string | null>(null);
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => onChange({ ...settings, [key]: value });

  const restore = async (file: File | undefined) => {
    if (!file) return;
    try {
      const result = await importBackup(await file.text());
      setMessage(`Restored ${result.solves} solves and ${result.sessions} sessions.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Couldn't read that backup.");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Settings">
      <div className="space-y-5">
        <section className="space-y-3">
          <h3 className="text-sm font-medium text-muted">Timing</h3>
          <Toggle label="WCA inspection (15 seconds)" checked={settings.inspection} onChange={(v) => set("inspection", v)} />
          <Toggle label="Say “8 seconds” and “12 seconds”" checked={settings.inspectionVoice} onChange={(v) => set("inspectionVoice", v)} disabled={!settings.inspection} />
          <Toggle label="Hide the time while solving" checked={settings.hideRunningTime} onChange={(v) => set("hideRunningTime", v)} />
          <Toggle label="Blindfolded: split memo with the first press" checked={settings.bldMemoSplit} onChange={(v) => set("bldMemoSplit", v)} />
          <label className="flex items-center justify-between gap-4">
            <span>Hold before starting</span>
            <select className="select select-sm w-32" value={settings.holdMs} onChange={(e) => set("holdMs", Number(e.target.value))}>
              {[0, 100, 300, 550, 1000].map((ms) => <option key={ms} value={ms}>{ms === 0 ? "No hold" : `${ms / 1000} s`}</option>)}
            </select>
          </label>
          <label className="flex items-center justify-between gap-4">
            <span>Enter times</span>
            <select className="select select-sm w-32" value={settings.entry} onChange={(e) => isEntry(e.target.value) && set("entry", e.target.value)}>
              <option value="timer">With the timer</option>
              <option value="typing">By typing</option>
            </select>
          </label>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-medium text-muted">Display</h3>
          <label className="flex items-center justify-between gap-4">
            <span>Show times to the</span>
            <select className="select select-sm w-32" value={settings.precision} onChange={(e) => isPrecision(e.target.value) && set("precision", e.target.value)}>
              <option value="hundredths">Hundredth</option>
              <option value="thousandths">Thousandth</option>
            </select>
          </label>
          <p className="text-xs text-muted">Times are always saved to the thousandth. Singles are cut off and averages rounded, the way the WCA shows them.</p>
          <Toggle label="Scramble picture" checked={settings.showScrambleImage} onChange={(v) => set("showScrambleImage", v)} />
          <div className="flex items-center justify-between gap-4"><span>Theme</span><ThemeToggle /></div>
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-medium text-muted">Your data</h3>
          <WcaIdField />
          <p className="text-xs text-muted">Solves are saved in this browser. Signing in with WCA to sync them across devices is coming next.</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-sm" onClick={() => { onClose(); onImportCsTimer(); }}>Import from csTimer</button>
            <button type="button" className="btn btn-sm" onClick={() => void download()}>Download a backup</button>
            <label className="btn btn-sm">
              Restore a backup
              <input type="file" accept="application/json,.json" className="hidden" onChange={(e) => void restore(e.target.files?.[0])} />
            </label>
          </div>
          {message && <output className="block text-sm">{message}</output>}
        </section>
      </div>
    </Modal>
  );
}

/**
 * Temporary, until signing in with WCA: whose competition results to bring
 * into the main sessions. Sign-in will use the signed-in person's WCA ID.
 */
function WcaIdField() {
  const saved = useLiveQuery(() => currentWcaId(), []);
  const [draft, setDraft] = useState<string | null>(null);
  const value = draft ?? saved ?? "";
  const valid = value === "" || /^\d{4}[A-Z]{4}\d{2}$/.test(value);
  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        void setWcaId(value || null).then(() => setDraft(null));
      }}
    >
      <label className="grow">
        <span className="mb-1 block text-xs text-muted">WCA ID for competition results (temporary, until sign-in)</span>
        <input
          className={`input input-sm w-full uppercase ${valid ? "" : "input-error"}`}
          value={value}
          onChange={(e) => setDraft(e.target.value.toUpperCase().replaceAll(/\s/g, ""))}
          placeholder="2016GOTT01"
          aria-invalid={!valid}
        />
      </label>
      <button type="submit" className="btn btn-sm" disabled={!valid || draft === null}>Save</button>
    </form>
  );
}

function Toggle({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: (value: boolean) => void; disabled?: boolean }) {
  return (
    <label className={`flex items-center justify-between gap-4 ${disabled ? "opacity-50" : ""}`}>
      <span>{label}</span>
      <input type="checkbox" className="toggle toggle-primary toggle-sm" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}
