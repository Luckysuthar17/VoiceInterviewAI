import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin";

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    react(),
    tanstackStart({
      server: {
        entry: "./server.ts",
      },
    }),
  ],
});