import type { Metadata } from "next";
import PadApp from "@/components/pad/PadApp";

export const metadata: Metadata = {
  title: "Phone as stackmat pads",
  description: "Use your phone as a stackmat's two pads for the timer open on your computer.",
};

export default function Page() {
  return <PadApp />;
}
