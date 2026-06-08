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
        background: "#EAEDF0",
        foreground: "#18212B",
        // QuantLab institutional palette
        ql: {
          page: "#EAEDF0",
          panel: "#F7F8FA",
          card: "#FFFFFF",
          hover: "#E4E8EC",
          pressed: "#DEE3E8",
          border: "#D1D5DB",
          "border-hover": "#9CA3AF",
          accent: "#2E6F8E",
          gold: "#C89B3C",
          positive: "#4E9B6E",
          negative: "#C86A62",
          warning: "#C89B3C",
        },
        ape: {
          dark: "#02040a",
          blue: "#00A7FA",
          pink: "#FD23E9",
          grey: "#1c1d21"
        }
      },
      fontFamily: {
        display: ['var(--font-playfair)', '"Playfair Display"', 'Georgia', 'serif'],
        sans: ['var(--font-inter)', '"Inter"', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', '"JetBrains Mono"', '"IBM Plex Mono"', 'monospace'],
      },
      letterSpacing: {
        tighter: '-.04em',
        tight: '-.02em',
        wide: '.08em',
        wider: '.12em',
        widest: '.16em',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(24,33,43,0.06), 0 1px 2px rgba(24,33,43,0.04)',
        'elevated': '0 4px 12px rgba(24,33,43,0.08), 0 2px 4px rgba(24,33,43,0.04)',
        'modal': '0 24px 64px rgba(24,33,43,0.12)',
      },
    },
  },
  plugins: [],
};
export default config;
