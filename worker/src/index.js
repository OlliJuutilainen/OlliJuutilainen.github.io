const ALLOWED = new Set([
  "https://ollijuutilainen.github.io",
  // "http://localhost:8080", // lisää devissä tarvittaessa
]);

function corsify(resp, origin) {
  const h = new Headers(resp.headers);
  const allow = ALLOWED.has(origin) ? origin : "null";
  h.set("Access-Control-Allow-Origin", allow);
  h.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  h.set("Access-Control-Allow-Headers", "Content-Type,Authorization");
  h.set("Vary", "Origin");
  return new Response(resp.body, { status: resp.status, headers: h });
}

async function handleLoc(req) {
  // TODO: täytä oikea sijaintilogiikka
  return { ok: true, ts: Date.now() };
}

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    const origin = req.headers.get("Origin") || "";

    if (req.method === "OPTIONS") {
      return corsify(new Response(null, { status: 204 }), origin);
    }

    try {
      if (url.pathname === "/api/loc") {
        const data = await handleLoc(req, env);
        return corsify(new Response(JSON.stringify(data), {
          headers: { "Content-Type": "application/json" }
        }), origin);
      }
      return corsify(new Response("not found", { status: 404 }), origin);
    } catch (e) {
      return corsify(new Response(JSON.stringify({ error: "bad_request" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      }), origin);
    }
  }
};
