import { treaty } from "@elysiajs/eden";
import type { App } from "server";
import "./style.css";
import { clamp } from "utils";

const client = treaty<App>(import.meta.env.VITE_API_ENTRYPOINT);

const ws = client.ws.subscribe({
  query: {
    room: "53",
  }
});

interface Player {
  id: string;
  x: number;
  index: number;
}
interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
}
interface World {
  players: Player[];
  balls: Ball[];
}

let world: World = {
  players: [],
  balls: [],
};
let me: string;
ws.on("open", (e) => {
  console.log(e.type, e);
});
ws.subscribe((message) => {
  const data: any = message.data;
  if (data.type === "snapshot") {
    world = data.world;
  }
  if (data.type === "me:enter") {
    me = data.id;
  }
});
ws.on("error", (e) => {
  console.error(e.type, e)
});
ws.on("close", (e) => {
  console.log(e.type, e)
});

const $canvas = document.querySelector<HTMLCanvasElement>("#canvas")!;

const MAP_RADIUS = 16 * 20;
function render() {
  const context = $canvas?.getContext("2d");
  if (context == null) return;

  context.clearRect(0, 0, $canvas.width, $canvas.height);

  context.save();
  context.translate($canvas.width / 2, $canvas.height / 2);

  drawMap(context);

  for (const player of world.players) {
    drawPlayer(context, player);
  }
  for (const ball of world.balls) {
    drawBall(context, ball);
  }

  context.restore();
  window.requestAnimationFrame(render);

  function drawMap(context: CanvasRenderingContext2D) {
    context.beginPath();
    context.arc(0, 0, MAP_RADIUS, 0, Math.PI * 2);
    context.stroke();
  }
  function drawPlayer(context: CanvasRenderingContext2D, player: Player) {
    context.save();
    const playersNum = world.players.length;

    const pie = Math.PI * 2 / playersNum

    context.rotate((player.index - 0.5 + player.x) * pie);


    context.beginPath();

    context.moveTo(-32, MAP_RADIUS - 16);
    context.lineTo(32, MAP_RADIUS - 16);

    context.stroke();

    context.restore();
  }
  function drawBall(context: CanvasRenderingContext2D, ball: Ball) {
    context.save();
    context.translate(ball.x, ball.y);

    context.beginPath();
    context.arc(0, 0, 8, 0, Math.PI * 2);
    context.stroke();

    context.beginPath();
    context.strokeStyle = "red";
    context.moveTo(0, 0);
    context.lineTo(ball.vx * ball.speed, ball.vy * ball.speed);
    context.stroke();

    context.restore();
  }
}
window.requestAnimationFrame(render);

function resize() {
  const rect = $canvas.getBoundingClientRect();

  $canvas.width = Math.floor(rect.width);
  $canvas.height = Math.floor(rect.height);
}
resize();
window.addEventListener("resize", resize);

function input(e: MouseEvent) {
  const x = clamp((window.innerWidth / 2 - e.clientX) / 160, -1, 1) / 2 + 0.5;

  ws.send({
    type: "x",
    value: x,
  });
}

window.addEventListener("mousemove", input);

document.querySelector("#ui")!.innerHTML = (await client.index.get()).data + "";