# ESLint + Prettier 導入 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Turborepo モノレポに ESLint 9（flat config）と Prettier を導入し、全パッケージで一貫したコード品質チェックを実現する。

**Architecture:** `packages/eslint-config` に TypeScript 共通ルール（`base.js`）と Next.js 向けルール（`next.js`）を共有パッケージとして定義し、各アプリが `eslint.config.js` でインポートする。Prettier はルートの `.prettierrc` で全体を管理し、`eslint-config-prettier` で ESLint との競合を排除する。

**Tech Stack:** ESLint 9, typescript-eslint v8, eslint-config-prettier, eslint-config-next, Prettier 3, @eslint/eslintrc（FlatCompat）

---

## Task 1: `packages/eslint-config` パッケージを作成する

**Files:**
- Create: `packages/eslint-config/package.json`

**Step 1: `packages/eslint-config/package.json` を作成する**

```json
{
  "name": "@repo/eslint-config",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "exports": {
    "./base": "./base.js",
    "./next": "./next.js"
  },
  "dependencies": {
    "@eslint/eslintrc": "^3.3.1",
    "eslint-config-prettier": "^10.1.5",
    "typescript-eslint": "^8.33.1"
  },
  "peerDependencies": {
    "eslint": "^9.0.0"
  }
}
```

**Step 2: `packages/eslint-config` を `pnpm-workspace.yaml` が認識しているか確認する**

```bash
cat pnpm-workspace.yaml
```

Expected: `packages/*` が含まれていること。含まれていなければ `packages/*` を追加する。

**Step 3: コミット**

```bash
git add packages/eslint-config/package.json
git commit -m "feat(eslint-config): @repo/eslint-config パッケージを追加"
```

---

## Task 2: `packages/eslint-config/base.js` を作成する

**Files:**
- Create: `packages/eslint-config/base.js`

**Step 1: `base.js` を作成する**

```js
// packages/eslint-config/base.js
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default [
  ...tseslint.configs.recommended,
  prettier,
  {
    rules: {
      "no-console": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
];
```

**Step 2: コミット**

```bash
git add packages/eslint-config/base.js
git commit -m "feat(eslint-config): base.js (TypeScript 共通ルール) を追加"
```

---

## Task 3: `packages/eslint-config/next.js` を作成する

**Files:**
- Create: `packages/eslint-config/next.js`

**Step 1: `next.js` を作成する**

`FlatCompat` を使って `eslint-config-next` を ESLint 9 flat config に変換する。

```js
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
```

**Step 2: コミット**

```bash
git add packages/eslint-config/next.js
git commit -m "feat(eslint-config): next.js (Next.js 向けルール) を追加"
```

---

## Task 4: ルートの `.prettierrc` と `.prettierignore` を作成する

**Files:**
- Create: `.prettierrc`
- Create: `.prettierignore`

**Step 1: `.prettierrc` を作成する**

```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "all"
}
```

**Step 2: `.prettierignore` を作成する**

```
node_modules
.next
dist
drizzle
```

**Step 3: コミット**

```bash
git add .prettierrc .prettierignore
git commit -m "feat: Prettier 設定をルートに追加"
```

---

## Task 5: `apps/api/eslint.config.js` を作成する

**Files:**
- Create: `apps/api/eslint.config.js`
- Modify: `apps/api/package.json`

**Step 1: `apps/api/eslint.config.js` を作成する**

```js
// apps/api/eslint.config.js
import baseConfig from "@repo/eslint-config/base";

export default [
  ...baseConfig,
  {
    ignores: ["dist/**", "drizzle/**"],
  },
];
```

**Step 2: `apps/api/package.json` の `scripts` に lint/format を追加する**

`"scripts"` に以下を追加：

```json
"lint": "eslint .",
"format": "prettier --write .",
"format:check": "prettier --check ."
```

`"devDependencies"` に追加：

```json
"eslint": "^9.27.0",
"prettier": "^3.5.3"
```

**Step 3: コミット**

```bash
git add apps/api/eslint.config.js apps/api/package.json
git commit -m "feat(api): ESLint 9 flat config と Prettier スクリプトを追加"
```

