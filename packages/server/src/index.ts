import cors from "@elysiajs/cors";
import swagger from "@elysiajs/swagger";
import Elysia, { t } from "elysia";
import { GameManager } from "./game-manager";

export const app = new Elysia()
  .use(cors())
  .use(swagger())
  .ws("/ws", {
    query: t.Object({
      room: t.String(),
    }),
    message(ws, message) {
      console.log(ws.id, message);
    },
    open(ws) {
      gameManager.ws = ws;
      ws.subscribe(ws.data.query.room);
      gameManager.add(ws.data.query.room, ws.id);
    },
    close(ws) {
      gameManager.add(ws.data.query.room, ws.id);
      ws.unsubscribe(ws.data.query.room);
    }
  })
  .get("/", () => 53)
  .listen(8080)

const gameManager = new GameManager(app.server!);

setInterval(() => {
  gameManager.update(1 / 60);
  gameManager.publish();
}, 1000 / 60);

export type App = typeof app;