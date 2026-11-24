"use client";

import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { Auth } from "./auth";

export const authClient = createAuthClient({ plugins: [inferAdditionalFields<Auth>()] });

/**
 * Sends the person to WCA to sign in, then back to the timer. Resolves with
 * an error message if sign-in couldn't start (the page stays put then).
 */
export async function signInWithWca(): Promise<string | null> {
  const message = "Couldn't start signing in with WCA. Try again in a moment.";
  try {
    const { error } = await authClient.signIn.social({ provider: "wca", callbackURL: window.location.pathname });
    return error ? message : null;
  } catch {
    return message;
  }
}
