import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// CRM-Automation client (Vite + React + TS)
// API base URL is read from VITE_API_BASE_URL and defaults to the local server.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
  },
  preview: {
    port: 5173,
  },
});
