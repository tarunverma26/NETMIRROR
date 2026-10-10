import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0A0A0A",
        surface: "#111111",
        "surface-raised": "#161616",
        "surface-card": "#181818",
        border: "rgba(255, 255, 255, 0.08)",
        primary: {
          DEFAULT: "#E50914",
          dark: "#B00020",
          glow: "rgba(229, 9, 20, 0.4)",
          muted: "#800000",
        },
        cinema: {
          black: "#050505",
          dark: "#0A0A0A",
          charcoal: "#121212",
          gray: "#8E8E93",
          light: "#E5E5EA",
        },
      },
      boxShadow: {
        "red-glow": "0 0 25px -5px rgba(229, 9, 20, 0.45)",
        "red-glow-lg": "0 0 50px -10px rgba(229, 9, 20, 0.5)",
        "cinema": "0 10px 30px -10px rgba(0, 0, 0, 0.8)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        cinema: ["var(--font-cinema)", "Inter", "sans-serif"],
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow": "spin 20s linear infinite",
        "float": "float 6s ease-in-out infinite",
        "shimmer": "shimmer 2s infinite linear",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
