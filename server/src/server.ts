import { createServer } from "node:http";

import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { prisma } from "./lib/prisma";

const app = createApp();
const server = createServer(app);

async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, "Shutting down server");
  await prisma.$disconnect();
  server.close((error?: Error) => {
    if (error) {
      logger.error({ err: error }, "Failed to close server cleanly");
      process.exit(1);
    }

    process.exit(0);
  });
}

server.listen(env.PORT, () => {
  logger.info(
    {
      port: env.PORT,
      env: env.NODE_ENV,
    },
    "Dreamboat API is listening",
  );
});

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});


