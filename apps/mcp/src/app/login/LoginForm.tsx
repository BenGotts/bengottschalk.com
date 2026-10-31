"use client";

import { useState } from "react";
import { FaGithub } from "react-icons/fa";
import { authClient } from "@/lib/auth-client";

const ERRORS: Record<string, string> = {
  forbidden: "That account can't sign in here: this server is private.",
  default: "Sign-in didn't work. Please try again.",
};

export default function LoginForm({ error, devPasswordSignIn }: { error?: string; devPasswordSignIn: boolean }) {
  const [message, setMessage] = useState(error ? (ERRORS[error] ?? ERRORS.default) : null);
  const [pending, setPending] = useState(false);

  async function signInWithGitHub() {
    setPending(true);
    const { error: signInError } = await authClient.signIn.social({
      provider: "github",
      callbackURL: "/",
      errorCallbackURL: "/login?error=forbidden",
    });
    if (signInError) {
      setMessage(signInError.message ?? ERRORS.default);
      setPending(false);
    }
  }

  // Local development only: there's no GitHub app for localhost.
  async function devSignIn(formData: FormData) {
    setPending(true);
    const email = formData.get("email");
    const password = formData.get("password");
    if (typeof email !== "string" || typeof password !== "string") return;
    const signIn = await authClient.signIn.email({ email, password });
    const result = signIn.error ? await authClient.signUp.email({ email, password, name: "Owner" }) : signIn;
    if (result.error) {
      setMessage(result.error.message ?? ERRORS.default);
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {message && (
        <p role="alert" className="rounded-box border border-error/40 bg-error/10 px-4 py-3 text-sm">
          {message}
        </p>
      )}
      <button type="button" className="btn btn-primary" disabled={pending} onClick={() => void signInWithGitHub()}>
        <FaGithub className="size-5" aria-hidden="true" />
        Sign in with GitHub
      </button>
      {devPasswordSignIn && (
        <form action={devSignIn} className="flex flex-col gap-2 rounded-box border border-dashed border-base-300 p-4">
          <p className="text-sm text-muted">Development only: sign in with OWNER_EMAIL and any password (8+ characters).</p>
          <input name="email" type="email" required placeholder="Email" className="input w-full" />
          <input name="password" type="password" required minLength={8} placeholder="Password" className="input w-full" />
          <button type="submit" className="btn" disabled={pending}>Sign in</button>
        </form>
      )}
    </div>
  );
}
