import type { Server } from "bun";
import { Game } from "./game";

export class GameManager {
  ws: any;
  #games = new Map<string, Game>();
  #server;
  constructor(server: Server) {
    this.#server = server;
  }
  add(roomId: string, playerId: string, name: string) {
    const game = this.#games.get(roomId) ?? new Game({
      pub: (event) => {
        this.pub(roomId, event, true);
      },
    });
    game.addPlayer(playerId, name);
    this.#games.set(roomId, game);
    this.pub(roomId, { type: "snapshot", world: game.serialize() }, true);
  }
  remove(roomId: string, playerId: string) {
    const game = this.#games.get(roomId);
    if (game == null) throw new Error("Game not found");
    game.removePlayer(playerId);
    if (game.players.length === 0) {
      this.#games.delete(roomId);
    }
  }
  get(roomId: string) {
    return this.#games.get(roomId);
  }
  update(delta: number) {
    for (const game of this.#games.values()) {
      game.update(delta);
    }
  }
  /**
   * @deprecated
   */
  publish() {
    for (const [id, game] of this.#games) {
      this.pub(id, { type: "snapshot", world: game.serialize() }, true);
    }
  }
  pub(roomId: string, data: unknown, compress?: boolean) {
    this.#server.publish(roomId, JSON.stringify(data), compress);
  }
  serialize() {
    return [...this.#games].map(([id, game]) => ({
      id,
      game: game.serialize(),
    }))
  }
}
