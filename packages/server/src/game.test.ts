import { describe, test, expect } from "bun:test";
import { Game } from "./game";

describe("Game", () => {
  test("addPlayer", () => {
    const game = new Game();
    game.addPlayer("p1");
    expect(game.player("p1")?.serialize()).toStrictEqual({
      id: "p1",
      x: 0.5,
      index: 0,
      score: 0,
    });
    expect(game.serialize()).toStrictEqual({
      players: [
        {
          id: "p1",
          x: 0.5,
          index: 0,
          score: 0,
        }
      ],
      balls: [],
    });
  });
});