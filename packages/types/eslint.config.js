// packages/types/eslint.config.js
import baseConfig from "@repo/eslint-config/base";

export default [
  ...baseConfig,
  {
    ignores: ["dist/**"],
  },
];
