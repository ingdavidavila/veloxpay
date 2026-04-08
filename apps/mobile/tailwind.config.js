/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#27ae60",   // Your premium green
        accent: "#d4af37",    // Your premium gold
        darkbg: "#0a0f0a",
        card: "#1a1f1a",
        zinc: {
          900: "#18181b",
          800: "#27272a",
          950: "#0a0f0a"
        }
      }
    },
  },
  plugins: [],
}