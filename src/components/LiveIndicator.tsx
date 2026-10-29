import { getLiveWindows } from "@/lib/wca";
import LiveDot from "./LiveDot";

/**
 * A pulsing red dot while I'm at a competition, for the header's Cubing
 * link (`inline`) or the phone menu button (`corner`). The server sends the
 * nearby competitions; the browser decides whether one is on right now.
 */
export default async function LiveIndicator({ placement }: { placement: "inline" | "corner" }) {
  const windows = await getLiveWindows();
  if (!windows.ok || windows.data.length === 0) return null;
  return <LiveDot windows={windows.data} placement={placement} />;
}
