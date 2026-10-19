import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#1d1a2f", soft: "#3b3656", mute: "#6f6a8a" },
        paper: { DEFAULT: "#fff8e8", deep: "#f6ead0", dim: "#efe0bf" },
        berry: { DEFAULT: "#e8423f", dark: "#b52a2c", light: "#ff7a6b" },
        sun: { DEFAULT: "#ffcc33", dark: "#e0a512", light: "#ffe58a" },
        sky: { DEFAULT: "#3d6cf0", dark: "#2a4bb8", light: "#8fb0ff" },
        leaf: { DEFAULT: "#38b26b", dark: "#23844b", light: "#8de0ad" },
        grape: { DEFAULT: "#8a5cf6", dark: "#6538cf", light: "#c4adff" },
        screen: { DEFAULT: "#9bbc0f", dark: "#306230", deep: "#0f380f", light: "#c6dc6b" },
      },
      fontFamily: {
        pixel: ["var(--font-pixel)", "ui-monospace", "monospace"],
        sans: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
        ui: ["var(--font-ui)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      keyframes: {
        bob: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-6px)" } },
        wiggle: {
          "0%,100%": { transform: "rotate(0deg)" },
          "20%": { transform: "rotate(-14deg)" },
          "40%": { transform: "rotate(12deg)" },
          "60%": { transform: "rotate(-8deg)" },
          "80%": { transform: "rotate(5deg)" },
        },
        pop: { "0%": { transform: "scale(.6)", opacity: "0" }, "70%": { transform: "scale(1.08)", opacity: "1" }, "100%": { transform: "scale(1)" } },
        "slide-up": { "0%": { transform: "translateY(16px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
        blink: { "0%,49%": { opacity: "1" }, "50%,100%": { opacity: "0" } },
        "spin-slow": { to: { transform: "rotate(360deg)" } },
        float: { "0%": { transform: "translateY(0) scale(1)", opacity: "1" }, "100%": { transform: "translateY(-48px) scale(.6)", opacity: "0" } },
      },
      animation: {
        bob: "bob 2.4s ease-in-out infinite",
        wiggle: "wiggle .6s ease-in-out",
        pop: "pop .45s cubic-bezier(.2,1.4,.4,1) both",
        "slide-up": "slide-up .4s ease-out both",
        shimmer: "shimmer 3s linear infinite",
        blink: "blink 1s steps(1) infinite",
        "spin-slow": "spin-slow 14s linear infinite",
        float: "float 1s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
