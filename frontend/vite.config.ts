import { defineConfig } from "vite";

export default defineConfig(({ mode }) => {
  if (mode === "production" && !process.env.VITE_API_URL?.trim()) {
    throw new Error(
      "VITE_API_URL must be set for production builds (e.g. http://103.131.215.13:4100/api)",
    );
  }

  return {
    base: "/fleet",
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
