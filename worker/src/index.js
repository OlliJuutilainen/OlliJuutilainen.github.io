const ALLOWED = new Set([
  "https://ollijuutilainen.github.io",
  "http://localhost:8080",
]);

function logEvent(type, extra = {}) {
  const data = Object.keys(extra).length ? ` ${JSON.stringify(extra)}` : "";
  console.log(`[loc] ${type}${data}`);
}

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

  headers.set("Access-Control-Max-Age", "86400");

  appendVary(headers, "Origin");

  return new Response(resp.body, { status: resp.status, headers });
}

function jsonResponse(payload, { status = 200, headers = {} } = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
}

function errorResponse(error, status) {
  return jsonResponse({ error }, { status });
}

async function handleLoc(req, env) {
  const url = new URL(req.url);
  const token = (url.searchParams.get("t") || "").trim();

  if (!token) {
    logEvent("missing_token");
    return errorResponse("missing_token", 400);
  }

  if (!env.LOCATIONS || typeof env.LOCATIONS.get !== "function") {
    logEvent("kv_error", { reason: "missing_binding" });
    return errorResponse("bad_payload", 500);
  }

  let raw;
  try {
    raw = await env.LOCATIONS.get(token);
  } catch (err) {
    logEvent("kv_error", { reason: "fetch_failed" });
    return errorResponse("bad_payload", 500);
  }

  if (!raw) {
    logEvent("not_found");
    return errorResponse("not_found", 404);
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    logEvent("bad_payload");
    return errorResponse("bad_payload", 500);
  }

  if (
    !data ||
    typeof data !== "object" ||
    typeof data.iv !== "string" ||
    data.iv.trim().length === 0 ||
    typeof data.ct !== "string" ||
    data.ct.trim().length === 0
  ) {
    logEvent("invalid_fields");
    return errorResponse("invalid_fields", 500);
  }

  const versionRaw = data.v ?? 1;
  const version = Number(versionRaw);
  if (!Number.isFinite(version) || version !== 1) {
    logEvent("invalid_fields", { version: versionRaw });
    return errorResponse("invalid_fields", 500);
  }

  logEvent("200");

  return jsonResponse(
    { v: version, iv: data.iv, ct: data.ct },
    { headers: { "Cache-Control": "no-store" } }
  );
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
        const response = await handleLoc(req, env);
        return corsify(response, {
          origin,
          requestHeaders: acrHeaders,
        });
      }
      return corsify(errorResponse("not_found", 404), {
        origin,
        requestHeaders: acrHeaders,
      });
    } catch (e) {
      return corsify(errorResponse("bad_request", 400), {
        origin,
        requestHeaders: acrHeaders,
      });
    }
  }
};
