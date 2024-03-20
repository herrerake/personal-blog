/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        cardBg: "#F5F5F5",
        cardBorder: "#EAECF0",
        bluePrimary: "#042C55",
      },
    },
  },
  plugins: [],
};
