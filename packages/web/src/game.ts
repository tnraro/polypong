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
}

export interface IntrinsicEvent {
  start: Record<string, never>;
  end: Record<string, never>;
  back: Record<string, never>;
  playerEnter: { id: string };
  playerLeave: { id: string };
}

export class Game {
  state = GameState.Lobby;
  players: Player[] = [];
  spectators: User[] = [];
  balls: Ball[] = [];
  emit<Type extends keyof IntrinsicEvent>(event: { type: Type } & IntrinsicEvent[Type]) {
    try {
      switch (event.type) {
        case "start": return this.#onStart();
        case "end": return this.#onEnd();
        case "back": return this.#onBack();
        case "playerEnter": return this.#onPlayerEnter(event);
        case "playerLeave": return this.#onPlayerLeave(event);
      }
    } catch (error) {
      console.error(error);
    }
  }
  #onStart() {
    if (this.state !== GameState.Lobby) throw new Error("state must be lobby", { cause: this.state });
    this.reset();
    this.state = GameState.Playing;
  }
  #onEnd() {
    if (this.state !== GameState.Playing) throw new Error("state must be playing", { cause: this.state });
    this.state = GameState.Result;
  }
  #onBack() {
    if (this.state !== GameState.Result) throw new Error("state must be result", { cause: this.state });
    this.state = GameState.Lobby;
  }
  #onPlayerEnter(event: IntrinsicEvent["playerEnter"]) {
    this.players.push(createPlayer(event.id, this.players.length));
  }
  #onPlayerLeave(event: IntrinsicEvent["playerEnter"]) {
    this.players = this.players
      .filter(player => player.id !== event.id)
      .map((player, index) => ({
        ...player,
        index,
      }));
  }
  update(delta: number) {
    if (this.state !== GameState.Playing) return;
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
    }
  }
}