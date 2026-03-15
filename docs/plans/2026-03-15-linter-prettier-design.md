# ESLint + Prettier 導入設計

**日付**: 2026-03-15

## 概要

Turborepo + pnpm workspaces 構成のモノレポに ESLint 9（flat config）と Prettier を導入する。
ESLint は `packages/eslint-config` 共有パッケージで管理し、Prettier はルートの `.prettierrc` で一元管理する。

## 決定事項

- ESLint バージョン: **9（flat config: `eslint.config.js`）**
- 共有設定: **`packages/eslint-config` パッケージ**
- Prettier 設定: **ルートの `.prettierrc`**
- 統合方針: **ESLint と Prettier は独立運用**（`eslint-config-prettier` で競合を排除）

## ファイル構成

```
.
├── .prettierrc
├── .prettierignore
├── packages/
│   └── eslint-config/
│       ├── package.json
│       ├── base.js          # TypeScript 共通ルール（api/types 用）
│       └── next.js          # base + eslint-config-next（web 用）
├── apps/
│   ├── api/
│   │   └── eslint.config.js
│   └── web/
│       └── eslint.config.js
└── turbo.json               # lint タスク追加
```

## 各設定の詳細

### `packages/eslint-config/base.js`

- `@typescript-eslint/eslint-plugin` による TypeScript ルール
- `eslint-config-prettier` で Prettier 競合ルールを無効化

### `packages/eslint-config/next.js`

- `base.js` を継承
- `eslint-config-next` を追加（React Hooks・アクセシビリティ・Next.js 固有ルール）

### `.prettierrc`

```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "all"
}
```

## スクリプト

### 各パッケージ（api/web/types）

```json
"lint": "eslint .",
"format": "prettier --write .",
"format:check": "prettier --check ."
```

### ルート `package.json`

```json
"lint": "turbo lint",
"format": "turbo format"
```

### `turbo.json`

`lint` タスクを追加（キャッシュ有効、出力なし）。

## CI での使い方

```bash
pnpm lint          # 全パッケージ ESLint チェック
pnpm format:check  # 全パッケージ Prettier フォーマットチェック
```

## 採用しなかったアプローチ

| アプローチ | 不採用理由 |
|---|---|
| `eslint-plugin-prettier` で統合 | Prettier 公式非推奨、パフォーマンス低下 |
| Biome で一元化 | `eslint-config-next` が使えず Next.js ルールが弱い |
