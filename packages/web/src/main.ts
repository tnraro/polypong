import { Bodies, Body, Composite, Engine, Events, Pair, Render, Runner } from "matter-js";
import { clamp } from "utils";

const $canvas = document.querySelector<HTMLCanvasElement>("#canvas")!;

const engine = Engine.create({
  gravity: { x: 0, y: 0 },

});

const render = Render.create({
  canvas: $canvas,
  engine,
  options: {
    width: 480,
    height: 720,
    showAngleIndicator: true,
    showVelocity: true,
  }
});
Render.lookAt(render, {
  min: { x: -240, y: -360 },
  max: { x: 240, y: 360 },
});

const table = Bodies.circle(0, 0, 16 * 20, { isStatic: true, isSensor: true });

Events.on(engine, "collisionEnd", (e) => {
  for (const pair of e.pairs) {
    if (!pair.isSensor) continue;
    const ball = getBall(pair);
    if (ball == null) continue;

    Composite.remove(engine.world, ball);
    console.log(ball);
    Composite.add(engine.world, [createBall()]);

    function getBall(pair: Pair) {
      if (pair.bodyA === table) return pair.bodyB;
      if (pair.bodyB === table) return pair.bodyA;
    }
  }
})

function createBall() {
  const theta = Math.random() * 2 * Math.PI;
  const ball = Bodies.circle(0, 0, 8, {
    force: {
      x: Math.cos(theta) * 0.004,
      y: Math.sin(theta) * 0.004
    },
    restitution: 2,
    frictionAir: 0.001,
  });
  return ball;
}

const player = Bodies.rectangle(0, 0, 64, 32, {
  isStatic: true,
});
Composite.add(engine.world, [player]);

Composite.add(engine.world, [table]);

setInterval(() => {
  Composite.add(engine.world, [createBall()]);
}, 1000);

Render.run(render);

const runner = Runner.create();

Runner.run(runner, engine);

function input(e: MouseEvent) {
  const nx = clamp((window.innerWidth / 2 - e.clientX) / 160, -1, 1) / 2 + 0.5;

  const playerNum = 3;
  const index = 0;
  const pie = Math.PI * 2 / playerNum;
  const a = pie * index;
  const b = pie * (index + 1);
  const theta = (b - a) * nx + a;

  Body.setPosition(player, {
    x: Math.cos(theta) * 16 * 19,
    y: Math.sin(theta) * 16 * 19,
  });
  Body.setAngle(player, theta + Math.PI / 2);
}

window.addEventListener("mousemove", input);