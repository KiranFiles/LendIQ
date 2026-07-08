/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // IDBI Bank primary — Orange
        brand: {
          50: "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          400: "#f8a74e",
          500: "#F58220",
          600: "#e06a08",
          700: "#b95308",
        },
        // IDBI Bank secondary — Teal/Green
        idbi: {
          50: "#f0faf8",
          100: "#ccede8",
          400: "#2ab09a",
          500: "#00836C",
          600: "#006d59",
          700: "#005345",
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
