import { clamp } from "utils";

export class Player {
  readonly id: string;
  #x = 0.5;
  get x() { return this.#x };
  set x(value: number) {
    this.#x = clamp(value, 0, 1);
  }
  constructor(id: string) {
    this.id = id;
  }
  serialize() {
    return {
      id: this.id,
      x: this.#x,
    }
  }
}

interface BallOptions {
  x: number,
  y: number,
  vx: number,
  vy: number,
  speed: number,
}
export class Ball {
  readonly id: string;
  #x: number;
  get x() { return this.#x };
  #y: number;
  get y() { return this.#y };
  #vx: number;
  get vx() { return this.#vx };
  #vy: number;
  get vy() { return this.#vy };
  #speed: number;
  get speed() { return this.#speed };
  constructor(options: Partial<BallOptions>) {
    this.id = crypto.randomUUID();
    this.#x = options.x ?? 0;
    this.#y = options.y ?? 0;
    this.#vx = options.vx ?? 1;
    this.#vy = options.vy ?? 0;
    this.#speed = options.speed ?? 100;
  }
  move(delta: number) {
    this.#x += this.#vx * this.#speed * delta;
    this.#y += this.#vy * this.#speed * delta;
  }
  serialize() {
    return {
      id: this.id,
      x: this.#x,
      y: this.#y,
      vx: this.#vx,
      vy: this.#vy,
      speed: this.#speed,
    }
  }
}

export enum GameState {
  Idle,
  Playing,
  Result,
}

export class Game {
  players: Player[] = [];
  balls: Ball[] = [];
  state: GameState = GameState.Idle;
  constructor() { }
  player(id: string) {
    return this.players.find(player => player.id === id);
  }
  addPlayer(id: string) {
    this.players.push(new Player(id));
  }
  removePlayer(id: string) {
    this.players = this.players.filter(player => player.id !== id);
  }
  ball(id: string) {
    return this.balls.find(ball => ball.id === id);
  }
  addBall(options: Partial<BallOptions>) {
    this.balls.push(new Ball(options));
  }
  update(delta: number) {
    for (const ball of this.balls) {
      ball.move(delta);
    }
  }
  serialize() {
    return {
      players: this.players.map((player, index) => ({
        ...player.serialize(),
        index,
      })),
      balls: this.balls.map(ball => ball.serialize()),
    }
  }
}