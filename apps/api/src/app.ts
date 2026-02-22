import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "./lib/logger";
import { requestLogger } from "./middleware/requestLogger";
import health from "./routes/health";
import usersRoute from "./routes/users";

const app = new Hono()
  .use("*", requestLogger())
  .use(
    "*",
    cors({
      origin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
    })
  )
  .onError((err, c) => {
    logger.error({ err, path: c.req.path }, "Unhandled error");
    return c.json({ error: "Internal Server Error" }, 500);
  })
  .route("/health", health)
  .route("/users", usersRoute);

export type AppType = typeof app;
export default app;
