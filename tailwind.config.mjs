/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        cardBg: "#F5F5F5",
        cardBorder: "#EAECF0",
        bluePrimary: "#042C55",
        textPrimary: "#667085",
        // Dark mode TUI colors
        darkBg: "#0d1117",
        darkCard: "#161b22",
        darkBorder: "#30363d",
        darkText: "#e6edf3",
        darkTextSecondary: "#8b949e",
        darkAccent: "#58a6ff",
        darkGreen: "#39d353",
        darkPositive: "#3fb950",
        darkNegative: "#f85149",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
