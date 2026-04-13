/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      colors: {
        pulse: {
          950: "#0a0f1a",
          900: "#0f172a",
          800: "#1e293b",
          700: "#334155",
          accent: "#38bdf8",
          glow: "#22d3ee",
        },
      },
      boxShadow: {
        card: "0 0 0 1px rgb(51 65 85 / 0.4), 0 20px 50px -20px rgb(0 0 0 / 0.5)",
      },
    },
  },
  plugins: [],
};
