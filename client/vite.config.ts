import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// CRM-Automation client (Vite + React + TS)
//
// `host: true` makes Vite bind to 0.0.0.0 so the app is reachable from other
// devices on your LAN (phone, tablet, another laptop).
//
// The `/api` proxy lets a phone on Wi-Fi call `/api/*` and have Vite forward
// it to the backend on localhost:4000. This means the client code can always
// use relative `/api` paths regardless of how it's accessed.
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // listen on 0.0.0.0 so phones on the same Wi-Fi can reach us
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: false,
      },
    },
  },
  preview: {
    host: true,
    port: 5173,
  },
});
