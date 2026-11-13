import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // CommonJS config files (jest.config.js uses require("next/jest"))
    files: ["*.config.js"],
    rules: { "@typescript-eslint/no-require-imports": "off" }
  },
  {
    // Tests mock next/image with a plain <img>
    files: ["__tests__/**"],
    rules: { "@next/next/no-img-element": "off" }
  },
  globalIgnores([".next/**", "out/**", "build/**", "coverage/**", "node_modules/**", "next-env.d.ts", "tsconfig.tsbuildinfo"])
]);
