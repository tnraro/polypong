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
      name: t.String(),
    }),
    body: t.Union([
      t.Object({
        type: t.Literal("x"),
        value: t.Number(),
      })
    ]),
    message(ws, message) {
      if (message.type === "x") {
        const game = gameManager.get(ws.data.query.room);
        if (game == null) return;
        const player = game.player(ws.id);
        if (player == null) return;
        player.x = message.value;
      }
    },
    open(ws) {
      gameManager.ws = ws;
      ws.subscribe(ws.data.query.room);
      gameManager.add(ws.data.query.room, ws.id, ws.data.query.name);
      app.server?.publish(ws.data.query.room, JSON.stringify({ type: "playerEnter", id: ws.id }), true);
      ws.send({ type: "me:enter", id: ws.id });
    },
    close(ws) {
      app.server?.publish(ws.data.query.room, JSON.stringify({ type: "playerLeave", id: ws.id }), true);
      gameManager.remove(ws.data.query.room, ws.id);
      ws.unsubscribe(ws.data.query.room);
    },
  })
  .get("/", () => 53)
  .listen(8080)

const gameManager = new GameManager(app.server!);

setInterval(() => {
  gameManager.update(1 / 60);
  gameManager.publish();
}, 1000 / 60);

export type App = typeof app;