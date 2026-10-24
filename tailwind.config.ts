import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Emerald / Nizami Green Palette replacing former red
        emerald: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
          950: "#052e16",
          DEFAULT: "#16a34a",
        },
        nizamgreen: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          DEFAULT: "#16a34a",
          dark: "#0f3d24",
          light: "#22c55e",
        },
        nizami: {
          50: "#fefce8",
          100: "#fef9c3",
          200: "#fef08a",
          400: "#facc15",
          500: "#eab308",
          600: "#ca8a04",
          700: "#a16207",
          gold: "#D4AF37",
          royal: "#C59B27",
          DEFAULT: "#D4AF37",
        },
        hussain: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
          DEFAULT: "#0284c7",
        },
        metro: {
          red: "#ef4444",
          blue: "#3b82f6",
          green: "#16a34a",
        },
        mmts: "#7c3aed",
        tgsrtc: "#ea580c",
        pearl: {
          50: "#ffffff",
          100: "#f8fafc",
          200: "#f1f5f9",
          DEFAULT: "#ffffff",
        },
      },
      fontFamily: {
        sans: ["var(--font-outfit)", "system-ui", "sans-serif"],
        serif: ["var(--font-cinzel)", "Georgia", "serif"],
      },
      boxShadow: {
        glow: "0 0 25px -5px rgba(22, 163, 74, 0.35)",
        "green-glow": "0 0 25px -5px rgba(22, 163, 74, 0.4)",
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.08)",
      },
      animation: {
        "pulse-subtle": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.4s ease-out forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
