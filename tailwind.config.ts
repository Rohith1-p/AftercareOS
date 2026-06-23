import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Tokens extracted from aftercareos.com styles.css
        brand: {
          DEFAULT: "#e85d2c", // accent coral
          soft: "#f07a4f",
        },
        ink: {
          DEFAULT: "#1a1a1a",
          soft: "#2d2d2d",
        },
        cream: "#fdf8f5",
        field: "#333333",
        muted: "#5c5c5c",
        success: "#22c55e",
        star: "#ffb400",
        danger: "#dc2626",
        warn: "#f59e0b",
        glass: "rgba(255,255,255,0.88)",
        hairline: "rgba(0,0,0,0.06)",
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      borderRadius: {
        pill: "9999px",
        card: "20px",
        btn: "12px",
      },
      boxShadow: {
        sm: "0 2px 8px rgba(0,0,0,0.06)",
        md: "0 8px 24px rgba(0,0,0,0.08)",
        lg: "0 16px 48px rgba(0,0,0,0.12)",
      },
      backgroundImage: {
        "warm-gradient":
          "linear-gradient(135deg,#fefefe 0%,#fef9f6 15%,#fde8d0 35%,#fad0b8 52%,#f6b0a8 70%,#eba8c0 88%,#d8a8d8 100%)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s ease forwards",
      },
    },
  },
  plugins: [],
};

export default config;
