"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function ConsentForm() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // On success the auth client follows the redirect back to the MCP client.
  async function answer(accept: boolean) {
    setPending(true);
    const { error } = await authClient.oauth2.consent({ accept });
    if (error) {
      setMessage(error.message ?? "That didn't work. Start connecting again from your MCP client.");
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {message && (
        <p role="alert" className="rounded-box border border-error/40 bg-error/10 px-4 py-3 text-sm">
          {message}
        </p>
      )}
      <div className="flex gap-3">
        <button type="button" className="btn btn-primary flex-1" disabled={pending} onClick={() => void answer(true)}>
          Allow
        </button>
        <button type="button" className="btn flex-1" disabled={pending} onClick={() => void answer(false)}>
          Deny
        </button>
      </div>
    </div>
  );
}
