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

    const playerNum = this.game.players.length;
    const pie = Math.PI * 2 / playerNum;
    const a = pie * this.index;
    const b = pie * (this.index + 1);
    const theta = (b - a) * this.#x + a;

    Body.setPosition(this.body, {
      x: Math.cos(theta) * 16 * 19,
      y: Math.sin(theta) * 16 * 19,
    });
    Body.setAngle(this.body, theta + Math.PI / 2);
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

export class Ball {
  readonly id: string;
  readonly body: Body;
  get x() { return this.body.position.x };
  get y() { return this.body.position.y };
  get vx() { return this.body.velocity.x };
  get vy() { return this.body.velocity.y };
  get radius() { return this.body.circleRadius! };
  constructor(body: Body) {
    this.id = crypto.randomUUID();
    this.body = body;
  }
  serialize() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      vx: this.vx,
      vy: this.vy,
      radius: this.radius,
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
  addBall() {
    const body = this.physics.createBall();
    this.balls.push(new Ball(body));
  }
  update(delta: number) {
    Engine.update(this.physics.engine, delta);
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
  constructor(options?: { onBallOut?: (ball: Body) => void }) {
    Events.on(this.engine, "collisionEnd", (e) => {
      for (const pair of e.pairs) {
        if (!pair.isSensor) continue;
        const ball = getBall(this, pair);
        if (ball == null) continue;

        options?.onBallOut?.(ball);

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
        x: Math.cos(theta) * 4000,
        y: Math.sin(theta) * 4000
      },
      restitution: 2,
      frictionAir: 0.001,
    });
    Composite.add(this.engine.world, [ball]);
    return ball;
  }
  removeBall(ball: Body) {
    Composite.remove(this.engine.world, ball);
  }
  createPlayer() {
    const player = Bodies.rectangle(0, 0, 64, 32, {
      isStatic: true,
    });
    Composite.add(this.engine.world, [player]);
    return player;
  }
}