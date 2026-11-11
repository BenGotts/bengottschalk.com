"use client";

import TwistyCube from "@bengottschalk/cube/TwistyCube";
import { useRandomSolve } from "@bengottschalk/cube/useRandomSolve";

/**
 * The website's self-solving cube, playing my official PR or my at-home PB
 * (picked at random), with a caption saying which.
 */
export default function HeaderCube() {
  const solve = useRandomSolve();
  return (
    <figure className="flex flex-col items-center gap-3">
      {/* The cube draws past its box in 3D, so it gets room above and below. */}
      <TwistyCube solve={solve} className="my-8 [--cubie:2.25rem]" />
      {/* Hidden until the pick, which happens in the browser, so the layout doesn't move. */}
      <figcaption className={`text-xs text-muted ${solve ? "" : "invisible"}`}>
        Solving my {solve?.title ?? "3x3 PR"}
      </figcaption>
    </figure>
  );
}
