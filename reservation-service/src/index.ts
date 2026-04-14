import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { config } from "./config";
import { reservationController } from "./controllers/reservationController";

const app = new Elysia()
  .use(cors())
  .use(swagger())
  .use(reservationController)
  .get("/health", () => ({ status: "ok" }))
  .onRequest(({ request }) => {
    const url = new URL(request.url);
    console.log(`${request.method} ${url.pathname}`);
  })
  .listen(config.app.port);

console.log(`Reservation Service running on port ${app.server?.port}`);
