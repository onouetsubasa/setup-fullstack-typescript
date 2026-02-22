# CLAUDE.md

## 概要

TypeScript を用いたフルスタックシステムの初期構築を効率化するためのフレームワーク。
Hono (API) + Next.js (Web) + PostgreSQL の monorepo 構成をベースとしている。

## 目的

新規システム開発における TypeScript プロジェクトのセットアップを標準化・自動化し、初期構築にかかるコストを削減する。

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
│   ├── api/          # Hono バックエンド
│   └── web/          # Next.js フロントエンド
├── packages/
│   └── types/        # 共通型定義
├── docker-compose.yml
├── turbo.json
└── pnpm-workspace.yaml
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

### 新しいアプリへの追加手順

1. `package.json` に依存を追加
   - Entity 型: `"@repo/types": "workspace:*"`
   - API 型: `"api": "workspace:*"` + `"hono": "^4.x.x"`
2. `pnpm install` を実行

## 未実装・TODO

### 認証（authMiddleware）

認証は未実装。方式（JWT / Session / OAuth 等）は未決定。

実装時の対応ポイント：

1. `apps/api/src/middleware/authMiddleware.ts` を新規作成
2. ミドルウェア内で `c.set("userId", "<id>")` をセットする
3. `app.ts` に Hono の型定義を追加する

```ts
type Variables = { userId: string };
const app = new Hono<{ Variables: Variables }>();
```

4. `requestLogger.ts` はすでに `c.get("userId")` を参照しており、実装後は自動的にログへ反映される

---

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
```
