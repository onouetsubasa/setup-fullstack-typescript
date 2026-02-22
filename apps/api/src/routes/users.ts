import { Hono } from "hono";
import { db } from "../db";
import { users } from "../db/schema";

const usersRoute = new Hono();

usersRoute.get("/", async (c) => {
  const result = await db.select().from(users);
  return c.json(result);
});

export default usersRoute;
