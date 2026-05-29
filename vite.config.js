import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // Saat development, teruskan permintaan /api ke server backend (port 4000)
    // sehingga frontend cukup memanggil "/api/..." tanpa pusing CORS.
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});
