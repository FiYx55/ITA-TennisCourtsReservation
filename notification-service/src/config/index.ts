export const config = {
  database: {
    host: process.env["DATABASE_HOST"] ?? "localhost",
    port: parseInt(process.env["DATABASE_PORT"] ?? "5432"),
    name: process.env["DATABASE_NAME"] ?? "notifications_db",
    user: process.env["DATABASE_USER"] ?? "postgres",
    password: process.env["DATABASE_PASSWORD"] ?? "postgres",
  },
  app: {
    port: parseInt(process.env["APP_PORT"] ?? "2006"),
  },
  rabbitmqUrl: process.env["RABBITMQ_URL"] ?? "amqp://guest:guest@localhost:5672",
} as const;
