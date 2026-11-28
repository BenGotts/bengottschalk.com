import { Fragment } from "react";

/**
 * A Megaminx scramble's lines: WCA scrambles are seven lines of R/D moves,
 * each ending in a U or U', and they're read a line at a time. Null for
 * other puzzles (Megaminx is the only one with ++ and -- moves).
 */
export function megaminxLines(scramble: string): string[] | null {
  if (!/\+\+|--/.test(scramble)) return null;
  return scramble.trim().split(/(?<=(?:^|\s)U'?)\s+/);
}

/** Moves with a space between them, never breaking a line inside one. */
function Moves({ parts }: { parts: string[] }) {
  return parts.map((part, i) => (
    // Index keys are fine: the parts of one scramble never reorder.
    // oxlint-disable-next-line react/no-array-index-key
    <Fragment key={i}><span className="whitespace-nowrap">{part.trim()}</span>{" "}</Fragment>
  ));
}

/**
 * A scramble as text: Megaminx a line per U move, and no line ever broken
 * inside a move (a Square-1 move like "(1, -3) /", or a Megaminx "D--"
 * after its first hyphen). Anything else is shown as it is.
 */
export function ScrambleText({ scramble }: { scramble: string }) {
  const lines = megaminxLines(scramble);
  if (lines) {
    // Left-aligned in a block that's centered (or not) with the text around it, so
    // the moves line up in columns: a line ending in U is a character shorter than one ending in U'.
    // On a phone the type shrinks just enough that a whole line (about 43 characters) fits, even in a dialog.
    return (
      <span className="inline-block text-left text-[length:min(1em,3vw)]">
        {lines.map((line, i) => (
          // oxlint-disable-next-line react/no-array-index-key
          <span key={i} className="block"><Moves parts={line.split(/\s+/)} /></span>
        ))}
      </span>
    );
  }
  if (scramble.includes("(")) return <Moves parts={scramble.match(/[^/]+\/?|\//g) ?? [scramble]} />;
  return scramble;
}
