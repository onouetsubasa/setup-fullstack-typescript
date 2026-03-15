// packages/eslint-config/next.js
import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "path";
import { fileURLToPath } from "url";
import baseConfig from "./base.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  ...baseConfig,
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];
