/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          900: "#061427",
          800: "#0b1f3b",
          700: "#10305a",
          500: "#1b5fa8",
          400: "#2e78c7",
        },
      },
    },
  },
  plugins: [],
};
