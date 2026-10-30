import { Suspense } from "react";
import LiveIndicator from "@/components/LiveIndicator";
import CubingTabs from "@/components/cubing/CubingTabs";

export default function CubingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-10">
      {/* The live dot streams in, so it never holds up the page. */}
      <CubingTabs competitionsIndicator={<Suspense fallback={null}><LiveIndicator placement="inline" /></Suspense>} />
      {children}
    </div>
  );
}
