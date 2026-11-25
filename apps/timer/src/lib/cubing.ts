// cubing.js, loaded at runtime from the copy bundled into public/vendor/cubing
// (see scripts/bundle-cubing.mjs for why it isn't bundled by Next).

type ScrambleModule = typeof import("cubing/scramble");
type TwistyModule = typeof import("cubing/twisty");
type PuzzlesModule = typeof import("cubing/puzzles");
type AlgModule = typeof import("cubing/alg");

const cache = new Map<string, Promise<unknown>>();

function load<T>(url: string): Promise<T> {
  let promise = cache.get(url);
  if (!promise) {
    promise = import(/* webpackIgnore: true */ /* turbopackIgnore: true */ url);
    cache.set(url, promise);
  }
  // The module at `url` is the bundle of the cubing.js entry point T describes.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return promise as Promise<T>;
}

export const loadScramble = () => load<ScrambleModule>("/vendor/cubing/scramble.js");
export const loadTwisty = () => load<TwistyModule>("/vendor/cubing/twisty.js");
export const loadPuzzles = () => load<PuzzlesModule>("/vendor/cubing/puzzles.js");
export const loadAlg = () => load<AlgModule>("/vendor/cubing/alg.js");
