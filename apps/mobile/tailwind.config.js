// apps/mobile/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#27ae60",   // your green
        accent: "#d4af37",    // your gold
        darkbg: "#0a0f0a",
      },
    },
  },
  plugins: [],
};