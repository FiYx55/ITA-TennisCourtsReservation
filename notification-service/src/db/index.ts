import { Sequelize } from "sequelize";
import { config } from "../config/index.js";
import { logger } from "../config/logger.js";

const { host, port, name, user, password } = config.database;

export const sequelize = new Sequelize(name, user, password, {
  host,
  port,
  dialect: "postgres",
  logging: (msg) => logger.db.info(String(msg)),
});

export async function connectDatabase(): Promise<void> {
  await sequelize.authenticate();
  logger.db.info("Connected to PostgreSQL");
  await sequelize.sync();
  logger.db.info("Tables synchronized");
}
