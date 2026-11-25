"use client";

import { useEffect, useRef } from "react";
import { loadPuzzles, loadTwisty } from "@/lib/cubing";
import { recolorSvg, type ColorScheme } from "@/lib/colorSchemes";
import Square1Image from "./Square1Image";

const NO_COLORS: ColorScheme = {};

/** A flat picture of the scrambled puzzle, in the event's color scheme. */
export default function ScrambleImage({ puzzleId, scramble, scheme = NO_COLORS }: { puzzleId: string; scramble: string; scheme?: ColorScheme }) {
  // cubing.js's Square-1 picture is small and hard to read, so it gets its own.
  if (puzzleId === "square1") return <Square1Image scramble={scramble} scheme={scheme} />;
  return <CubingImage puzzleId={puzzleId} scramble={scramble} scheme={scheme} />;
}

/**
 * cubing.js's 2D picture of the puzzle. Drawn with its SVG animator (what
 * TwistyPlayer uses for 2D) from the puzzle's SVG with the scheme's colors
 * swapped in, since TwistyPlayer has no way to change sticker colors.
 */
function CubingImage({ puzzleId, scramble, scheme }: { puzzleId: string; scramble: string; scheme: ColorScheme }) {
  const host = useRef<HTMLDivElement>(null);
  // The scheme as a stable dependency (callers build new objects each render).
  const schemeKey = JSON.stringify(scheme);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [{ puzzles }, { ExperimentalSVGAnimator }] = await Promise.all([loadPuzzles(), loadTwisty()]);
      const loader = puzzles[puzzleId];
      if (!loader?.svg) return;
      const [kpuzzle, svg] = await Promise.all([loader.kpuzzle(), loader.svg()]);
      if (cancelled || !host.current) return;
      // The scheme came from schemeKey; parse it back so this effect only depends on the string.
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      const colors = JSON.parse(schemeKey) as ColorScheme;
      const animator = new ExperimentalSVGAnimator(kpuzzle, recolorSvg(svg, puzzleId, colors));
      animator.drawPattern(kpuzzle.defaultPattern().applyAlg(scramble));
      host.current.replaceChildren(animator.wrapperElement);
    })().catch(() => {
      // A scramble the puzzle can't read leaves the last picture; the scramble text is still shown.
    });
    return () => {
      cancelled = true;
    };
  }, [puzzleId, scramble, schemeKey]);

  // Sized to fill the box; hint facelets (the dimmed copies cubing.js draws beside some faces) hidden, as TwistyPlayer does with hintFacelets: "none".
  return <div ref={host} className="h-full w-full [&_.hint-facelet]:hidden [&_.svg-wrapper]:h-full [&_.svg-wrapper]:w-full [&_svg]:h-full [&_svg]:w-full" aria-hidden />;
}
