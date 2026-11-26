/**
 * A Megaminx scramble split into its lines, each ending with its U or U' move,
 * the way the WCA prints them. Works whether or not the scramble already has
 * line breaks (one typed in on a single line gets them too).
 */
export function megaminxLines(scramble: string): string[] {
  const lines: string[] = [];
  let line: string[] = [];
  for (const move of scramble.trim().split(/\s+/)) {
    if (!move) continue;
    line.push(move);
    if (move === "U" || move === "U'") {
      lines.push(line.join(" "));
      line = [];
    }
  }
  if (line.length > 0) lines.push(line.join(" "));
  return lines;
}
