import { treaty } from "@elysiajs/eden";
import type { App } from "server";
import "./style.css";
import { clamp } from "utils";

lobby();

function lobby() {
  const $ui = document.querySelector<HTMLDivElement>("#ui")!;
  const $form = document.createElement("form");
  $form.addEventListener("submit", (e) => {
    e.preventDefault();
    $nickname.value = $nickname.value.trim();
    if ($nickname.value.length < 1) return;
    run({
      nickname: $nickname.value.replaceAll(/[-<>/&'"]/g, (x) => `&#${x.codePointAt(0)};`),
    });
  });
  const $nickname = document.createElement("input");
  $nickname.placeholder = "별명을 입력해주세요";
  $nickname.minLength = 1;
  $nickname.required = true;

  const $confirm = document.createElement("button");
  $confirm.innerHTML = "이 별명으로 시작하기";

  $form.append($nickname);
  $form.append($confirm);

  $ui.append($form);
}

async function run(options: { nickname: string }) {
  const client = treaty<App>(import.meta.env.PROD ? location.host : import.meta.env.VITE_API_ENTRYPOINT);

  const ws = client.ws.subscribe({
    query: {
      room: "53",
      name: options.nickname,
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
  let ballOut: { index: number, alpha: number } | undefined;
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
    if (data.type === "ballOut") {
      ballOut = {
        index: data.index,
        alpha: 1,
      }
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

    drawControlIndicator(context);
    context.rotate(-(myIndex() + 0.5) * getPie() + Math.PI / 2);

    drawMap(context);
    drawBallOutIndicator(context);

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
    function drawBallOutIndicator(context: CanvasRenderingContext2D) {
      if (ballOut == null) return;
      context.save();

      context.rotate(ballOut.index * getPie());
      const gradient = context.createRadialGradient(0, 0, 0, 0, 0, MAP_RADIUS);
      gradient.addColorStop(0.8, `hsl(${color()} 90% 60% / 0)`);
      gradient.addColorStop(0.95, `hsl(${color()} 90% 65% / ${ballOut.alpha * 0.1})`);
      gradient.addColorStop(1, `hsl(${color()} 90% 70% / ${ballOut.alpha * 0.3})`);

      context.beginPath();
      context.arc(0, 0, MAP_RADIUS, 0, getPie());
      context.fillStyle = gradient;
      context.fill();

      context.restore();

      ballOut.alpha -= 0.1;
      if (ballOut.alpha < 0) {
        ballOut = undefined;
      }
      function color() {
        if (ballOut?.index === myIndex()) return "23deg";
        return "200deg";
      }
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
    function drawControlIndicator(context: CanvasRenderingContext2D) {
      context.save();
      context.translate(0, window.innerHeight / 3);

      context.beginPath();
      context.strokeStyle = "hsl(120deg 8% 64%)";
      context.fillStyle = "hsl(120deg 8% 64% / 0.75)";
      context.roundRect(-160, -16, 320, 32, 16);
      context.stroke();

      context.save();
      context.translate((0.5 - x) * 280, 0);
      context.beginPath();
      context.strokeStyle = "hsl(120deg 8% 64%)";
      context.fillStyle = "white";
      context.roundRect(-16, -12, 32, 24, 12);
      context.moveTo(-2, -6);
      context.lineTo(-2, 6);
      context.moveTo(2, -6);
      context.lineTo(2, 6);
      context.fill();
      context.stroke();
      context.restore();

      context.restore();
    }
  }
  window.requestAnimationFrame(render);

  const $ui = document.querySelector<HTMLDivElement>("#ui")!;
  let cache = "";
  function renderUi() {
    const html = `<ul>${world.players.map(player => `<li>${player.name} — ${player.score}</li>`).join("")}</ui>`;
    if (cache !== html) {
      $ui.innerHTML = html;
      cache = html;
    }

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

  let x = 0.5;
  function toRelativeX(x: number) {
    return clamp((window.innerWidth / 2 - x) / 160, -1, 1) / 2 + 0.5;
  }
  function sendX(x: number) {
    ws.send({
      type: "x",
      value: x,
    });
  }
  function setX(_x: number) {
    x = _x;
  }
  function updateX(x: number) {
    const _x = toRelativeX(x);
    setX(_x);
    sendX(_x);
  }

  window.addEventListener("mousemove", (e) => {
    updateX(e.clientX);
  });
  window.addEventListener("touchmove", (e) => {
    const sum = [...e.touches]
      .reduce((sum, touch) => sum + touch.clientX, 0);
    const centerOfMass = sum / e.touches.length;
    updateX(centerOfMass);
  });
}