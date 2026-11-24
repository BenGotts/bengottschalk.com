"use client";

import { useEffect, useState } from "react";
import { timerEvent } from "@bengottschalk/timer-core/events";
import type { ColorScheme } from "@/lib/colorSchemes";
import { checkScramble, type ScrambleCheck } from "@/lib/scrambles";
import Modal from "./Modal";
import ScrambleImage from "./ScrambleImage";

/** Type or paste a scramble (from a competition, a friend, a video). It's checked against the puzzle as you type, with a picture once it reads. */
export default function CustomScrambleDialog({ open, eventId, scheme, onClose, onUse }: {
  open: boolean;
  eventId: string;
  scheme: ColorScheme;
  onClose: () => void;
  onUse: (scramble: string) => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title={`Enter a ${timerEvent(eventId).shortName} scramble`} wide>
      <CustomScrambleForm key={eventId} eventId={eventId} scheme={scheme} onUse={onUse} />
    </Modal>
  );
}

function CustomScrambleForm({ eventId, scheme, onUse }: { eventId: string; scheme: ColorScheme; onUse: (scramble: string) => void }) {
  const [text, setText] = useState("");
  const [check, setCheck] = useState<{ text: string; result: ScrambleCheck } | null>(null);
  const event = timerEvent(eventId);

  // Check shortly after typing stops.
  useEffect(() => {
    if (!text.trim()) return undefined;
    let current = true;
    const id = setTimeout(() => {
      void (async () => {
        const result = await checkScramble(eventId, text);
        if (current) setCheck({ text, result });
      })();
    }, 250);
    return () => {
      current = false;
      clearTimeout(id);
    };
  }, [eventId, text]);

  const result = check?.text === text ? check.result : null;
  const valid = result?.ok === true ? result : null;

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onUse(valid.scramble);
      }}
    >
      <label htmlFor="custom-scramble" className="block text-sm text-muted">Scramble</label>
      <textarea
        id="custom-scramble"
        className={`textarea timer-digits w-full ${result && !result.ok ? "textarea-error" : ""}`}
        rows={3}
        // oxlint-disable-next-line jsx-a11y/no-autofocus -- the dialog exists to type this
        autoFocus
        placeholder={event.puzzleId === "square1" ? "(1,0) / (-3,3) / …" : "R U R' U' …"}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          // Enter uses it; Shift+Enter adds a line.
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (valid) onUse(valid.scramble);
          }
        }}
      />
      <p className="min-h-5 text-sm" aria-live="polite">
        {!text.trim() ? <span className="text-muted">Checked against the puzzle as you type.</span>
          : !result ? <span className="text-muted">Checking…</span>
          : result.ok ? <span className="text-success">Looks good.</span>
          : <span className="text-error">{result.error}</span>}
      </p>
      {valid && event.puzzleId && (
        <div className="mx-auto h-40 w-56">
          <ScrambleImage puzzleId={event.puzzleId} scramble={valid.scramble} scheme={scheme} />
        </div>
      )}
      <div className="flex justify-end">
        <button type="submit" className="btn btn-primary" disabled={!valid}>Use this scramble</button>
      </div>
    </form>
  );
}
