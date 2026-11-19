import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    clearMocks: true,
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      thresholds: {
        statements: 90,
        branches: 80,
        functions: 90,
        lines: 90,
      },
      include: [
        "src/app/api/auth/check-email/route.ts",
        "src/app/api/auth/post-login-status/route.ts",
        "src/app/api/admin/**/*.ts",
        "src/app/api/baseline/route.ts",
        "src/app/api/diary/**/*.ts",
        "src/app/api/insight/**/*.ts",
        "src/app/api/mood/**/*.ts",
        "src/app/api/payment/**/*.ts",
        "src/app/api/profile/security-state/route.ts",
        "src/app/api/subscription/status/route.ts",
        "src/lib/baseline/{service,validation}.ts",
        "src/lib/diary/{litellm,prompt,service,validation}.ts",
        "src/lib/encryption.ts",
        "src/lib/get-post-login-redirect.ts",
        "src/lib/mood/{service,validation}.ts",
        "src/lib/subscription/service.ts",
        "src/lib/validations.ts",
      ],
      exclude: [
        "src/app/generated/**",
        "src/**/generated/**",
        "src/**/*.d.ts",
        "src/lib/**/types.ts",
        "node_modules/**",
        ".next/**",
        "coverage/**",
      ],
    },
    alias: {
      // Vitest tidak baca __mocks__ otomatis seperti Jest
      "server-only": fileURLToPath(
        new URL("./__mocks__/server-only.ts", import.meta.url),
      ),
    },
  },
});
