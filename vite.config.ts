
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import type { ConfigEnv, UserConfig } from 'vite';

export default defineConfig((config: ConfigEnv): UserConfig => {
  const isDev = config.mode === 'development';
  
  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      isDev ? componentTagger : null,
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
