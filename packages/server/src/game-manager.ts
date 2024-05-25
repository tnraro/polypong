import type { Server } from "bun";
import { Game } from "./game";

export class GameManager {
  ws: any;
  #games = new Map<string, Game>();
  #server;
  constructor(server: Server) {
    this.#server = server;
  }
  add(roomId: string, playerId: string) {
    const game = this.#games.get(roomId) ?? new Game();
    game.addPlayer(playerId);
    this.#games.set(roomId, game);
  }
  remove(roomId: string, playerId: string) {
    const game = this.#games.get(roomId);
    if (game == null) throw new Error("Game not found");
    game.removePlayer(playerId);
    if (game.players.length === 0) {
      this.#games.delete(roomId);
    }
  }
  update(delta: number) {
    for (const game of this.#games.values()) {
      game.update(delta);
    }
  }
  publish() {
    for (const [id, game] of this.#games) {
      this.#server.publish(id, JSON.stringify({ type: "snapshot", world: game.serialize() }), true);
    }
  }
  serialize() {
    return [...this.#games].map(([id, game]) => ({
      id,
      game: game.serialize(),
    }))
  }
}
