import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const reactHooks = nextVitals.find((c) => c.plugins?.["react-hooks"])?.plugins["react-hooks"];

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: { "react-hooks": reactHooks },
    // Existing debt: reported as warnings so CI passes; tighten to "error" as it's paid down.
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/error-boundaries": "warn",
      "react-hooks/static-components": "warn",
      "react-hooks/refs": "warn",
    },
  },
  {
    // CommonJS entry points
    files: ["server.js", "jest.setup.ts"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "analyze/**",
    "ts-traces/**",
    "next-env.d.ts",
    "prisma/generated/**",
  ]),
]);
