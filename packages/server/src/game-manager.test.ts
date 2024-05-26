import { describe, test, expect } from "bun:test";
import { GameManager } from "./game-manager";

describe("GameManager", () => {
  test("add", () => {
    const gameManager = new GameManager(null!);
    gameManager.add("r1", "p1");
    expect(gameManager.serialize())
      .toStrictEqual([
        { id: "r1", game: { players: [{ id: "p1", index: 0, x: 0.5, score: 0, }], balls: [] } }
      ]);
  });
  test("remove — 1", () => {
    const gameManager = new GameManager(null!);
    gameManager.add("r1", "p1");
    gameManager.add("r1", "p2");
    gameManager.add("r2", "p3");
    gameManager.remove("r2", "p3");
    expect(gameManager.serialize())
      .toStrictEqual([
        {
          id: "r1", game: {
            players: [
              { id: "p1", index: 0, x: 0.5, score: 0, },
              { id: "p2", index: 1, x: 0.5, score: 0, }
            ], balls: []
          }
        },
      ]);
  });
  test("remove — 2", () => {
    const gameManager = new GameManager(null!);
    gameManager.add("r1", "p1");
    gameManager.add("r1", "p2");
    gameManager.add("r2", "p3");
    gameManager.remove("r1", "p2");
    expect(gameManager.serialize())
      .toStrictEqual([
        { id: "r1", game: { players: [{ id: "p1", index: 0, x: 0.5, score: 0, }], balls: [] } },
        { id: "r2", game: { players: [{ id: "p3", index: 0, x: 0.5, score: 0, }], balls: [] } },
      ]);
  });
  test("remove — 3", () => {
    const gameManager = new GameManager(null!);
    gameManager.add("r1", "p1");
    gameManager.add("r1", "p2");
    gameManager.add("r2", "p3");
    gameManager.remove("r1", "p2");
    gameManager.remove("r2", "p3");
    gameManager.remove("r1", "p1");
    expect(gameManager.serialize()).toStrictEqual([]);
  });
});