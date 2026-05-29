import type { Config } from "tailwindcss";

/**
 * Palette mirrors src/config/brand.ts (Tailwind needs literal values at build
 * time). Update both places together when the real identity lands.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0A0A0A",
          soft: "#121212",
          raised: "#1A1A1A",
        },
        paper: {
          DEFAULT: "#F5F5F0",
          dim: "#A8A8A2",
        },
        gold: {
          DEFAULT: "#C9A24B",
          muted: "#9A7B38",
        },
      },
      borderColor: {
        hairline: "rgba(245,245,240,0.12)",
      },
      fontFamily: {
        // Wired to next/font CSS variables set in app/layout.tsx
        serif: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        tightest: "-0.04em",
      },
      maxWidth: {
        editorial: "1400px",
      },
      keyframes: {
        "reveal-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "drawer-in": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "reveal-up": "reveal-up 0.7s cubic-bezier(0.16,1,0.3,1) both",
        "drawer-in": "drawer-in 0.35s cubic-bezier(0.16,1,0.3,1) both",
        "fade-in": "fade-in 0.4s ease both",
      },
    },
  },
  plugins: [],
};

export default config;
