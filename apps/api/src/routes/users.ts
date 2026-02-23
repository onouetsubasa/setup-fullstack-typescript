import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { db } from "../db";
import { users } from "../db/schema";

const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  createdAt: z.string().datetime(),
});

const listRoute = createRoute({
  method: "get",
  path: "/",
  responses: {
    200: {
      content: { "application/json": { schema: z.array(UserSchema) } },
      description: "ユーザー一覧",
    },
  },
});

const usersRoute = new OpenAPIHono();
usersRoute.openapi(listRoute, async (c) => {
  const result = [
    { id: 1, name: "Alice", email: "alice@example.com", createdAt: "2024-01-01T00:00:00.000Z" },
    { id: 2, name: "Bob", email: "bob@example.com", createdAt: "2024-01-02T00:00:00.000Z" },
  ];
  return c.json(result);
});

export default usersRoute;
