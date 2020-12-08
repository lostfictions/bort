import { createServer } from "http";
import next from "next";

import { isDev, PORT, HOSTNAME } from "./env";

const app = next({ dev: isDev });
const handle = app.getRequestHandler();

export async function runServer() {
  await app.prepare();
  createServer((req, res) => {
    void handle(req, res);
  }).listen(PORT, HOSTNAME, () => {
    console.log(`> Ready on http://${HOSTNAME}:${PORT}`);
  });
}
