import type { Express } from "express";
import express from "express";
import cors from "cors";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { router as notificationRouter } from "./controllers/notificationController.js";
import { config } from "./config/index.js";
import { logger } from "./config/logger.js";

export const app: Express = express();

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, _res, next) => {
  logger.app.info(`${req.method} ${req.path}`);
  next();
});

// Swagger
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Notification Service API",
      version: "1.0.0",
      description: "Manages notifications and publishes them to RabbitMQ",
    },
    servers: [{ url: `http://localhost:${config.app.port}` }],
  },
  apis: ["./src/controllers/*.ts", "./dist/controllers/*.js"],
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/docs.json", (_req, res) => res.json(swaggerSpec));

// Routes
app.use("/notifications", notificationRouter);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});
