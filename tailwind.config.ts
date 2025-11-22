/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: "#0B3D2E",
          mid: "#1F6F4A",
          light: "#68D391",
        },
        neutral: {
          50: "#F9FAFB",
          100: "#F3F4F6",
          200: "#E5E7EB",
          900: "#111827",
        },
        darkmode: {
          bg: "#111827",
          panel: "#1F2937",
          hover: "#374151",
          border: "#4B5563",
        },
      },
    },
  },
  plugins: [],
};
