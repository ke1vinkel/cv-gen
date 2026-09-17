import { fileURLToPath } from "node:url"
import path from "node:path"

import { defineConfig } from "vitest/config"

const root = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  test: {
    include: ["**/__tests__/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": root,
      "server-only": path.resolve(root, "lib/__tests__/server-only-stub.ts"),
    },
  },
})
