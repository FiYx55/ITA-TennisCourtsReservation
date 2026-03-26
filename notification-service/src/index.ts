import { app } from "./app.js";
import { config } from "./config/index.js";
import { logger } from "./config/logger.js";
import { connectDatabase } from "./db/index.js";
import { connectBroker } from "./broker/index.js";
import { notification$ } from "./streams/notificationStream.js";

async function main(): Promise<void> {
  logger.app.info("Starting Notification Service...");

  await connectDatabase();

  try {
    await connectBroker();
  } catch (err) {
    logger.app.warn(`RabbitMQ not available, running without broker: ${(err as Error).message}`);
  }

  // Subscribe to the reactive notification stream
  notification$.subscribe({
    next: (n) => logger.stream.info(`Notification ${n.id} delivered`),
    error: (err) => logger.stream.error(`Error in notification stream: ${err}`),
  });
  logger.app.info("Reactive notification stream active");

  app.listen(config.app.port, () => {
    logger.app.info(`Notification Service running on port ${config.app.port}`);
    logger.app.info(`Swagger docs at http://localhost:${config.app.port}/docs`);
  });
}

main().catch((err) => {
  logger.app.error(`Failed to start: ${err}`);
  process.exit(1);
});
