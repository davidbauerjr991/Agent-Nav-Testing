// Single source of truth for every consumer's color token map — see
// lyra-ui/tailwind-tokens.cjs's own doc comment for why this is a plain
// relative `require` (tailwind.config.js is loaded by Tailwind's own config
// loader, outside Vite, so the `@nicecxone/lyra-ui` alias doesn't apply here).
// Any new prototype built off lyra-ui should do the same rather than
// hand-copying this object — that hand-copying is exactly what caused a
// "selected channel" highlight and 8/10 customer avatar colors to silently
// render with zero CSS in this app (see lyra-ui/PROJECT_SUMMARY.md's
// "Cross-Repo Sync" section for the incident).
const lyraColors = require("../lyra-ui/tailwind-tokens.cjs");

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
    "../lyra-ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ...lyraColors,
        "cxone-navy": "#2a2d32",
      },
      borderRadius: {
        "lyra-none":  "var(--lyra-radius-none)",
        "lyra-xs":    "var(--lyra-radius-xs)",
        "lyra-sm":    "var(--lyra-radius-sm)",
        "lyra-md":    "var(--lyra-radius-md)",
        "lyra-lg":    "var(--lyra-radius-lg)",
        "lyra-xl":    "var(--lyra-radius-xl)",
        "lyra-round": "var(--lyra-radius-round)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
