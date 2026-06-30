import type { Config } from "tailwindcss";
const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        space: { 900: "#040810", 800: "#080f1a", 700: "#0d1726", 600: "#122033", 500: "#1a2d47", 400: "#2a4a6e", 300: "#3d6d9e" },
        star: { gold: "#ffd700", blue: "#93c5fd", white: "#f0f4ff", dim: "#8899aa" },
      },
      animation: { "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite" },
    },
  },
  plugins: [],
};
export default config;
