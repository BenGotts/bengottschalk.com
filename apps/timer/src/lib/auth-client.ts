"use client";

import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { Auth } from "./auth";

export const authClient = createAuthClient({ plugins: [inferAdditionalFields<Auth>()] });

/** Sends the person to WCA to sign in, then back to the timer. */
export async function signInWithWca(): Promise<void> {
  await authClient.signIn.social({ provider: "wca", callbackURL: window.location.pathname });
}
