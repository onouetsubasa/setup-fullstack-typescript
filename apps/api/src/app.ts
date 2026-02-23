import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import { cors } from "hono/cors";
import { logger } from "./lib/logger";
import { requestLogger } from "./middleware/requestLogger";
import health from "./routes/health";
import usersRoute from "./routes/users";

const app = new OpenAPIHono();

app.use("*", requestLogger());
app.use(
  "*",
  cors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  })
);
app.onError((err, c) => {
  logger.error({ err, path: c.req.path }, "Unhandled error");
  return c.json({ error: "Internal Server Error" }, 500);
});
app.route("/health", health);
app.route("/users", usersRoute);
app.doc("/openapi.json", {
  openapi: "3.0.0",
  info: { title: "API", version: "1.0.0" },
});
app.get("/doc", swaggerUI({ url: "/openapi.json" }));

export type AppType = typeof app;
export default app;
