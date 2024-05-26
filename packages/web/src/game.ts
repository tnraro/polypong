import { Vec } from "utils";

export enum GameState {
  Lobby,
  Playing,
  Result,
}

export interface User {
  id: string;
  name: string;
}

export interface Player extends User {
  index: number;
  x: number;
  score: number;
}

export interface Ball {
  id: string;
  pos: { x: number, y: number };
  vel: { x: number, y: number };
  speed: number;
  radius: number;
}

export interface IntrinsicEvent {
  start: { type: "start" };
  end: { type: "end" };
  back: { type: "back" };
  playerEnter: { type: "playerEnter", id: string };
  playerLeave: { type: "playerLeave", id: string };
  playerMove: { type: "playerMove", id: string, value: number };
}

export class Game {
  state = GameState.Lobby;
  players: Player[] = [];
  spectators: User[] = [];
  balls: Ball[] = [];
  map = { radius: 16 * 20 };
  emit<Type extends keyof IntrinsicEvent>(event: IntrinsicEvent[Type]) {
    try {
      switch (event.type) {
        case "start": return this.#onStart();
        case "end": return this.#onEnd();
        case "back": return this.#onBack();
        case "playerEnter": return this.#onPlayerEnter(event);
        case "playerLeave": return this.#onPlayerLeave(event);
        case "playerMove": return this.#onPlayerMove(event);
      }
    } catch (error) {
      console.error(error);
    }
  }
  #onStart() {
    if (this.state !== GameState.Lobby) throw new Error("state must be lobby");
    this.balls = [
      createBall(0),
    ];
    this.state = GameState.Playing;
  }
  #onEnd() {
    if (this.state !== GameState.Playing) throw new Error("state must be playing");
    this.state = GameState.Result;
  }
  #onBack() {
    if (this.state !== GameState.Result) throw new Error("state must be result");
    this.state = GameState.Lobby;
  }
  #onPlayerEnter(event: IntrinsicEvent["playerEnter"]) {
    this.players.push(createPlayer(event.id, this.players.length));
  }
  #onPlayerLeave(event: IntrinsicEvent["playerLeave"]) {
    this.players = this.players
      .filter(player => player.id !== event.id)
      .map((player, index) => ({
        ...player,
        index,
      }));
  }
  #onPlayerMove(event: IntrinsicEvent["playerMove"]) {
    const player = this.players.find(player => player.id === event.id);
    if (player == null) return;
    player.x = event.value;
  }
  update(delta: number) {
    if (this.state !== GameState.Playing) return;

    for (const ball of this.balls) {
      ball.pos.x += ball.vel.x * ball.speed * delta;
      ball.pos.y += ball.vel.y * ball.speed * delta;
    }
    for (const ball of this.balls) {
      if (Vec.zero.distanceTo(ball.pos) - ball.radius > this.map.radius) {
        ball.vel.x *= -1;
        ball.vel.y *= -1;
      }
    }
  }
}

function createPlayer(id: string, index: number): Player {
  return {
    id,
    index,
    name: "임시 이름",
    score: 0,
    x: 0.5,
  }
}

function createBall(index: number): Ball {
  return {
    id: String(index),
    pos: {
      x: 0, y: 0,
    },
    speed: 100,
    vel: {
      x: 0, y: 1,
    },
    radius: 8,
  }
}