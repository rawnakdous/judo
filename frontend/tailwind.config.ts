import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: "#061a36",
        ink: "#0a1326",
        redbrand: "#d10f22",
        soft: "#f6f7fb"
      },
      boxShadow: {
        soft: "0 18px 45px rgba(6, 26, 54, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
