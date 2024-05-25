import { treaty } from "@elysiajs/eden";
import type { App } from "server";

const client = treaty<App>(import.meta.env.VITE_API_ENTRYPOINT);

const ws = client.ws.subscribe({
  query: {
    room: "53",
  }
});

ws.on("open", (e) => {
  console.log(e.type, e)
  ws.send({ x: 53 });
});
ws.subscribe((message) => {
  console.log(message);
});
ws.on("error", (e) => {
  console.error(e.type, e)
});
ws.on("close", (e) => {
  console.log(e.type, e)
});

document.querySelector("#app")!.innerHTML = (await client.index.get()).data + "";