/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          canvas: "#f7f8fa",
          base: "#ffffff",
          muted: "#f2f4f7",
          line: "#e5e7eb",
        },
        ink: {
          strong: "#111827",
          base: "#374151",
          muted: "#6b7280",
          faint: "#9ca3af",
        },
        brand: {
          DEFAULT: "#2563eb",
          soft: "#eff6ff",
          line: "#bfdbfe",
        },
      },
      boxShadow: {
        soft: "0 1px 2px rgba(16, 24, 40, 0.06)",
      },
    },
  },
  plugins: [],
};
