import { fileURLToPath, URL } from "node:url";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import { defineConfig } from "vite";
import vueDevTools from "vite-plugin-vue-devtools";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    minify: false,
    rollupOptions: {
      output: {
        format: "iife",
        indent: true,
        entryFileNames: "Vue_Sandbox.js",
        assetFileNames: "Vue_Sandbox.css",
        globals: {
          "vue": "Vue",
          "naive-ui": "naive",
        },
      },
      external: ["vue", "naive-ui"],
    },
  },
});
