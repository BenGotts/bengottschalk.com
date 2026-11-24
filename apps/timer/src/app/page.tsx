import type { Metadata } from "next";
import ComingSoon from "@/components/ComingSoon";
import TimerApp from "@/components/TimerApp";

// Set TIMER_PLACEHOLDER=1 (Vercel: Production only) to show a "coming soon"
// page instead of the timer while it's being built. Read at build time.
const placeholder = process.env.TIMER_PLACEHOLDER === "1";

export const metadata: Metadata = placeholder ? { robots: { index: false } } : {};

export default function Page() {
  return placeholder ? <ComingSoon /> : <TimerApp />;
}
