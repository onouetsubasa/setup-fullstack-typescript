# CLAUDE.md

## このプロジェクトについて

TypeScript を用いたフルスタックシステムの初期構築を効率化するためのフレームワーク。
Hono (API) + Next.js (Web) + PostgreSQL の monorepo 構成をベースとし、
新規システム開発における TypeScript プロジェクトのセットアップを標準化・自動化して初期構築コストを削減する。

## 技術スタック

- **モノレポ管理**: Turborepo + pnpm workspaces
- **バックエンド**: Hono (port: 8080)
- **フロントエンド**: Next.js (port: 3000)
- **データベース**: PostgreSQL
- **ORM**: Drizzle ORM
- **パッケージマネージャ**: pnpm
- **インフラ**: Docker / AWS ECS

## プロジェクト構成

```
.
├── apps/
│   ├── api/
│   │   └── src/
│   │       ├── index.ts           # エントリーポイント（ポート8080）
│   │       ├── app.ts             # Hono設定・ミドルウェア登録・AppType export
│   │       ├── db/
│   │       │   ├── index.ts       # Drizzle ORM インスタンス
│   │       │   └── schema.ts      # テーブル定義（ここに新テーブルを追加）
│   │       ├── lib/
│   │       │   └── logger.ts      # Pino ロガー（PII自動マスキング付き）
│   │       ├── middleware/
│   │       │   └── requestLogger.ts
│   │       └── routes/v1/
│   │           ├── index.ts       # ルート集約
│   │           ├── health.ts
│   │           └── users.ts       # OpenAPI + Zod スキーマ定義の参考実装
│   └── web/
│       └── src/
│           ├── app/               # Next.js App Router
│           │   ├── layout.tsx
│           │   └── page.tsx
│           └── lib/
│               └── api.ts         # Hono クライアント（型安全な fetch）
├── packages/
│   └── types/                     # 共通型定義
│       └── src/
│           └── index.ts
├── docker-compose.yml
├── turbo.json
└── pnpm-workspace.yaml
```

## 環境変数

```bash
# apps/api/.env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/app

# apps/web/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## よく使うコマンド

```bash
# 依存関係インストール
pnpm install

# 開発サーバ起動（全サービス）
docker compose up

# 開発サーバ起動（ローカル）
docker compose up postgres -d
pnpm dev

# ビルド
pnpm build

# DB マイグレーション（apps/api で実行）
pnpm db:generate   # マイグレーションファイル生成
pnpm db:migrate    # マイグレーション実行
pnpm db:studio     # Drizzle Studio 起動

# 型チェック（api）
cd apps/api && npx tsc --noEmit

# Lint（web）
cd apps/web && pnpm lint
```

## 型共有の方針

### Entity・ドメインモデル → `@repo/types`

`packages/types/src/index.ts` に定義し、api・web 両方から参照する。

```ts
// packages/types/src/index.ts
export type User = {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
};
```

利用するパッケージの `package.json` に追加：
```json
"@repo/types": "workspace:*"
```

```ts
import type { User } from "@repo/types";
```

### API のリクエスト/レスポンス型 → Hono RPC

API ルートの型を自動推論し、フロントエンドの fetch 呼び出しを型安全にする。

**api 側**（`apps/api/src/app.ts`）:
```ts
const app = new Hono()
  .route("/users", usersRoute);

export type AppType = typeof app;
```

**web 側**（`apps/web/src/lib/api.ts`）:
```ts
import type { AppType } from "api";
import { hc } from "hono/client";

export const client = hc<AppType>(process.env.NEXT_PUBLIC_API_URL!);
```

**使い方**:
```ts
// Server Component
import { client } from "@/lib/api";

const res = await client.users.$get();
const users = await res.json(); // 型が自動推論される
```

### 使い分け

| 用途 | 方法 |
|---|---|
| Entity・ドメインモデル | `@repo/types` |
| API のリクエスト/レスポンス | Hono RPC |

## コーディング規約

### TypeScript

**Do:**
- strict モードを必ず有効化する
- 型のみの import は `import type` を使用する
- Entity/ドメイン型は `@repo/types` から import する
- API 型は Hono RPC の型推論を使用する

**Don't:**
- `any` 型を使わない
- Hono RPC で推論できる型を手書きで再定義しない

### ロギング（Pino）

**Do:**
- 構造化ログ: `logger.info({ key: value }, "message")` 形式を使用する
- リクエストログは `requestLogger.ts` ミドルウェアで一元管理する

**Don't:**
- PII（メールアドレス・トークン等）をマスキングせずにログ出力しない

### API ルート設計

- ルートは `apps/api/src/routes/v1/` に配置
- `@hono/zod-openapi` で Zod スキーマと OpenAPI ドキュメントを同時定義
- バージョンプレフィックス `/v1` を付与
- エラーレスポンスはグローバルエラーハンドラで統一処理

### コミットメッセージ

Conventional Commits 形式を使用：
- `feat(scope): 説明` — 新機能
- `fix(scope): 説明` — バグ修正
- `docs: 説明` — ドキュメントのみ
- `refactor(scope): 説明` — リファクタリング

## Claude への指示

### APIルートを追加するとき

1. `apps/api/src/routes/v1/` に新ファイルを作成（`users.ts` を参考に）
2. `@hono/zod-openapi` で Zod スキーマと OpenAPI を同時定義する
3. `apps/api/src/routes/v1/index.ts` にルートを追加する
4. `apps/api/src/app.ts` の `AppType` に反映されているか確認する
5. 必要なら `packages/types/src/index.ts` に Entity 型を追加する

### DBスキーマを変更するとき

1. `apps/api/src/db/schema.ts` を編集する
2. `pnpm db:generate` でマイグレーションファイルを生成する
3. `pnpm db:migrate` でマイグレーションを反映する

### Next.js に画面を追加するとき

1. `apps/web/src/app/` 配下にページを作成する（App Router）
2. API 呼び出しは `apps/web/src/lib/api.ts` の `client` を使用する

### やってはいけないこと

- `any` 型を使う
- Hono RPC で推論できる型を手書きで再定義する
- PII（メール・トークン等）をマスキングせずログ出力する
- `pnpm install` / `pnpm add` を確認なしに実行する
- `db/schema.ts` の変更後にマイグレーションを生成せず放置する

## 未実装事項

`docs/TODO.md` を参照。
