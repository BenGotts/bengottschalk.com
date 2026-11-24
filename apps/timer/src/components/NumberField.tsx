"use client";

import { useState } from "react";

/**
 * A whole-number box you can clear and type into freely. A number input that
 * clamps on every keystroke can't be emptied (it snaps back to the minimum),
 * so this keeps the typed text and only reports a value when it's in range.
 */
export default function NumberField({ value, onChange, onValidity, min, max, className = "", id, "aria-label": ariaLabel }: {
  value: number;
  onChange: (value: number) => void;
  /** Told whether the box holds an in-range number, so a submit button can wait for one. */
  onValidity?: (valid: boolean) => void;
  min: number;
  max: number;
  className?: string;
  id?: string;
  "aria-label"?: string;
}) {
  const [draft, setDraft] = useState(String(value));
  const [lastValue, setLastValue] = useState(value);
  // Follow changes made from outside (e.g. the attempt changed).
  if (value !== lastValue) {
    setLastValue(value);
    setDraft(String(value));
  }
  const parsed = /^\d+$/.test(draft.trim()) ? Number(draft.trim()) : null;
  const valid = parsed !== null && parsed >= min && parsed <= max;

  return (
    <input
      id={id}
      aria-label={ariaLabel}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      autoComplete="off"
      className={`input ${valid ? "" : "input-error"} ${className}`}
      aria-invalid={!valid}
      title={valid ? undefined : `A whole number from ${min} to ${max}`}
      value={draft}
      onFocus={(e) => e.target.select()}
      onChange={(e) => {
        const text = e.target.value.replace(/[^\d]/g, "");
        setDraft(text);
        const n = text === "" ? null : Number(text);
        const ok = n !== null && n >= min && n <= max;
        onValidity?.(ok);
        if (ok) {
          setLastValue(n);
          onChange(n);
        }
      }}
    />
  );
}

