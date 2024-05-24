import { treaty } from "@elysiajs/eden";
import type { App } from "server";

const client = treaty<App>(import.meta.env.VITE_API_ENTRYPOINT);

document.querySelector("#app")!.innerHTML = (await client.index.get()).data + "";