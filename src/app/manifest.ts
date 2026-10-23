import type { MetadataRoute } from "next";
import { SITE_NAME } from "@/consts";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: "Competitive cuber, WCA Delegate, and software developer.",
    start_url: "/",
    display: "browser",
    background_color: "#0B1220",
    theme_color: "#0B1220",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/apple-icon", type: "image/png", sizes: "180x180" },
    ],
  };
}
