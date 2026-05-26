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
          deeper: "#003D38",
          light: "#0B7A6E",
          mint: "#DDF5EE",
        },
        surface: {
          DEFAULT: "#F6F7FB",
          elevated: "#FAFBFC",
          card: "#FFFFFF",
        },
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
        "accent-gold": "#D4A574",
        chart: {
          1: "#0B7A6E",
          2: "#2D9B8E",
          3: "#DDF5EE",
          4: "#F59E0B",
          5: "#EF4444",
        },
      },
      borderRadius: {
        card: "20px",
        "2xl": "16px",
        btn: "14px",
        input: "12px",
        menu: "14px",
      },
      boxShadow: {
        soft: "0 10px 30px rgba(16, 24, 40, 0.06)",
        "soft-lg": "0 16px 40px rgba(16, 24, 40, 0.08)",
        card: "0 1px 2px rgba(16, 24, 40, 0.04), 0 8px 24px rgba(16, 24, 40, 0.06)",
        "card-hover": "0 4px 12px rgba(16, 24, 40, 0.08), 0 16px 40px rgba(16, 24, 40, 0.1)",
        "sidebar-glow": "0 0 0 1px rgba(255,255,255,0.12), 0 8px 24px rgba(11, 122, 110, 0.35)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #005F56 0%, #0B7A6E 100%)",
        "sidebar-gradient": "linear-gradient(180deg, #005F56 0%, #0B7A6E 100%)",
        "sidebar-premium":
          "linear-gradient(180deg, #003D38 0%, #005F56 42%, #0B7A6E 100%)",
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