---

## Task 6: `apps/web/eslint.config.js` を作成する

**Files:**
- Create: `apps/web/eslint.config.js`
- Modify: `apps/web/package.json`

**Step 1: `apps/web` に `eslint-config-next` を devDependency として追加する**

`apps/web/package.json` の `"devDependencies"` に追加：

```json
"eslint": "^9.27.0",
"eslint-config-next": "^15.3.0",
"prettier": "^3.5.3"
```

**Step 2: `apps/web/eslint.config.js` を作成する**

```js
// apps/web/eslint.config.js
import nextConfig from "@repo/eslint-config/next";

export default [
  ...nextConfig,
  {
    ignores: [".next/**"],
  },
];
```

**Step 3: `apps/web/package.json` の `scripts` を更新する**

既存の `"lint": "next lint"` を以下に変更：

```json
"lint": "eslint .",
"format": "prettier --write .",
"format:check": "prettier --check ."
```

> **注意:** `next lint` は `eslint` コマンドと同等のため、`eslint .` に統一して問題ない。

**Step 4: コミット**

```bash
git add apps/web/eslint.config.js apps/web/package.json
git commit -m "feat(web): ESLint 9 flat config と Prettier スクリプトを追加"
```

---

## Task 7: `packages/types` に lint スクリプトを追加する

**Files:**
- Modify: `packages/types/package.json`

**Step 1: `packages/types/package.json` を更新する**

```json
{
  "name": "@repo/types",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "lint": "eslint .",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  },
  "devDependencies": {
    "@repo/eslint-config": "workspace:*",
    "eslint": "^9.27.0",
    "prettier": "^3.5.3"
  }
}
```

**Step 2: `packages/types/eslint.config.js` を作成する**

```js
// packages/types/eslint.config.js
import baseConfig from "@repo/eslint-config/base";

export default [
  ...baseConfig,
  {
    ignores: ["dist/**"],
  },
];
```

**Step 3: コミット**

```bash
git add packages/types/package.json packages/types/eslint.config.js
git commit -m "feat(types): ESLint と Prettier スクリプトを追加"
```

---

## Task 8: `turbo.json` に lint/format タスクを追加する

**Files:**
- Modify: `turbo.json`

**Step 1: `turbo.json` を更新する**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "format:check": {}
  }
}
```

**Step 2: ルートの `package.json` にスクリプトを追加する**

```json
"scripts": {
  "build": "turbo build",
  "dev": "turbo dev",
  "lint": "turbo lint",
  "format": "prettier --write \"**/*.{ts,tsx,js,json,md}\" --ignore-path .prettierignore",
  "format:check": "turbo format:check"
}
```

また、ルートの `devDependencies` に追加：

```json
"eslint": "^9.27.0",
"prettier": "^3.5.3"
```

**Step 3: コミット**

```bash
git add turbo.json package.json
git commit -m "feat: turbo.json に lint/format タスクを追加"
```

---

## Task 9: 依存関係をインストールして動作確認する

**Step 1: 依存関係をインストールする**

```bash
pnpm install
```

Expected: エラーなく完了すること。

**Step 2: ESLint を全パッケージで実行する**

```bash
pnpm lint
```

Expected: 全パッケージで ESLint が実行され、エラーがなければ成功。エラーが出た場合はルールに違反しているコードを修正する。

**Step 3: Prettier チェックを実行する**

```bash
pnpm format:check
```

Expected: フォーマット違反がある場合は差分が表示される。

**Step 4: Prettier でフォーマットを自動修正する**

```bash
pnpm format
```

その後、再度 `pnpm format:check` が通ることを確認。

**Step 5: 修正があればコミット**

```bash
git add -A
git commit -m "style: Prettier によるコードフォーマットを適用"
```

---

## Task 10: 最終確認

**Step 1: ビルドが壊れていないか確認する**

```bash
pnpm build
```

Expected: エラーなくビルドが完了すること。

**Step 2: 完了**

全タスク完了。CI に `pnpm lint && pnpm format:check` を追加することを推奨。
