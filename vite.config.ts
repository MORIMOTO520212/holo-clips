import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages ではリポジトリ名のサブパス（/holo-clips/）で配信される
  base: process.env.GITHUB_ACTIONS ? "/holo-clips/" : "/",
  plugins: [react()],
});
