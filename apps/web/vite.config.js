import { defineConfig, loadEnv } from "vite";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: env.VITE_API_URL || "http://localhost:3000",
          changeOrigin: true,
        },
        "/ws": {
          target: env.VITE_API_URL || "http://localhost:3000",
          ws: true,
        },
      },
      fs: {
        // Allow serving files from one level up (the monorepo root)
        allow: [".."],
      },
    },
    resolve: {
      alias: {
        "@workspace/ui": path.resolve(__dirname, "../../packages/ui/src"),
        "@workspace/domain": path.resolve(__dirname, "../../packages/domain/src"),
        "@workspace/application": path.resolve(
          __dirname,
          "../../packages/application/src",
        ),
      },
    },
  };
});
