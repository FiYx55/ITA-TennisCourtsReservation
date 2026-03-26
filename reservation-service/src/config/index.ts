export const config = {
  database: {
    host: process.env.DATABASE_HOST ?? "localhost",
    port: parseInt(process.env.DATABASE_PORT ?? "5432"),
    name: process.env.DATABASE_NAME ?? "reservations_db",
    user: process.env.DATABASE_USER ?? "postgres",
    password: process.env.DATABASE_PASSWORD ?? "postgres",
  },
  app: {
    port: parseInt(process.env.APP_PORT ?? "2004"),
  },
  userServiceGrpcUrl: process.env.USER_SERVICE_GRPC_URL ?? "localhost:2002",
  rabbitmqUrl: process.env.RABBITMQ_URL ?? "amqp://guest:guest@localhost:5672",
} as const;

export function getDatabaseUrl(): string {
  const { host, port, name, user, password } = config.database;
  return `postgres://${user}:${password}@${host}:${port}/${name}`;
}
