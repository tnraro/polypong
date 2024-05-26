import { Bodies, Body, Composite, Engine, Events, Pair } from "matter-js";
import { clamp } from "utils";

export class Player {
  readonly id: string;
  readonly body: Body;
  readonly game: Game;
  index;
  #x = 0.5;
  get x() { return this.#x };
  set x(value: number) {
    this.#x = clamp(value, 0, 1);
  }
  constructor(id: string, body: Body, index: number, game: Game) {
    this.id = id;
    this.body = body;
    this.index = index;
    this.game = game;
  }
  serialize() {
    return {
      id: this.id,
      x: this.#x,
      index: this.index,
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
  physics = new Physics();
  constructor() { }
  player(id: string) {
    return this.players.find(player => player.id === id);
  }
  addPlayer(id: string) {
    const body = this.physics.createPlayer();
    this.players.push(new Player(id, body, this.players.length, this));
  }
  removePlayer(id: string) {
    this.players = this.players
      .filter(player => player.id !== id)
      .map((player, index) => {
        player.index = index;
        return player
      });
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
      players: this.players.map(player => player.serialize()),
      balls: this.balls.map(ball => ball.serialize()),
    }
  }
}

export class Physics {
  engine = Engine.create({
    gravity: { x: 0, y: 0 },
  })
  table = Bodies.circle(0, 0, 16 * 20, { isSensor: true, isStatic: true });
  constructor() {
    Events.on(this.engine, "collisionEnd", (e) => {
      for (const pair of e.pairs) {
        if (!pair.isSensor) continue;
        const ball = getBall(this, pair);
        if (ball == null) continue;

        this.onBallOut(ball);

        function getBall(self: Physics, pair: Pair) {
          if (pair.bodyA === self.table) return pair.bodyB;
          if (pair.bodyB === self.table) return pair.bodyA;
        }
      }
    });
  }
  createBall() {
    const theta = Math.random() * 2 * Math.PI;
    const ball = Bodies.circle(0, 0, 8, {
      force: {
        x: Math.cos(theta) * 0.004,
        y: Math.sin(theta) * 0.004
      },
      restitution: 2,
      frictionAir: 0.001,
    });
    Composite.add(this.engine.world, [ball]);
    return ball;
  }
  createPlayer() {
    const player = Bodies.rectangle(0, 0, 64, 32, {
      isStatic: true,
    });
    Composite.add(this.engine.world, [player]);
    return player;
  }
  onBallOut(ball: Body) {
    Composite.remove(this.engine.world, ball);
  }
}