import { treaty } from "@elysiajs/eden";
import type { App } from "server";
import "./style.css";
import { clamp } from "utils";

const client = treaty<App>(import.meta.env.VITE_API_ENTRYPOINT);

const ws = client.ws.subscribe({
  query: {
    room: "53",
    name: "임시 이름",
  }
});

interface Player {
  id: string;
  x: number;
  index: number;
  score: number;
  name: string;
}
interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
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
function myIndex() {
  return world.players.find(player => player.id === me)?.index ?? 0;
}
function getPie() {
  const playersNum = world.players.length;
  return Math.PI * 2 / playersNum;
}
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
  context.fillStyle = "gainsboro";
  context.fillRect(0, 0, $canvas.width, $canvas.height);
  context.restore();

  context.save();
  context.translate($canvas.width / 2, $canvas.height / 2);
  context.rotate(-(myIndex() + 0.5) * getPie() + Math.PI / 2);

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

    context.save();

    context.rotate(myIndex() * getPie());
    const gradient = context.createRadialGradient(0, 0, 0, 0, 0, MAP_RADIUS);
    gradient.addColorStop(0.9, "hsl(42deg 90% 50% / 0)");
    gradient.addColorStop(0.97, "hsl(42deg 90% 50% / 0.05)");
    gradient.addColorStop(1, "hsl(42deg 90% 50% / 0.1)");

    context.beginPath();
    context.arc(0, 0, MAP_RADIUS, 0, getPie());
    context.fillStyle = gradient;
    context.fill();
    context.strokeStyle = "hsl(42deg 90% 50%)";
    context.stroke();

    context.strokeStyle = "hsl(42deg 90% 50% / 0.3)";
    context.moveTo(MAP_RADIUS, 0);
    context.lineTo(0, 0);
    const theta = getPie();
    context.lineTo(Math.cos(theta) * MAP_RADIUS, Math.sin(theta) * MAP_RADIUS);
    context.stroke();

    context.restore();
  }
  function drawPlayer(context: CanvasRenderingContext2D, player: Player) {
    context.save();
    const pie = getPie();

    const a = pie * player.index;
    const b = pie * (player.index + 1);
    const theta = (b - a) * player.x + a;

    context.rotate(theta - Math.PI / 2);

    context.beginPath();

    context.fillStyle = "white";
    context.strokeStyle = "black";
    context.rect(-32, MAP_RADIUS - 32, 64, 32);

    context.fill();
    context.stroke();

    context.textAlign = "center";
    context.fillStyle = "black";
    context.fillText(player.name, 0, MAP_RADIUS + 16);

    context.restore();
  }
  function drawBall(context: CanvasRenderingContext2D, ball: Ball) {
    context.save();
    context.translate(ball.x, ball.y);

    context.beginPath();
    context.arc(0, 0, ball.radius, 0, Math.PI * 2);
    context.fillStyle = "white";
    context.fill();
    context.stroke();

    context.restore();
  }
}
window.requestAnimationFrame(render);

const $ui = document.querySelector<HTMLDivElement>("#ui")!;
function renderUi() {
  $ui.innerHTML = `<ul>${world.players.map(player => `<li>${player.name} — ${player.score}</li>`).join("")}</ui>`;

  window.requestAnimationFrame(renderUi);
}
window.requestAnimationFrame(renderUi);

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