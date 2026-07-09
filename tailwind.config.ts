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
        background: "var(--background)",
        foreground: "var(--foreground)",
        jwe: {
          brand: "rgb(var(--brand) / <alpha-value>)",
          dark: "rgb(var(--darkblue) / <alpha-value>)",
          rich: "rgb(var(--richblue) / <alpha-value>)",
          offwhite: "rgb(var(--offwhite) / <alpha-value>)",
          amber: "rgb(var(--amber) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["var(--font-chakra)", "system-ui", "sans-serif"],
        display: ["var(--font-chakra)", "system-ui", "sans-serif"],
      },
      zIndex: {
        panel: "2",
        enclosure: "20",
        dropdown: "100",
        sticky: "40",
      },
    },
  },
  plugins: [],
};
export default config;
