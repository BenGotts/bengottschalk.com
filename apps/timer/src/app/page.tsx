import TimerApp from "@/components/TimerApp";
import { isAuthConfigured } from "@/lib/auth";

export default function Page() {
  // Read when the page is built: set the sign-in variables before building
  // (they're listed in turbo.json so Turborepo passes them through on Vercel).
  return <TimerApp authEnabled={isAuthConfigured()} />;
}
