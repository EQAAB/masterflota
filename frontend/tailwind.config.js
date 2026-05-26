/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      colors: {
        brand: {
          DEFAULT: "#0B7A6E",
          dark: "#005F56",
          light: "#0B7A6E",
          mint: "#DDF5EE",
        },
        surface: "#F6F7FB",
        ink: {
          DEFAULT: "#111827",
          muted: "#6B7280",
        },
        border: {
          DEFAULT: "#E5E7EB",
        },
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
      },
      borderRadius: {
        card: "20px",
        btn: "14px",
        input: "12px",
      },
      boxShadow: {
        soft: "0 10px 30px rgba(16, 24, 40, 0.06)",
        "soft-lg": "0 16px 40px rgba(16, 24, 40, 0.08)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #005F56 0%, #0B7A6E 100%)",
        "sidebar-gradient": "linear-gradient(180deg, #005F56 0%, #0B7A6E 100%)",
      },
      transitionDuration: {
        DEFAULT: "200ms",
      },
      transitionTimingFunction: {
        DEFAULT: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [],
};
