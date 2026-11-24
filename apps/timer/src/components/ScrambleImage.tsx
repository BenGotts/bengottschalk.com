"use client";

import { useEffect, useRef } from "react";
import { loadTwisty } from "@/lib/cubing";
import Square1Image from "./Square1Image";

type Player = HTMLElement & { experimentalSetupAlg: unknown };

/** A flat picture of the scrambled puzzle. */
export default function ScrambleImage({ puzzleId, scramble }: { puzzleId: string; scramble: string }) {
  // cubing.js's Square-1 picture is small and hard to read, so it gets its own.
  if (puzzleId === "square1") return <Square1Image scramble={scramble} />;
  return <TwistyImage puzzleId={puzzleId} scramble={scramble} />;
}

/** cubing.js's 2D picture of the puzzle. */
function TwistyImage({ puzzleId, scramble }: { puzzleId: string; scramble: string }) {
  const host = useRef<HTMLDivElement>(null);
  const player = useRef<Player | null>(null);
  const latest = useRef(scramble);

  // One player per puzzle, made once cubing.js has loaded.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { TwistyPlayer } = await loadTwisty();
      if (cancelled || !host.current) return;
      const element = new TwistyPlayer({
        // Our puzzle ids are cubing.js's (see PUZZLES in timer-core's events).
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion
        puzzle: puzzleId as never,
        visualization: "2D",
        controlPanel: "none",
        background: "none",
        hintFacelets: "none",
        experimentalSetupAlg: latest.current,
        alg: "",
      });
      host.current.replaceChildren(element);
      player.current = element;
    })();
    return () => {
      cancelled = true;
      player.current = null;
    };
  }, [puzzleId]);

  useEffect(() => {
    latest.current = scramble;
    if (player.current) player.current.experimentalSetupAlg = scramble;
  }, [scramble]);

  return <div ref={host} className="h-full w-full" aria-hidden />;
}
