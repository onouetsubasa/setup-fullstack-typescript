import { serve } from "@hono/node-server";
import app from "./app";

const port = Number(process.env.PORT ?? 8080);

serve({ fetch: app.fetch, port }, () => {
  // eslint-disable-next-line no-console
  console.log(`Server is running on http://localhost:${port}`);
});
