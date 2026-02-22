# My App

TypeScript monorepo with Hono (API) + Next.js (Web) + PostgreSQL.

## 構成

```
.
├── apps/
│   ├── api/          # Hono バックエンド (port: 8080)
│   └── web/          # Next.js フロントエンド (port: 3000)
├── packages/
│   └── types/        # 共通型定義
├── docker-compose.yml
├── turbo.json
└── pnpm-workspace.yaml
```

## セットアップ

```bash
# 依存関係インストール
pnpm install

# 環境変数設定
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

## ローカル開発

### Docker で全サービス起動（推奨）

```bash
docker compose up
```

### ローカルで直接起動

```bash
# PostgreSQL だけ Docker で起動
docker compose up postgres -d

# 全アプリを Turborepo で起動
pnpm dev
```

## DB マイグレーション

```bash
# apps/api ディレクトリで
cd apps/api

# マイグレーションファイル生成
pnpm db:generate

# マイグレーション実行
pnpm db:migrate

# Drizzle Studio（DB GUI）
pnpm db:studio
```

## ビルド

```bash
pnpm build
```

## AWS ECS へのデプロイ（本番）

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
