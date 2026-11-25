import TimerApp from "@/components/TimerApp";
import { isAuthConfigured } from "@/lib/auth";

export default function Page() {
  // Whether sign-in is set up is read when the page is built: set the
  // sign-in variables before building (turbo.json passes them through on Vercel).
  return <TimerApp authEnabled={isAuthConfigured()} />;
}
