import type { MiddlewareHandler } from "hono";
import { logger } from "../lib/logger";

export const requestLogger = (): MiddlewareHandler => async (c, next) => {
  const requestId = crypto.randomUUID();
  const start = Date.now();

  c.header("x-request-id", requestId);

  await next();

  const duration = Date.now() - start;
  const status = c.res.status;
  const level = status >= 500 ? "error" : status >= 400 ? "warn" : "info";

  logger[level]({
    request_id: requestId,
    method: c.req.method,
    path: c.req.path,
    status,
    duration_ms: duration,
  });
};
