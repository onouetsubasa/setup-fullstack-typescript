// apps/web/eslint.config.mjs
import nextConfig from "@repo/eslint-config/next";

const config = [
  ...nextConfig,
  {
    ignores: [".next/**", "next-env.d.ts"],
  },
];

export default config;
