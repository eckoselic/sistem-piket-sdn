import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#12243D",
          light: "#1E4C7C",
        },
        paper: "#FAF9F6",
        slate: {
          soft: "#5B6472",
        },
        gold: {
          DEFAULT: "#D9A441",
          soft: "#F1DDB1",
        },
        ok: "#2E7D5B",
        danger: "#B23A48",
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "10px",
      },
    },
  },
  plugins: [],
};
export default config;
