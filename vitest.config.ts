import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    include: [
      "app/**/*.test.{ts,tsx}",
      "lib/**/*.test.{ts,tsx}",
    ],
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
});
