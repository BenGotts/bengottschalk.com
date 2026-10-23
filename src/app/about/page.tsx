import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import AboutMe from "@/components/about/AboutMe";
import Connect from "@/components/about/Connect";
import Experience from "@/components/about/Experience";
import HobbiesInterests from "@/components/about/HobbiesInterests";

export const metadata: Metadata = pageMetadata({
  title: "About",
  description: "About Ben Gottschalk: speedcuber, trumpet player, and software developer, with his experience and how to connect.",
  path: "/about",
});

export default function About() {
  return (
    <div className="mx-auto max-w-3xl space-y-14">
      <AboutMe />
      <HobbiesInterests />
      <Experience />
      <Connect />
    </div>
  )
}
