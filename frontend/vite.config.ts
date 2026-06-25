import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  if (mode === "production" && !env.VITE_API_URL?.trim()) {
    throw new Error(
      "VITE_API_URL must be set for production builds. Copy .env.production.example to .env.production on the server, or pass VITE_API_URL when building.",
    );
  }

  return {
    base: "/fleet",
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
