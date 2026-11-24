// Colors for scramble pictures, per puzzle family.
//
// A color scheme maps a face (or, for puzzles with many faces, a sticker
// color) to the color to draw it in. Faces left out keep the picture's own
// color. Pictures from cubing.js are recolored by swapping fill colors in
// the puzzle's SVG before it's drawn; Square-1 is drawn by Square1Image.

/** Face (or sticker color) → CSS color. */
export type ColorScheme = Record<string, string>;

export interface Face {
  key: string;
  label: string;
  /** The color shown when the scheme leaves this face alone (for color pickers). */
  color: string;
  /** Fill colors this face has in cubing.js's SVGs (one puzzle family can use a few palettes). */
  svgFills: string[];
}

export interface Preset {
  name: string;
  colors: ColorScheme;
}

export interface ColorFamily {
  id: string;
  name: string;
  /** A cubing.js puzzle id to preview the colors on. */
  previewPuzzle: string;
  faces: Face[];
  presets: Preset[];
}

const STANDARD: Preset = { name: "Standard", colors: {} };

const CUBE: ColorFamily = {
  id: "cube",
  name: "Cubes and Skewb",
  previewPuzzle: "3x3x3",
  faces: [
    { key: "U", label: "Top", color: "#ffffff", svgFills: ["white", "#ffffff"] },
    { key: "F", label: "Front", color: "#44ee00", svgFills: ["limegreen", "#44ee00"] },
    { key: "R", label: "Right", color: "#ff0000", svgFills: ["red", "#ff0000"] },
    { key: "B", label: "Back", color: "#2266ff", svgFills: ["#26f", "#2266ff"] },
    { key: "L", label: "Left", color: "#ff8000", svgFills: ["orange", "#ff8000"] },
    { key: "D", label: "Bottom", color: "#f4f400", svgFills: ["yellow", "#f4f400"] },
  ],
  presets: [{ name: "Standard (white top, green front)", colors: {} }],
};

const SQUARE_1: ColorFamily = {
  id: "square1",
  name: "Square-1",
  previewPuzzle: "square1",
  // Drawn by Square1Image, so no SVG fills to swap.
  faces: [
    { key: "U", label: "Top", color: "#ffd500", svgFills: [] },
    { key: "D", label: "Bottom", color: "#ffffff", svgFills: [] },
    { key: "F", label: "Front", color: "#e8112d", svgFills: [] },
    { key: "R", label: "Right", color: "#2fbf3a", svgFills: [] },
    { key: "B", label: "Back", color: "#ff8a00", svgFills: [] },
    { key: "L", label: "Left", color: "#2a62ff", svgFills: [] },
  ],
  presets: [
    { name: "Standard (yellow top)", colors: {} },
    // Black-top Square-1s replace the yellow top with black; the bottom stays white.
    { name: "Black top", colors: { U: "#111111" } },
  ],
};

const PYRAMINX: ColorFamily = {
  id: "pyraminx",
  name: "Pyraminx",
  previewPuzzle: "pyraminx",
  faces: [
    { key: "F", label: "Front", color: "#32cd32", svgFills: ["limegreen"] },
    { key: "L", label: "Left", color: "#ff0000", svgFills: ["red"] },
    { key: "R", label: "Right", color: "#2266ff", svgFills: ["#26f"] },
    { key: "D", label: "Bottom", color: "#ffff00", svgFills: ["yellow"] },
  ],
  presets: [STANDARD],
};

/** Puzzles with many faces: each sticker color is its own entry. */
function byColor(names: [string, string][]): Face[] {
  return names.map(([label, color]) => ({ key: color, label, color, svgFills: [color] }));
}

const MEGAMINX: ColorFamily = {
  id: "megaminx",
  name: "Megaminx",
  previewPuzzle: "megaminx",
  faces: byColor([
    ["White", "#ffffff"], ["Dark green", "#008800"], ["Purple", "#8800dd"], ["Yellow", "#f4f400"],
    ["Dark blue", "#0000ff"], ["Red", "#ff0000"], ["Beige", "#e8d0a0"], ["Light blue", "#3399ff"],
    ["Orange", "#ff8000"], ["Lime", "#99ff00"], ["Pink", "#ff66cc"], ["Gray", "#888888"],
  ]),
  presets: [STANDARD],
};

const FTO: ColorFamily = {
  id: "fto",
  name: "Face-Turning Octahedron",
  previewPuzzle: "fto",
  faces: [
    ...byColor([["White", "#ffffff"], ["Orange", "#ff8000"], ["Yellow", "#f4f400"], ["Gray", "#aaaaaa"], ["Blue", "#2266ff"]]),
    { key: "red", label: "Red", color: "#ff0000", svgFills: ["red"] },
    ...byColor([["Green", "#44ee00"], ["Purple", "#8800dd"]]),
  ],
  presets: [STANDARD],
};

export const COLOR_FAMILIES: readonly ColorFamily[] = [CUBE, SQUARE_1, PYRAMINX, MEGAMINX, FTO];

const FAMILY_BY_PUZZLE: Record<string, ColorFamily> = {
  "2x2x2": CUBE, "3x3x3": CUBE, "4x4x4": CUBE, "5x5x5": CUBE, "6x6x6": CUBE, "7x7x7": CUBE, skewb: CUBE,
  square1: SQUARE_1, pyraminx: PYRAMINX, megaminx: MEGAMINX, fto: FTO,
};

/** The color family a puzzle's picture uses, or null if its colors can't be changed (Clock). */
export const colorFamilyFor = (puzzleId: string | null): ColorFamily | null => (puzzleId ? FAMILY_BY_PUZZLE[puzzleId] ?? null : null);

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** A cubing.js puzzle SVG with each face's fills swapped for the scheme's colors. */
export function recolorSvg(svg: string, puzzleId: string, scheme: ColorScheme): string {
  const family = colorFamilyFor(puzzleId);
  if (!family) return svg;
  const swaps = new Map<string, string>();
  for (const face of family.faces) {
    const color = scheme[face.key];
    if (color) for (const fill of face.svgFills) swaps.set(fill.toLowerCase(), color);
  }
  if (swaps.size === 0) return svg;
  const pattern = new RegExp(`(fill:\\s*)(${[...swaps.keys()].map(escape).join("|")})(?=\\s*[;"'])`, "gi");
  return svg.replace(pattern, (_, prefix: string, fill: string) => `${prefix}${swaps.get(fill.toLowerCase()) ?? fill}`);
}

/** Whether a color is dark enough that black outlines would disappear against it. */
export function isDark(color: string): boolean {
  const hex = /^#([\da-f]{3}|[\da-f]{6})$/i.exec(color)?.[1];
  if (!hex) return false;
  const full = hex.length === 3 ? hex.replace(/./g, (c) => c + c) : hex;
  const [r, g, b] = [0, 2, 4].map((i) => Number.parseInt(full.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.2;
}
