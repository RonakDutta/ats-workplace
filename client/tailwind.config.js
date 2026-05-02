/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"], // Keeping it clean and professional
      },
      colors: {
        glass: {
          panel: "rgba(255, 255, 255, 0.05)",
          border: "rgba(255, 255, 255, 0.1)",
        },
        brand: {
          purple: "#8B5CF6",
          pink: "#EC4899",
          blue: "#3B82F6",
        },
      },
      backgroundImage: {
        "vibrant-gradient":
          "linear-gradient(to bottom right, #0f172a, #312e81, #500724)",
        "button-gradient": "linear-gradient(to right, #8B5CF6, #EC4899)",
      },
    },
  },
  plugins: [],
};
