import { test, expect } from "bun:test";
import { delta } from "./delta";

test("add", () => {
  const before = {
    players: [],
    balls: [],
  }
  const after = {
    players: [{ id: "id", x: 0, name: "name" }],
    balls: [{ id: "id", x: 0, y: 0, }],
  };
  expect(delta(before, after)).toStrictEqual({
    players: [{ id: "id", x: 0, name: "name" }],
    balls: [{ id: "id", x: 0, y: 0, }],
  });
});

test("nothing changed", () => {
  const before = {
    players: [{ id: "id", x: 0, name: "name" }],
    balls: [{ id: "id", x: 0, y: 0, }],
  }
  const after = {
    players: [{ id: "id", x: 0, name: "name" }],
    balls: [{ id: "id", x: 0, y: 0, }],
  };
  expect(delta(before, after)).toStrictEqual({
    players: [{}],
    balls: [{}],
  });
})
test("changing props", () => {
  const before = {
    players: [{ id: "id", x: 0, name: "name" }],
    balls: [{ id: "id", x: 0, y: 0, }],
  }
  const after = {
    players: [{ id: "id", x: 0, name: "name" }],
    balls: [{ id: "id", x: 1, y: 0, }],
  };
  expect(delta(before, after)).toStrictEqual({
    players: [{}],
    balls: [{ x: 1 }],
  });
});
test("changing props - complex case", () => {
  const before = {
    players: [{ id: "id", x: 0, name: "name" }, { id: "id2", x: 0, name: "name2" }],
    balls: [{ id: "id", x: 1, y: 0, }],
  }
  const after = {
    players: [{ id: "id2", x: 0, name: "name2" }],
    balls: [{ id: "id", x: 1, y: 0, }],
  };
  expect(delta(before, after)).toStrictEqual({
    players: [{ id: "id2", name: "name2" }],
    balls: [{}],
  });
});