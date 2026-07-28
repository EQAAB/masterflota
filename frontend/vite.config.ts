import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";
import { viteBasePathFrom } from "./src/lib/basePath";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  if (mode === "production" && !env.VITE_API_URL?.trim()) {
    throw new Error(
      "VITE_API_URL must be set for production builds. Copy .env.production.example to .env.production on the server, or pass VITE_API_URL when building.",
    );
  }

  return {
    base: viteBasePathFrom(env.VITE_BASE_PATH),
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) return;
            if (id.includes("recharts")) return "recharts";
            if (id.includes("jspdf") || id.includes("html2canvas")) return "pdf-export";
            if (id.includes("@tanstack/react-query")) return "react-query";
            if (id.includes("react-router") || id.includes("react-dom")) return "react-vendor";
          },
        },
      },
    },
    test: {
      environment: "node",
      include: ["src/**/*.test.ts"],
      globals: false,
    },
    server: {
      proxy: {
        "/api": {
          target: "http://localhost:4100",
          changeOrigin: true,
        },
      },
    },
  };
});
