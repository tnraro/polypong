import cors from "@elysiajs/cors";
import swagger from "@elysiajs/swagger";
import Elysia from "elysia";

const app = new Elysia()
  .use(cors())
  .use(swagger())
  .ws("/ws", {
    message(ws, message) {
      ws.send(message)
    }
  })
  .get("/", () => 53)
  .listen(8080)

export type App = typeof app;