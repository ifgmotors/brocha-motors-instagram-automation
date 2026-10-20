import fs from "node:fs/promises";
import path from "node:path";

const API_VERSION = process.env.META_API_VERSION || "v24.0";
const IG_USER_ID = process.env.IG_USER_ID;
const ACCESS_TOKEN = process.env.IG_ACCESS_TOKEN;
const PUBLIC_MEDIA_BASE = (process.env.PUBLIC_MEDIA_BASE || "").replace(/\/$/, "");
const root = path.dirname(new URL(import.meta.url).pathname.replace(/^\/(.:)/, "$1"));

if (!IG_USER_ID || !ACCESS_TOKEN || !PUBLIC_MEDIA_BASE) {
  throw new Error("Faltan IG_USER_ID, IG_ACCESS_TOKEN o PUBLIC_MEDIA_BASE");
}

const schedulePath = path.join(root, "schedule.json");
const statePath = path.join(root, "state.json");
const schedule = JSON.parse(await fs.readFile(schedulePath, "utf8"));
let state = { published: {} };
try { state = JSON.parse(await fs.readFile(statePath, "utf8")); } catch {}

const due = schedule
  .filter((item) => Date.parse(item.publishAt) <= Date.now() && !state.published[item.id])
  .sort((a, b) => Date.parse(a.publishAt) - Date.parse(b.publishAt))[0];

if (!due) {
  console.log("No hay Reels pendientes en este momento.");
  process.exit(0);
}

const pack = JSON.parse(await fs.readFile(path.join(root, "packages", due.package), "utf8"));
const videoUrl = `${PUBLIC_MEDIA_BASE}/${encodeURIComponent(due.file)}`;

async function graph(endpoint, options = {}) {
  const response = await fetch(`https://graph.facebook.com/${API_VERSION}/${endpoint}`, options);
  const body = await response.json();
  if (!response.ok || body.error) throw new Error(JSON.stringify(body));
  return body;
}

const createParams = new URLSearchParams({
  media_type: "REELS",
  video_url: videoUrl,
  caption: pack.caption,
  share_to_feed: "true",
  access_token: ACCESS_TOKEN,
});
const created = await graph(`${IG_USER_ID}/media?${createParams}`, { method: "POST" });
const containerId = created.id;

let status = "IN_PROGRESS";
for (let attempt = 0; attempt < 40; attempt++) {
  await new Promise((resolve) => setTimeout(resolve, 15000));
  const check = await graph(`${containerId}?fields=status_code,status&access_token=${encodeURIComponent(ACCESS_TOKEN)}`);
  status = check.status_code;
  if (status === "FINISHED") break;
  if (status === "ERROR" || status === "EXPIRED") throw new Error(JSON.stringify(check));
}
if (status !== "FINISHED") throw new Error(`Meta no terminó de procesar ${containerId}: ${status}`);

const publishParams = new URLSearchParams({ creation_id: containerId, access_token: ACCESS_TOKEN });
const published = await graph(`${IG_USER_ID}/media_publish?${publishParams}`, { method: "POST" });

state.published[due.id] = {
  mediaId: published.id,
  publishedAt: new Date().toISOString(),
  file: due.file,
};
await fs.writeFile(statePath, JSON.stringify(state, null, 2) + "\n", "utf8");
console.log(`PUBLICADO ${due.id}: ${published.id}`);
