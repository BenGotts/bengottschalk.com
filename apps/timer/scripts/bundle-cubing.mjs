// Bundles cubing.js (scrambles, the scramble picture and the FMC solution
// check) into public/vendor/cubing as plain ES modules, which the app loads
// at runtime rather than through Next's bundler.
//
// Why: cubing.js starts its scramble search in a web worker whose URL it works
// out at runtime. Next's bundler copies that worker file as a static asset
// without its imports, so the worker can't start. esbuild (which cubing.js
// supports) keeps the worker chunk and its imports together.

import { build } from "esbuild";
import { rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const outdir = fileURLToPath(new URL("../public/vendor/cubing", import.meta.url));

await rm(outdir, { recursive: true, force: true });
await build({
  entryPoints: {
    scramble: "cubing/scramble",
    twisty: "cubing/twisty",
    puzzles: "cubing/puzzles",
    alg: "cubing/alg",
  },
  bundle: true,
  splitting: true,
  format: "esm",
  target: "es2022",
  minify: true,
  outdir,
  chunkNames: "chunks/[name]-[hash]",
  logLevel: "warning",
});
console.log("Bundled cubing.js into public/vendor/cubing");
