import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        night: { DEFAULT: "#14124a", 2: "#1d1966", 3: "#2a2391" },
        royal: { DEFAULT: "#4a37e6", light: "#6b52ff", dark: "#2f22b0" },
        cyan: { glow: "#3ee8ff" },
        magenta: { glow: "#ff4fd8" },
        gold: { DEFAULT: "#ffcf3a", dark: "#f0a500" },
        mint: { DEFAULT: "#3ee07a", dark: "#16a34a" },
        lilac: { DEFAULT: "#c9ccff", dark: "#9aa2e8" },
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-rounded", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "ui-rounded", "system-ui", "sans-serif"],
        ui: ["var(--font-ui)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      keyframes: {
        bob: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-8px)" } },
        wiggle: {
          "0%,100%": { transform: "rotate(0deg) scale(1)" },
          "25%": { transform: "rotate(-10deg) scale(1.1)" },
          "50%": { transform: "rotate(8deg) scale(1.1)" },
          "75%": { transform: "rotate(-4deg)" },
        },
        pop: { "0%": { transform: "scale(.6)", opacity: "0" }, "70%": { transform: "scale(1.08)", opacity: "1" }, "100%": { transform: "scale(1)" } },
        "slide-up": { "0%": { transform: "translateY(16px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
        "spin-slow": { to: { transform: "rotate(360deg)" } },
        float: { "0%": { transform: "translateY(0) scale(1)", opacity: "1" }, "100%": { transform: "translateY(-48px) scale(.6)", opacity: "0" } },
        rise: {
          "0%": { transform: "translateY(20px) scale(.7)", opacity: "0" },
          "20%": { opacity: ".95" },
          "100%": { transform: "translateY(-70px) scale(1)", opacity: "0" },
        },
        twinkle: { "0%,100%": { opacity: ".15", transform: "scale(.6)" }, "50%": { opacity: "1", transform: "scale(1)" } },
        "glow-breathe": { "0%,100%": { opacity: ".75", transform: "scale(1)" }, "50%": { opacity: "1", transform: "scale(1.06)" } },
      },
      animation: {
        bob: "bob 1.6s ease-in-out infinite",
        wiggle: "wiggle .35s ease-in-out",
        pop: "pop .3s cubic-bezier(.2,1.4,.4,1) both",
        "slide-up": "slide-up .28s cubic-bezier(.2,.9,.3,1) both",
        shimmer: "shimmer 1.8s linear infinite",
        "spin-slow": "spin-slow 10s linear infinite",
        float: "float .6s ease-out forwards",
        rise: "rise 1.6s ease-out infinite",
        twinkle: "twinkle 1.4s ease-in-out infinite",
        "glow-breathe": "glow-breathe 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
