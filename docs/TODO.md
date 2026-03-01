# TODO

以下は未実装。実装時は設計を別途確認すること。

- [ ] レートリミット（hono-rate-limiter + Redis、ECS複数台構成に注意）
- [ ] 認証ミドルウェア（方式未決定: JWT / Session / OAuth）
- [ ] テナントごとのIP制限（認証実装後に対応）
