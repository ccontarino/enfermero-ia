import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

// Preact preset aliasea "react" y "react-dom" a preact/compat:
// el código se escribe como React, el bundle pesa ~10x menos.
export default defineConfig({
  base: "/enfermero-ia/",
  plugins: [preact()],
  build: {
    target: "es2020",
    cssCodeSplit: false,
    modulePreload: { polyfill: false },
  },
});
