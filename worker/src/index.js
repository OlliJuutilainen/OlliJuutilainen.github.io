const DEFAULT_ALLOWED = [
  "https://ollijuutilainen.github.io",
  "http://localhost:8080",
];

const DEFAULT_ALLOWED_SET = new Set(DEFAULT_ALLOWED);

function parseAllowedOrigins(env) {
  if (!env || typeof env.ALLOWED_ORIGINS !== "string") {
    return [];
  }

  return env.ALLOWED_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

function resolveAllowedOrigins(env) {
  const extras = parseAllowedOrigins(env);
  if (!extras.length) {
    return DEFAULT_ALLOWED_SET;
  }

  return new Set([...DEFAULT_ALLOWED_SET, ...extras]);
}

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

function corsify(resp, { origin, requestHeaders, allowedOrigins = DEFAULT_ALLOWED_SET } = {}) {
  const headers = new Headers(resp.headers);
  const allowOrigin = allowedOrigins.has(origin) ? origin : "null";
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

// Keikkasoitin (soitin/): keikan tiedot ovat KV:ssä avaimella "gig:<tunnus>".
// Etuliite pitää ne erillään sijaintitokeneista. Tunnus kulkee soittimen
// osoitteen #-osassa, joten keikkatietoja ei ole repossa eikä GitHubin palvelimilla.
const GIG_KEY_RE = /^[a-z0-9]{4,32}$/;
const TIME_RE = /^(?:\d+:)?\d{1,2}:\d{2}(?:\.\d+)?$/;

function isValidGig(data) {
  if (!data || typeof data !== "object") return false;
  if (typeof data.title !== "string") return false;
  if (typeof data.folder === "string") return FOLDER_RE.test(data.folder);
  if (typeof data.audio !== "string" || !/^https:\/\//.test(data.audio)) return false;
  if (!Array.isArray(data.tracks) || data.tracks.length === 0 || data.tracks.length > 500) return false;
  return data.tracks.every(
    (tr) => tr && typeof tr.t === "string" && TIME_RE.test(tr.t) && typeof tr.title === "string"
  );
}

// ---- Dropbox-kansio soittolistana -------------------------------------
// Keikan tilalle voi tallentaa audio-linkin ja biisilistan sijaan jaetun
// Dropbox-kansion linkin ({ title, folder }). Kansion äänitiedostot ovat
// kappaleita nimen mukaisessa (numero)järjestyksessä, ja jokainen alikansio on
// oma settinsä. Sisältö luetaan Dropboxin rajapinnasta joka kerta, kun soitin
// avataan, joten kansioon lisätty tiedosto näkyy ilman uutta tallennusta.
//
// Rajapinta tarvitsee workerin salaisuudet DROPBOX_APP_KEY, DROPBOX_APP_SECRET
// ja DROPBOX_REFRESH_TOKEN (ohje: soitin/KAVERIVERSIO.md). Kansion pitää olla
// saman Dropbox-tilin omistama, jolle avain on tehty. Soittimelle annetaan
// Dropboxin tilapäiset suorat linkit, jotka ovat voimassa neljä tuntia.
const FOLDER_RE = /^https:\/\/(?:www\.)?dropbox\.com\/(?:scl\/fo|sh)\/[^\s]+$/;
const AUDIO_EXT_RE = /\.(mp3|m4a|mp4|aac|wav|flac|ogg|oga|opus|webm)$/i;
// Ilmaistasolla workerilla on 50 ulkoista pyyntöä kutsua kohden: yksi kullekin
// tiedostolle ja muutama avaimelle ja kansion listaukselle.
const MAX_FOLDER_FILES = 44;

let dropboxToken = null; // { token, exp } – säilyy saman isolaatin kutsujen yli

function dropboxError(code, detail) {
  const err = new Error(code);
  err.code = code;
  if (detail) err.detail = String(detail).slice(0, 300);
  return err;
}

async function dropboxAccessToken(env) {
  if (!env.DROPBOX_APP_KEY || !env.DROPBOX_APP_SECRET || !env.DROPBOX_REFRESH_TOKEN) {
    throw dropboxError("dropbox_not_configured");
  }
  if (dropboxToken && dropboxToken.exp > Date.now()) return dropboxToken.token;
  const res = await fetch("https://api.dropboxapi.com/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: env.DROPBOX_REFRESH_TOKEN,
      client_id: env.DROPBOX_APP_KEY,
      client_secret: env.DROPBOX_APP_SECRET,
    }),
  });
  if (!res.ok) throw dropboxError("dropbox_auth", await res.text());
  const data = await res.json();
  if (!data || typeof data.access_token !== "string") throw dropboxError("dropbox_auth", "no access_token");
  // Varmuusmarginaali, ettei vanhenevaa avainta käytetä kesken kutsun.
  const ttl = Math.max(60, (Number(data.expires_in) || 14400) - 300);
  dropboxToken = { token: data.access_token, exp: Date.now() + ttl * 1000 };
  return dropboxToken.token;
}

