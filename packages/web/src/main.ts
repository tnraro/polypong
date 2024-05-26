import { clamp } from "utils";
import "./style.css";
import { type Ball, Game, type Player } from "./game";

const $canvas = document.querySelector<HTMLCanvasElement>("#canvas")!;

const game = new Game();

const MAP_RADIUS = 16 * 20;
function render() {
  const context = $canvas?.getContext("2d");
  if (context == null) return;

  context.clearRect(0, 0, $canvas.width, $canvas.height);

  context.save();
  context.translate($canvas.width / 2, $canvas.height / 2);

  drawMap(context);

  for (const player of game.players) {
    drawPlayer(context, player);
  }
  for (const ball of game.balls) {
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
    const playersNum = game.players.length;

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
    context.translate(ball.pos.x, ball.pos.y);

    context.beginPath();
    context.arc(0, 0, 8, 0, Math.PI * 2);
    context.stroke();

    context.beginPath();
    context.strokeStyle = "red";
    context.moveTo(0, 0);
    context.lineTo(ball.vel.x * ball.speed, ball.vel.y * ball.speed);
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
}

window.addEventListener("mousemove", input);