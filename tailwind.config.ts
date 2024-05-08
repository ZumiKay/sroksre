import type { Config } from "tailwindcss";
/** @type {import('tailwindcss').Config} */

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      boxShadow: {
        shadowlg:
          "box-shadow: rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(0, 0, 0, 0.06) 0px 1px 2px 0px",
      },

      colors: {
        incart: "#495464",
        unpaid: "#EB5757",
        paid: "#35C191",
        preparing: "#0097FA",
        shipped: "#60513C",
      },

      // keyframe

      keyframes: {
        slidedown: {
          from: { height: "0" },
          to: { height: "fit-content" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0px)" },
        },
      },
      animation: {
        slidedown: "slidedown .5s ease-in-out",
        "fade-in": "fade-in 1s ease-in-out",
      },
    },
  },
  plugins: [require("tailwind-scrollbar-hide")],
};
export default config;
