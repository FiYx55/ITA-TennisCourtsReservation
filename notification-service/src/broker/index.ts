import amqplib from "amqplib";
import { config } from "../config/index.js";
import { logger } from "../config/logger.js";

const EXCHANGE = "notifications";
const QUEUE = "notifications_queue";

let connection: Awaited<ReturnType<typeof amqplib.connect>> | null = null;
let channel: Awaited<ReturnType<Awaited<ReturnType<typeof amqplib.connect>>["createChannel"]>> | null = null;

export async function connectBroker(): Promise<void> {
  connection = await amqplib.connect(config.rabbitmqUrl);
  channel = await connection.createChannel();

  await channel.assertExchange(EXCHANGE, "fanout", { durable: true });
  await channel.assertQueue(QUEUE, { durable: true });
  await channel.bindQueue(QUEUE, EXCHANGE, "");

  logger.broker.info("Connected to RabbitMQ");
}

export function publishNotification(notification: {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
}): void {
  if (!channel) {
    logger.broker.warn("Channel not available, skipping publish");
    return;
  }

  const payload = JSON.stringify(notification);
  channel.publish(EXCHANGE, "", Buffer.from(payload), { persistent: true });
  logger.broker.info(`Published notification ${notification.id} to exchange '${EXCHANGE}'`);
}

export async function closeBroker(): Promise<void> {
  if (channel) await channel.close();
  if (connection) await connection.close();
  logger.broker.info("Connection closed");
}
