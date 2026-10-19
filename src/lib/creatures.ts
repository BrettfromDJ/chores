import type { CreatureId } from "./types";

/**
 * Original pixel creatures (16x16). Each sprite is drawn as the left half of
 * the grid and mirrored, then optional per-cell overrides add asymmetry.
 * Palette keys: k outline, a body, b belly, c accent, w shine, . empty
 */

export interface Creature {
  id: CreatureId;
  name: string;
  element: string;
  palette: Record<string, string>;
  half: string[];
  overrides?: [row: number, col: number, key: string][];
}

const BODY = [
  ".kaaaaaa",
  "kaaaaaaa",
  "kaawkaaa",
  "kaakkaaa",
  "kacaaaak",
  ".kaaaabb",
  "..kaabbb",
  "..kaabbb",
  "..kkaakk",
  "...kkk..",
];

export const CREATURES: Creature[] = [
  {
    id: "embercub",
    name: "Embercub",
    element: "Blaze",
    palette: { k: "#2b1418", a: "#f2683c", b: "#ffd9a0", c: "#ffcc33", w: "#ffffff" },
    half: ["........", ".......c", "......cc", "..kk..kc", ".kak.kaa", ".kaakkaa", ...BODY],
  },
  {
    id: "sproutle",
    name: "Sproutle",
    element: "Grove",
    palette: { k: "#12301f", a: "#5cc97f", b: "#e9f7c8", c: "#2f8f52", w: "#ffffff" },
    half: ["....kk..", "...kcck.", "...kccck", "....kcck", "..kkkkkc", ".kaaaaak", ...BODY],
  },
  {
    id: "splashkit",
    name: "Splashkit",
    element: "Tide",
    palette: { k: "#0f2547", a: "#4c8dff", b: "#d8ecff", c: "#8fd3ff", w: "#ffffff" },
    half: ["........", ".kk.....", "kcck....", "kccck...", ".kcckkkk", "..kaaaaa", ...BODY],
  },
  {
    id: "zapwing",
    name: "Zapwing",
    element: "Volt",
    palette: { k: "#2a2210", a: "#ffd23f", b: "#fff4c2", c: "#ff8a3d", w: "#ffffff" },
    half: ["...k....", "..kck...", "..kcck..", "...kcck.", "....kkkk", "..kkaaaa", ...BODY],
    overrides: [[10, 0, "c"], [11, 0, "c"], [10, 15, "c"], [11, 15, "c"]],
  },
  {
    id: "pebblit",
    name: "Pebblit",
    element: "Stone",
    palette: { k: "#26201c", a: "#a89584", b: "#e6dccf", c: "#7a6a5c", w: "#ffffff" },
    half: ["........", "........", "....kkkk", "...kcaca", "..kaacaa", ".kaaaaaa", ...BODY],
  },
  {
    id: "wispurr",
    name: "Wispurr",
    element: "Dusk",
    palette: { k: "#1c1233", a: "#9d7bff", b: "#e6dcff", c: "#ff7ac8", w: "#ffffff" },
    half: ["........", ".k......", ".kk.....", ".kck....", ".kcck...", ".kaaakkk", ...BODY],
  },
];

export const CREATURE_IDS = CREATURES.map((c) => c.id);

export function getCreature(id: string) {
  return CREATURES.find((c) => c.id === id) ?? CREATURES[0];
}

/** Expand a creature to a full 16x16 grid of palette keys. */
export function spriteGrid(creature: Creature) {
  const grid = creature.half.map((row) => (row + row.split("").reverse().join("")).split(""));
  for (const [r, c, key] of creature.overrides ?? []) if (grid[r]) grid[r][c] = key;
  return grid;
}
