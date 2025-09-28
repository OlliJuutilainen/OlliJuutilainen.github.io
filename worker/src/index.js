const ALLOWED = new Set([
  "https://ollijuutilainen.github.io",
  // "http://localhost:8080", // lisää devissä tarvittaessa
]);

function appendVary(headers, value) {
  const existing = headers.get("Vary");
  if (!existing) {
    headers.set("Vary", value);
    return;
  }
  const values = existing.split(",").map((v) => v.trim().toLowerCase());
  if (!values.includes(value.toLowerCase())) {
    headers.set("Vary", `${existing}, ${value}`);
  }
}

function corsify(resp, { origin, requestHeaders } = {}) {
  const headers = new Headers(resp.headers);
  const allowOrigin = ALLOWED.has(origin) ? origin : "null";
  headers.set("Access-Control-Allow-Origin", allowOrigin);
  headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");

  if (requestHeaders && requestHeaders.trim()) {
    headers.set("Access-Control-Allow-Headers", requestHeaders);
  } else {
    headers.set("Access-Control-Allow-Headers", "Content-Type,Authorization");
  }

  appendVary(headers, "Origin");

  return new Response(resp.body, { status: resp.status, headers });
}

async function handleLoc(req) {
  // TODO: täytä oikea sijaintilogiikka
  return { ok: true, ts: Date.now() };
}

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    const origin = req.headers.get("Origin") || "";
    const acrHeaders = req.headers.get("Access-Control-Request-Headers") || "";

    if (req.method === "OPTIONS") {
      return corsify(new Response(null, { status: 204 }), {
        origin,
        requestHeaders: acrHeaders,
      });
    }

    try {
      if (url.pathname === "/api/loc") {
        const data = await handleLoc(req, env);
        return corsify(new Response(JSON.stringify(data), {
          headers: { "Content-Type": "application/json" }
        }), {
          origin,
          requestHeaders: acrHeaders,
        });
      }
      return corsify(new Response("not found", { status: 404 }), {
        origin,
        requestHeaders: acrHeaders,
      });
    } catch (e) {
      return corsify(new Response(JSON.stringify({ error: "bad_request" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      }), {
        origin,
        requestHeaders: acrHeaders,
      });
    }
  }
};
