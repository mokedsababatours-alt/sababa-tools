/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Light theme - warm cream
        cream: {
          50:  "#fdfaf5",
          100: "#f9f3e8",
          200: "#f2e8d0",
          300: "#e8d9b8",
          400: "#d4bc8a",
          500: "#b89a5e",
        },
        // Dark theme - soft navy
        navy: {
          50:  "#e8ecf4",
          100: "#c5d0e8",
          200: "#8fa3cc",
          300: "#5a76b0",
          400: "#2d4a8a",
          500: "#1a2f5e",
          600: "#152548",
          700: "#101c38",
          800: "#0c1528",
          900: "#080e1a",
        },
        accent: {
          gold:  "#c9973a",
          teal:  "#3a9b8f",
          coral: "#d4634a",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body:    ["var(--font-body)", "sans-serif"],
        hebrew:  ["var(--font-hebrew)", "sans-serif"],
      },
      borderRadius: {
        xl:  "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      boxShadow: {
        tile:       "0 4px 24px -4px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)",
        "tile-hover": "0 8px 40px -8px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)",
        "tile-dark": "0 4px 24px -4px rgba(0,0,0,0.4), 0 1px 4px rgba(0,0,0,0.2)",
        "tile-dark-hover": "0 8px 40px -8px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.3)",
      },
      animation: {
        "fade-in":   "fadeIn 0.4s ease forwards",
        "slide-up":  "slideUp 0.4s ease forwards",
        "tile-pop":  "tilePop 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards",
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: "translateY(16px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        tilePop: { from: { opacity: 0, transform: "scale(0.92)" }, to: { opacity: 1, transform: "scale(1)" } },
      },
    },
  },
  plugins: [],
};
