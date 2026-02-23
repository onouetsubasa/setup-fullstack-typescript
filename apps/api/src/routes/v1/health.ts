import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

const HealthSchema = z.object({ status: z.string() });

const healthRoute = createRoute({
  method: "get",
  path: "/",
  responses: {
    200: {
      content: { "application/json": { schema: HealthSchema } },
      description: "ヘルスチェック",
    },
  },
});

const health = new OpenAPIHono();
health.openapi(healthRoute, (c) => c.json({ status: "ok" }));

export default health;