async function dropboxRpc(token, endpoint, body) {
  const res = await fetch(`https://api.dropboxapi.com/2/${endpoint}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    if (res.status === 401) dropboxToken = null;
    const notFound = res.status === 409 && /not_found|shared_link_access_denied|shared_link_not_found/.test(text);
    throw dropboxError(res.status === 401 ? "dropbox_auth" : notFound ? "folder_not_found" : "dropbox_error",
      `${endpoint} ${res.status} ${text}`);
  }
  return JSON.parse(text);
}

// "01 - Nimi.mp3" → "Nimi". Pelkästä numerosta koostuva nimi jää ennalleen.
function fileTitle(name) {
  const base = name.replace(/\.[^.]+$/, "").replace(/_/g, " ").trim();
  const stripped = base.replace(/^\d+\s*[-.)–—:]?\s+|^\d+\s*[-.)–—:]\s*/, "").trim();
  return stripped || base;
}

// Alikansion nimestä setin otsikko: "2 Encore" → "(Encore)", "(+)" pysyy.
// Pelkkä numero → ei omaa otsikkoa, soitin numeroi (i), (ii) …
function setTitle(name) {
  const t = fileTitle(name + ".x");
  if (/^\d*$/.test(t)) return "";
  return /^\(.+\)$/.test(t) ? t : `(${t})`;
}

const byName = (a, b) => a.name.localeCompare(b.name, "fi", { numeric: true, sensitivity: "base" });

async function folderFiles(folderUrl, env) {
  const token = await dropboxAccessToken(env);
  const meta = await dropboxRpc(token, "sharing/get_shared_link_metadata", { url: folderUrl });
  if (!meta || meta[".tag"] !== "folder") throw dropboxError("not_a_folder");
  // path_lower on mukana vain, jos kansio on avaimen omistajan Dropboxissa.
  const root = meta.path_lower;
  if (typeof root !== "string" || !root) throw dropboxError("folder_not_owned");

  const entries = [];
  let page = await dropboxRpc(token, "files/list_folder", { path: root, recursive: true, limit: 2000 });
  entries.push(...page.entries);
  for (let i = 0; page.has_more && i < 3; i++) {
    page = await dropboxRpc(token, "files/list_folder/continue", { cursor: page.cursor });
    entries.push(...page.entries);
  }

  // Juuren tiedostot ovat ensimmäinen setti, sitten alikansiot nimen mukaan.
  // Syvemmät kansiot ja muut kuin äänitiedostot ohitetaan.
  const rootFiles = [];
  const subFolders = new Map(); // path_lower → { name, files }
  for (const e of entries) {
    if (typeof e.path_lower !== "string" || !e.path_lower.startsWith(root + "/")) continue;
    const parts = e.path_lower.slice(root.length + 1).split("/");
    if (e[".tag"] === "folder" && parts.length === 1) {
      const f = subFolders.get(e.path_lower) || { files: [] };
      f.name = e.name;
      subFolders.set(e.path_lower, f);
    } else if (e[".tag"] === "file" && AUDIO_EXT_RE.test(e.name) && !e.name.startsWith(".")) {
      if (parts.length === 1) rootFiles.push(e);
      else if (parts.length === 2) {
        const key = `${root}/${parts[0]}`;
        const f = subFolders.get(key) || { files: [] };
        f.files.push(e);
        subFolders.set(key, f);
      }
    }
  }

  const groups = [];
  if (rootFiles.length) groups.push({ name: "", files: rootFiles.sort(byName) });
  [...subFolders.values()]
    .filter((f) => f.files.length && f.name)
    .sort(byName)
    .forEach((f) => groups.push({ name: setTitle(f.name), files: f.files.sort(byName) }));

  const list = [];
  groups.forEach((g, gi) => {
    g.files.forEach((e, fi) => {
      const o = { title: fileTitle(e.name).slice(0, 200), path: e.path_lower };
      if (fi === 0 && gi > 0) o.set = true;
      if (fi === 0 && g.name) o.name = g.name.slice(0, 80);
      list.push(o);
    });
  });
  if (!list.length) throw dropboxError("folder_empty");
  if (list.length > MAX_FOLDER_FILES) throw dropboxError("too_many_files", list.length);

  const links = await Promise.all(list.map((f) =>
    dropboxRpc(token, "files/get_temporary_link", { path: f.path })));
  return list.map((f, i) => {
    const o = { title: f.title, url: links[i].link };
    if (f.set) o.set = true;
    if (f.name) o.name = f.name;
    return o;
  });
}

// Käyttöönoton tarkistus: /api/dropbox vastaa {"ok":true}, kun salaisuudet
// ovat paikallaan ja Dropbox hyväksyy ne. Mitään tiedostoja ei lueta.
async function handleDropboxCheck(env) {
  try {
    dropboxToken = null;
    await dropboxAccessToken(env);
    return jsonResponse({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    const code = err && err.code ? err.code : "dropbox_error";
    logEvent("dropbox_check", { code });
    return errorResponse(code, code === "dropbox_not_configured" ? 500 : 502);
  }
}

async function handleGig(req, env) {
  const url = new URL(req.url);
  const key = (url.searchParams.get("k") || "").trim().toLowerCase();

  if (!GIG_KEY_RE.test(key)) {
    logEvent("gig_bad_key");
    return errorResponse("bad_key", 400);
  }

  if (!env.LOCATIONS || typeof env.LOCATIONS.get !== "function") {
    logEvent("kv_error", { reason: "missing_binding" });
    return errorResponse("bad_payload", 500);
  }

  let raw;
  try {
    raw = await env.LOCATIONS.get(`gig:${key}`);
  } catch (err) {
    logEvent("kv_error", { reason: "fetch_failed" });
    return errorResponse("bad_payload", 500);
  }

  if (!raw) {
    logEvent("gig_not_found");
    return errorResponse("not_found", 404);
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    logEvent("gig_bad_payload");
    return errorResponse("bad_payload", 500);
  }

  if (!isValidGig(data)) {
    logEvent("gig_invalid_fields");
    return errorResponse("invalid_fields", 500);
  }

  if (typeof data.folder === "string") {
    let files;
    try {
      files = await folderFiles(data.folder, env);
    } catch (err) {
      const code = err && err.code ? err.code : "dropbox_error";
      logEvent("gig_folder_error", { code, detail: err && err.detail ? err.detail : String(err) });
      return errorResponse(code, code === "dropbox_not_configured" ? 500 : 502);
    }
    logEvent("gig_200", { files: files.length });
    return jsonResponse(
      { v: 1, title: data.title, folder: data.folder, files },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  logEvent("gig_200");

  return jsonResponse(
    {
      v: 1,
      title: data.title,
      audio: data.audio,
      // set: uuden setin ensimmäinen kappale, name: setin oma otsikko (esim. "(+)").
      tracks: data.tracks.map((tr) => {
        const o = { t: tr.t, title: tr.title };
        if (tr.set === true) o.set = true;
        if (typeof tr.name === "string" && tr.name.trim()) o.name = tr.name.trim().slice(0, 80);
        return o;
      }),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    const origin = req.headers.get("Origin") || "";
    const acrHeaders = req.headers.get("Access-Control-Request-Headers") || "";
    const allowedOrigins = resolveAllowedOrigins(env);

    if (req.method === "OPTIONS") {
      return corsify(new Response(null, { status: 204 }), {
        origin,
        requestHeaders: acrHeaders,
        allowedOrigins,
      });
    }

    try {
      if (url.pathname === "/api/dropbox") {
        return corsify(await handleDropboxCheck(env), {
          origin,
          requestHeaders: acrHeaders,
          allowedOrigins,
        });
      }
      if (url.pathname === "/api/loc" || url.pathname === "/api/gig") {
        const response = url.pathname === "/api/loc"
          ? await handleLoc(req, env)
          : await handleGig(req, env);
        return corsify(response, {
          origin,
          requestHeaders: acrHeaders,
          allowedOrigins,
        });
      }
      return corsify(errorResponse("not_found", 404), {
        origin,
        requestHeaders: acrHeaders,
        allowedOrigins,
      });
    } catch (e) {
      return corsify(errorResponse("bad_request", 400), {
        origin,
        requestHeaders: acrHeaders,
        allowedOrigins,
      });
    }
  }
};
