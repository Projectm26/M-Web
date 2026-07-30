import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxyTarget = (
    env.VITE_API_PROXY_TARGET ||
    env.VITE_API_BASE_URL ||
    "https://p01--l-b--f8scybsf5kqx.code.run"
  ).replace(/\/$/, "");
  const cmsTarget = (env.VITE_CMS_PROXY_TARGET || "http://127.0.0.1:8787").replace(/\/$/, "");

  return {
    plugins: [react()],
    server: {
      port: 5173,
      // Allow local dev hosts plus any *.ngrok-free.dev tunnel (also via VITE_ALLOWED_HOSTS CSV).
      allowedHosts: [
        "localhost",
        "127.0.0.1",
        ".ngrok-free.dev",
        ...(env.VITE_ALLOWED_HOSTS || "")
          .split(",")
          .map((h) => h.trim())
          .filter(Boolean),
      ],
      proxy: {
        // Web-local hero CMS (SQLite) — must stay before generic /api if paths overlap.
        "/cms-api": {
          target: cmsTarget,
          changeOrigin: true,
        },
        "/cms-media": {
          target: cmsTarget,
          changeOrigin: true,
        },
        // Shubh555 product API
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
          secure: true,
        },
      },
    },
  };
});
