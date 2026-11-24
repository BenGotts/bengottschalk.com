"use client";

import { useMemo } from "react";
import { faceColor, isEdgeWedge, layerPieces, sideColor, square1State, type Square1Color } from "@bengottschalk/timer-core/square1";
import { isDark, type ColorScheme } from "@/lib/colorSchemes";

/** The standard colors; a color scheme can replace any face's (see colorSchemes.ts). */
const STANDARD: Record<Square1Color, string> = {
  U: "#ffd500",
  D: "#ffffff",
  F: "#e8112d",
  B: "#ff8a00",
  L: "#2a62ff",
  R: "#2fbf3a",
};

const EDGE_RADIUS = 1 / Math.cos(Math.PI / 12);
const CORNER_RADIUS = Math.SQRT2;
/** How far in the top or bottom sticker reaches; the rest of each piece shows its side colour. */
const FACE_SCALE = 0.74;
const STROKE = "#0b0f19";
const LIGHT_STROKE = "#6b7280";

/** A point at `degrees` clockwise from straight up. */
const at = (degrees: number, radius: number): [number, number] => {
  const radians = (degrees * Math.PI) / 180;
  return [radius * Math.sin(radians), -radius * Math.cos(radians)];
};
const points = (list: [number, number][], scale = 1) => list.map(([x, y]) => `${(x * scale).toFixed(4)},${(y * scale).toFixed(4)}`).join(" ");

/**
 * One layer. `firstSlotAngle`: where slot 0 starts, clockwise from the top of
 * the picture; slots go clockwise from there, 30° each.
 */
function Layer({ layer, firstSlotAngle, cutAngle, cx, colors }: { layer: number[]; firstSlotAngle: number; cutAngle: number; cx: number; colors: Record<Square1Color, string> }) {
  return (
    <g transform={`translate(${cx} 0)`} stroke={STROKE} strokeWidth={0.035} strokeLinejoin="round">
      {layerPieces(layer).map(({ slot, wedges }) => {
        const start = firstSlotAngle + slot * 30;
        const outline: [number, number][] = isEdgeWedge(wedges[0])
          ? [at(start, EDGE_RADIUS), at(start + 30, EDGE_RADIUS)]
          : [at(start, EDGE_RADIUS), at(start + 30, CORNER_RADIUS), at(start + 60, EDGE_RADIUS)];
        return (
          <g key={slot}>
            {/* Side stickers: one per wedge (a corner's two halves meet at its tip). */}
            {wedges.map((wedge, i) => (
              <polygon key={wedge} fill={colors[sideColor(wedge)]} points={points([[0, 0], outline[i], outline[i + 1]])} />
            ))}
            {/* Dark stickers (a black top, say) get light outlines so the pieces still show. */}
            <polygon
              fill={colors[faceColor(wedges[0])]}
              stroke={isDark(colors[faceColor(wedges[0])]) ? LIGHT_STROKE : STROKE}
              points={points([[0, 0], ...outline], FACE_SCALE)}
            />
          </g>
        );
      })}
      {/* The slice: "/" turns everything on the right of this line. */}
      <line x1={at(cutAngle, 1.55)[0]} y1={at(cutAngle, 1.55)[1]} x2={at(cutAngle + 180, 1.55)[0]} y2={at(cutAngle + 180, 1.55)[1]} stroke="currentColor" strokeWidth={0.05} strokeDasharray="0.12 0.08" opacity={0.7} />
    </g>
  );
}

/**
 * Square-1 after a scramble: the top seen from above (front at the bottom),
 * the bottom seen from below (front at the top), and the front of the middle
 * layer under the top, which shows whether the middle is square.
 */
export default function Square1Image({ scramble, scheme }: { scramble: string; scheme?: ColorScheme }) {
  const state = useMemo(() => square1State(scramble), [scramble]);
  if (!state) return null;
  const colors = { ...STANDARD, ...scheme };
  const cut = Math.tan(Math.PI / 12);
  return (
    <svg viewBox="-3.2 -1.55 6.4 3.75" className="h-full w-full" aria-hidden>
      {/* Top: slot 0 begins just left of the cut at the front. */}
      <Layer layer={state.top} firstSlotAngle={195} cutAngle={15} cx={-1.6} colors={colors} />
      {/* Bottom: slot 12 is the front edge, at the top of the picture. */}
      <Layer layer={state.bottom} firstSlotAngle={-15} cutAngle={-15} cx={1.6} colors={colors} />
      <g transform="translate(-1.6 1.75)" stroke={STROKE} strokeWidth={0.035}>
        <rect x={-1} y={0} width={1 - cut} height={0.3} fill={colors.F} />
        {state.middleFlipped
          ? <rect x={cut} y={0} width={1 - cut} height={0.3} fill={colors.B} />
          : <rect x={-cut} y={0} width={1 + cut} height={0.3} fill={colors.F} />}
      </g>
    </svg>
  );
}
