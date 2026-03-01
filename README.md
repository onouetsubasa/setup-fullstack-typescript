# My App

TypeScript monorepo with Hono (API) + Next.js (Web) + PostgreSQL.

## 構成

```
.
├── apps/
│   ├── api/
│   │   └── src/
│   │       ├── index.ts           # エントリーポイント（ポート8080）
│   │       ├── app.ts             # Hono設定・ミドルウェア登録・AppType export
│   │       ├── db/
│   │       │   ├── index.ts       # Drizzle ORM インスタンス
│   │       │   └── schema.ts      # テーブル定義
│   │       ├── lib/
│   │       │   └── logger.ts      # Pino ロガー
│   │       ├── middleware/
│   │       │   └── requestLogger.ts
│   │       └── routes/v1/
│   │           ├── index.ts
│   │           ├── health.ts
│   │           └── users.ts
│   └── web/
│       └── src/
│           ├── app/               # Next.js App Router
│           │   ├── layout.tsx
│           │   └── page.tsx
│           └── lib/
│               └── api.ts         # Hono クライアント（型安全な fetch）
├── packages/
│   └── types/                     # 共通型定義
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

`.env.example` をコピーして編集する：

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
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

# 型チェック（api）
cd apps/api && npx tsc --noEmit

# Lint（web）
cd apps/web && pnpm lint

# DB マイグレーション（apps/api で実行）
pnpm db:generate   # マイグレーションファイル生成
pnpm db:migrate    # マイグレーション実行
pnpm db:studio     # Drizzle Studio 起動
```

## デプロイ（AWS ECS）

各アプリの Dockerfile はマルチステージビルドになっており、`production` ステージが本番用イメージです。

```bash
# API イメージのビルド & プッシュ
docker build --target production -t <ECR_URI>/api:latest -f apps/api/Dockerfile .
docker push <ECR_URI>/api:latest

# Web イメージのビルド & プッシュ
docker build --target production \
  --build-arg NEXT_PUBLIC_API_URL=https://api.example.com \
  -t <ECR_URI>/web:latest \
  -f apps/web/Dockerfile .
docker push <ECR_URI>/web:latest
```

ECS タスク定義では環境変数 `DATABASE_URL` などをシークレット（AWS Secrets Manager）から注入することを推奨します。
