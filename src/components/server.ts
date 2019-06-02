import express from "express";
import path from "path";

// Open a server we can ping (via uptimerobot.com or similar) for status
// and serving static files
export function createServer(port: number): express.Express {
  const app = express();
  app.use(express.static(path.join(__dirname, "../../static")));

  app.get("/", (_req, res) => {
    res.status(200).end();
  });
  app.listen(port);
  return app;
}
