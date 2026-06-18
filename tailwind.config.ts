import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // professional light palette
        ink: "#0f172a", // slate-900 — headings / primary text
        panel: "#ffffff", // card surface
        canvas: "#f4f6fa", // app background
        brand: {
          DEFAULT: "#2563eb",
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
        },
        accent: {
          DEFAULT: "#0f766e", // teal-700
          50: "#f0fdfa",
          200: "#99f6e4",
          600: "#0d9488",
          700: "#0f766e",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
        cardhover: "0 4px 12px rgba(15,23,42,0.08)",
      },
      keyframes: {
        fadein: { "0%": { opacity: "0", transform: "translateY(8px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
      },
      animation: {
        fadein: "fadein 0.35s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
