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

### レートリミット・IP制限

未実装。実装時は以下の方針で対応する。

#### レートリミット（hono-rate-limiter）

同一IPから短時間に大量リクエストが来た場合に 429 を返す。

```ts
import { rateLimiter } from "hono-rate-limiter";

app.use("*", rateLimiter({
  windowMs: 60 * 1000, // 1分間
  limit: 100,
  keyGenerator: (c) => c.req.header("x-forwarded-for") ?? "unknown",
}));
```

- デフォルトはインメモリ管理のため、**ECS 複数台構成では Redis ストアが必要**
- `/auth/login` など認証系エンドポイントは limit を厳しくする

#### IP制限の役割分担

| 用途 | 担当 |
|---|---|
| DDoS・大量攻撃の遮断 | WAF（インフラ） |
| 社内IPのみ許可（全テナント共通） | ALB セキュリティグループ（インフラ） |
| テナントごとのIP許可リスト | アプリ（認証後にDBの許可リストと照合） |

マルチテナントでテナントごとにIP制限をかけたい場合はアプリ側で対応する。
認証（`tenantId` の取得）が前提になるため、認証実装後に対応する。

---

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

---

## コーディング規約

### TypeScript
- strict モード必須・`any` 禁止
- 型のみの import は `import type` を使用
- Entity/ドメイン型は `@repo/types` から import
- API 型は Hono RPC の型推論を使用（手書き禁止）

### コミットメッセージ
Conventional Commits 形式を使用：
- `feat(scope): 説明` — 新機能
- `fix(scope): 説明` — バグ修正
- `docs: 説明` — ドキュメントのみ
- `refactor(scope): 説明` — リファクタリング

### ロギング（Pino）
- 構造化ログ: `logger.info({ key: value }, "message")` 形式
- PII（メールアドレス等）はマスキングしてからログ記録
- リクエストログは `requestLogger.ts` ミドルウェアで一元管理

### API ルート設計
- ルートは `apps/api/src/routes/` に配置
- `@hono/zod-openapi` で Zod スキーマと OpenAPI ドキュメントを同時定義
- バージョンプレフィックス `/v1` を付与
- エラーレスポンスはグローバルエラーハンドラで統一処理
