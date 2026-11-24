"use client";

import { useEffect, useRef, useState } from "react";
import { formatTime, parseTime, type ParsedTime, type Precision } from "@bengottschalk/timer-core/time";

/** Type a time and press Enter. Typed times are saved exactly as typed. */
export default function TypingEntry({ precision, onSave, disabled }: { precision: Precision; onSave: (time: ParsedTime) => void; disabled: boolean }) {
  const [text, setText] = useState("");
  const input = useRef<HTMLInputElement>(null);
  // Ready to type straight away.
  useEffect(() => input.current?.focus(), []);
  const parsed = parseTime(text, precision);

  return (
    <form
      className="flex w-full max-w-sm flex-col items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!parsed) return;
        onSave(parsed);
        setText("");
      }}
    >
      <label className="sr-only" htmlFor="typed-time">Time</label>
      <input
        id="typed-time"
        className="input input-lg timer-digits w-full text-center text-4xl"
        inputMode="decimal"
        autoComplete="off"
        ref={input}
        value={text}
        disabled={disabled}
        onChange={(e) => setText(e.target.value)}
        placeholder="12.34"
      />
      <p className="h-5 text-sm text-muted">
        {text && (parsed ? `${parsed.penalty === "dnf" ? "DNF " : ""}${formatTime(parsed.ms, "thousandths")}${parsed.penalty === "+2" ? " +2" : ""} · Enter to save` : "Not a time yet")}
      </p>
    </form>
  );
}
