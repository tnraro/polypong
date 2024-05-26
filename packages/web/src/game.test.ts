import { describe, test, expect } from "bun:test";
import { Game } from "./game";

describe("game", () => {
  test("enter the player", () => {
    const game = new Game();
    game.emit({
      type: "playerEnter",
      id: "a"
    });
    game.emit({
      type: "playerEnter",
      id: "b"
    });
    expect(game.players).toStrictEqual([
      { id: "a", index: 0, name: "임시 이름", score: 0, x: 0.5 },
      { id: "b", index: 1, name: "임시 이름", score: 0, x: 0.5 },
    ]);
  });
  test("leave the player", () => {
    const game = new Game();
    game.emit({
      type: "playerEnter",
      id: "a"
    });
    game.emit({
      type: "playerEnter",
      id: "b"
    });
    game.emit({
      type: "playerLeave",
      id: "a"
    });
    expect(game.players).toStrictEqual([
      { id: "b", index: 0, name: "임시 이름", score: 0, x: 0.5 },
    ]);
  });
});