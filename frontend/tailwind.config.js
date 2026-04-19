/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#0A0A0F",
        surface: "#111118",
        surface2: "#1A1A24",
        surface3: "#22223A",
        border: "#2A2A3D",
        accent: "#6C63FF",
        accent2: "#00D4AA",
        warning: "#F59E0B",
        danger: "#EF4444",
        info: "#3B82F6",
        textPrimary: "#F0F0FF",
        textSecondary: "#8B8BA8",
        textMuted: "#4A4A6A"
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"]
      }
    }
  },
  plugins: []
};
