// apps/web/eslint.config.js
import nextConfig from "@repo/eslint-config/next";

export default [
  ...nextConfig,
  {
    ignores: [".next/**"],
  },
];
