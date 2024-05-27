import { Bodies, Body, Composite, Engine, Events, Pair } from "matter-js";
import { clamp } from "utils";

export class Player {
  readonly id: string;
  readonly body: Body;
  readonly game: Game;
  readonly name: string;
  index;
  #x = 0.5;
  get x() { return this.#x };
  set x(value: number) {
    this.#x = clamp(value, 0, 1);

    // Do not set x value before the player pushed
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
  score = 0;
  constructor(id: string, body: Body, index: number, game: Game, name: string) {
    this.id = id;
    this.body = body;
    this.index = index;
    this.game = game;
    this.name = name;
  }
  serialize() {
    return {
      id: this.id,
      x: this.#x,
      index: this.index,
      score: this.score,
      name: this.name,
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
  lastHitPlayerId: string | undefined;
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
  physics;
  pub;
  constructor(options?: { pub: (event: unknown) => void }) {
    this.pub = options?.pub;
    this.physics = new Physics({
      onBallOut: (body) => {
        const theta = (Math.atan2(body.position.y, body.position.x) + Math.PI * 2) % (Math.PI * 2);
        const pie = Math.PI * 2 / this.players.length;
        const index = Math.floor(theta / pie);

        options?.pub?.({
          type: "ballOut",
          index,
        });

        const ball = this.balls.find(ball => ball.body === body);
        if (ball != null) {
          getScoringPlayers(this, ball)
            ?.forEach(player => player.score += 1);
        }

        this.physics.remove(body);
        this.balls = this.balls
          .filter(ball => ball.body !== body);

        setTimeout(() => this.addBall(), 500);

        function getScoringPlayers(self: Game, ball: Ball) {
          if (ball.lastHitPlayerId != null) {
            const player = self.players.find(player => player.id === ball.lastHitPlayerId);
            if (player != null && player.index !== index) {
              return [player];
            }
          }
          return self.players.filter(player => player.index !== index);
        }
      },
      onBallHit: (ballBody, playerBody) => {
        const ball = this.balls.find(ball => ball.body === ballBody);
        const player = this.players.find(player => player.body === playerBody);

        if (ball == null || player == null) return;

        ball.lastHitPlayerId = player.id;

        options?.pub?.({
          type: "ballHit",
          ball: {
            x: ball.x,
            y: ball.y,
          }
        });
      }
    });

    setTimeout(() => this.addBall(), 500);
  }
  player(id: string) {
    return this.players.find(player => player.id === id);
  }
  addPlayer(id: string, name: string) {
    const body = this.physics.createPlayer();
    const player = new Player(id, body, this.players.length, this, name);
    this.players.push(player);
    player.x = 0.5;
    this.pub?.({ type: "snapshot", world: this.serialize() });
  }
  removePlayer(id: string) {
    const player = this.players.find(player => player.id === id);
    if (player == null) return;
    this.physics.remove(player.body);

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
  constructor(options?: { onBallOut?: (ball: Body) => void, onBallHit?: (ball: Body, player: Body) => void }) {
    Composite.add(this.engine.world, [this.table]);
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
    Events.on(this.engine, "collisionStart", (e) => {
      for (const pair of e.pairs) {
        if (pair.isSensor || pair.bodyA.label === pair.bodyB.label) continue;

        const ball = getBall(pair);
        const player = getPlayer(pair);

        if (ball == null || player == null) continue;

        options?.onBallHit?.(ball, player);

        function getBall(pair: Pair) {
          if (pair.bodyA.label === "ball") return pair.bodyA;
          if (pair.bodyB.label === "ball") return pair.bodyB;
        }
        function getPlayer(pair: Pair) {
          if (pair.bodyA.label === "player") return pair.bodyA;
          if (pair.bodyB.label === "player") return pair.bodyB;
        }
      }
    })
  }
  createBall() {
    const theta = Math.random() * 2 * Math.PI;
    const ball = Bodies.circle(0, 0, 8, {
      force: {
        x: Math.cos(theta) * 4000,
        y: Math.sin(theta) * 4000
      },
      restitution: 1.2,
      frictionAir: 0.001,
      label: "ball",
    });
    Composite.add(this.engine.world, [ball]);
    return ball;
  }
  remove(ball: Body) {
    Composite.remove(this.engine.world, ball);
  }
  createPlayer() {
    const player = Bodies.rectangle(0, 0, 64, 32, {
      isStatic: true,
      label: "player",
    });
    Composite.add(this.engine.world, [player]);
    return player;
  }
}