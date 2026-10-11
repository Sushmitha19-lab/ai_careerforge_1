import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const proxy = {
  "/ml": {
    target: "http://127.0.0.1:5001",
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/ml/, ""),
  },
  "/api": {
    target: "http://127.0.0.1:5000",
    changeOrigin: true,
  },
};

export default defineConfig({
  plugins: [react()],
  server: { host: "127.0.0.1", proxy },
  preview: { proxy },
})
