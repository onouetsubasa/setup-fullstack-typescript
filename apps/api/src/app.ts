import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import health from "./routes/health";
import usersRoute from "./routes/users";

const app = new Hono()
  .use("*", logger())
  .use(
    "*",
    cors({
      origin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
    })
  )
  .route("/health", health)
  .route("/users", usersRoute);

export type AppType = typeof app;
export default app;
