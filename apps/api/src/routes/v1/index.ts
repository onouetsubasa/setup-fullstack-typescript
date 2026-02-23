import { OpenAPIHono } from "@hono/zod-openapi";
import health from "./health";
import usersRoute from "./users";

const v1 = new OpenAPIHono();

v1.route("/health", health);
v1.route("/users", usersRoute);

export default v1;
