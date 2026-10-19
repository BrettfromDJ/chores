import type { CreatureId } from "./types";

/** Original partner creatures. Shapes live in components/Mascot.tsx. */
export interface Creature {
  id: CreatureId;
  name: string;
  element: string;
  colors: {
    light: string;
    base: string;
    dark: string;
    belly: string;
    accent: string;
    accentDark: string;
  };
}

export const CREATURES: Creature[] = [
  {
    id: "embercub",
    name: "Embercub",
    element: "Blaze",
    colors: { light: "#ffb37a", base: "#ff7a3d", dark: "#d9481c", belly: "#ffe3bf", accent: "#ffd84a", accentDark: "#ff8a1f" },
  },
  {
    id: "sproutle",
    name: "Sproutle",
    element: "Grove",
    colors: { light: "#a6f0b4", base: "#4fd17a", dark: "#22984f", belly: "#effbd3", accent: "#8be04e", accentDark: "#2f9e3c" },
  },
  {
    id: "splashkit",
    name: "Splashkit",
    element: "Tide",
    colors: { light: "#9fd0ff", base: "#4d9bff", dark: "#2a5fd6", belly: "#e4f3ff", accent: "#6ff0ff", accentDark: "#22b8e0" },
  },
  {
    id: "zapwing",
    name: "Zapwing",
    element: "Volt",
    colors: { light: "#fff09a", base: "#ffd23f", dark: "#e09a12", belly: "#fff9dc", accent: "#ff7b3a", accentDark: "#e0521a" },
  },
  {
    id: "pebblit",
    name: "Pebblit",
    element: "Stone",
    colors: { light: "#d9cfc4", base: "#b3a291", dark: "#7f6e5e", belly: "#f1ebe3", accent: "#b48cff", accentDark: "#7a4fe0" },
  },
  {
    id: "wispurr",
    name: "Wispurr",
    element: "Dusk",
    colors: { light: "#d2c2ff", base: "#9f7dff", dark: "#6a45d9", belly: "#f1ebff", accent: "#ff6fd0", accentDark: "#d93aa6" },
  },
];

export const CREATURE_IDS = CREATURES.map((c) => c.id);

export function getCreature(id: string) {
  return CREATURES.find((c) => c.id === id) ?? CREATURES[0];
}
