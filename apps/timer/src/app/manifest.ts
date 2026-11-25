import type { MetadataRoute } from "next";
import { TIMER_NAME } from "@bengottschalk/content/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: TIMER_NAME,
    short_name: "Timer",
    description: "A speedcubing timer with every WCA event.",
    start_url: "/",
    display: "standalone",
    background_color: "#0B1220",
    theme_color: "#0B1220",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
