// Itera PoC HTTP server (no Express, no database).
import http from "node:http";
import { createListing, formatReply } from "./organizer/createListing.js";
import { confirmListing } from "./organizer/confirmListing.js";
import { recommend } from "./traveler/recommend.js";
import { travelers, trips } from "./traveler/core.js";

const port = Number(process.env.PORT || 3000);

const send = (res, status, body) => {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
};

async function readJson(req) {
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 100000) throw Error("Request too large");
  }
  return JSON.parse(raw);
}

const routes = {
  // Organizer: one chat turn. Body: { history: [{ role: "user" | "assistant", content }] }
  "POST /api/listing": async (body) => {
    const result = await createListing(body.history);
    return [200, { ...result, reply: formatReply(result) }];
  },
  // Organizer: publish. Body: { listing, confirmed: true } (only sent when the organizer presses Confirm)
  "POST /api/listing/confirm": async (body) => {
    const result = confirmListing(body.listing, { confirmed: body.confirmed });
    return [result.published ? 201 : 400, result];
  },
  // Traveler: recommendations. Body: { profile, useAI }
  "POST /api/match": async (body) => [200, await recommend(body.profile, { useAI: body.useAI !== false })],
};

http
  .createServer(async (req, res) => {
    if (req.method === "GET" && req.url === "/api/fixtures") return send(res, 200, { travelers, trips });
    const handler = routes[`${req.method} ${req.url}`];
    if (!handler) return send(res, 404, { error: "Not found" });
    try {
      const [status, body] = await handler(await readJson(req));
      send(res, status, body);
    } catch (e) {
      send(res, 400, { error: e.message });
    }
  })
  .listen(port, "127.0.0.1", () => console.log(`Itera PoC listening on http://localhost:${port}`));