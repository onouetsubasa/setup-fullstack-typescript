import type { MiddlewareHandler } from "hono";
import { logger } from "../lib/logger";

export const requestLogger = (): MiddlewareHandler => async (c, next) => {
  const requestId = crypto.randomUUID();
  const start = Date.now();

  c.header("x-request-id", requestId);

  try {
    await next();
  } finally {
    const duration = Date.now() - start;
    const status = c.res.status;
    const level = status >= 500 ? "error" : status >= 400 ? "warn" : "info";

    // 認証実装時は authMiddleware で c.set("userId", "<id>") をセットする
    const userId = c.get("userId") ?? "anonymous";

    logger[level]({
      request_id: requestId,
      user_id: userId,
      method: c.req.method,
      path: c.req.path,
      status,
      duration_ms: duration,
    });
  }
};
