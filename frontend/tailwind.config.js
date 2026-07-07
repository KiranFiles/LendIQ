/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fef2f0",
          100: "#fde3de",
          500: "#d94530",
          600: "#c23a26",
          700: "#a12f1f",
        },
        ink: {
          900: "#111827",
          700: "#374151",
          500: "#6b7280",
        },
      },
    },
  },
  plugins: [],
};
