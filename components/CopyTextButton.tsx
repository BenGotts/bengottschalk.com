"use client";

import { useState } from "react";

interface CopyTextButtonProps {
  text: string;
  label?: string;
}

export function CopyTextButton({ text, label = "Copy scramble" }: CopyTextButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-950 text-slate-300 hover:text-cyan-400 hover:border-cyan-700 transition-colors"
    >
      {copied ? "Copied!" : label}
    </button>
  );
}
