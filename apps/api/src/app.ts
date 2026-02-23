import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { logger } from "./lib/logger";
import { requestLogger } from "./middleware/requestLogger";
import v1 from "./routes/v1";

const app = new OpenAPIHono();

app.use("*", secureHeaders());
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
app.route("/v1", v1);

if (process.env.NODE_ENV !== "production") {
  app.doc("/openapi.json", {
    openapi: "3.0.0",
    info: { title: "API", version: "1.0.0" },
  });
  app.get("/doc", swaggerUI({ url: "/openapi.json" }));
}

export type AppType = typeof app;
export default app;
