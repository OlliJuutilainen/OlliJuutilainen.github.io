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
// Valinnainen sub on otsikon alle tuleva lisätieto (päivämäärä tms.).
// Etuliite pitää ne erillään sijaintitokeneista. Tunnus kulkee soittimen
// osoitteen #-osassa, joten keikkatietoja ei ole repossa eikä GitHubin palvelimilla.
const GIG_KEY_RE = /^[a-z0-9]{4,32}$/;
const TIME_RE = /^(?:\d+:)?\d{1,2}:\d{2}(?:\.\d+)?$/;

function gigSub(data) {
  return typeof data.sub === "string" && data.sub.trim() ? data.sub.trim().slice(0, 200) : "";
}

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
      files = await folderFiles(data.folder, env, url.origin);
    } catch (err) {
      const code = err && err.code ? err.code : "folder_error";
      logEvent("gig_folder_error", { code, detail: err && err.detail ? err.detail : String(err) });
      return errorResponse(code, folderErrorStatus(code));
    }
    logEvent("gig_200", { files: files.length });
    const sub = gigSub(data);
    return jsonResponse(
      { v: 1, title: data.title, ...(sub && { sub }), folder: data.folder, files },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  logEvent("gig_200");

  const sub = gigSub(data);
  return jsonResponse(
    {
      v: 1,
      title: data.title,
      ...(sub && { sub }),
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

// ---- Luinin postilaatikko ---------------------------------------------
// Latomo (luin/latomo.html) tulostaa komennon, joka tallentaa Markdown-tekstin
// avaimella "luin:<laatikko>:<tekstin tunnus>" ja metatietona lähetysajan {t}.
// Luin hakee laatikon sisällysluettelon (?l=) ja siitä vain uudet tai muuttuneet
// tekstit (?l=&id=). Laatikon koodi on salasana: se kulkee vain Luinin
// asetuksissa ja Latomon kentässä, ei repossa. Tekstit vanhenevat KV:stä
// (komennon --ttl); lukulaitteella ne säilyvät.
const LUIN_BOX_RE = /^[a-z0-9-]{8,40}$/;
const LUIN_ID_RE = /^[a-z0-9-]{1,60}$/;

async function handleLuin(req, env) {
  const url = new URL(req.url);
  const box = (url.searchParams.get("l") || "").trim().toLowerCase();
  const id = (url.searchParams.get("id") || "").trim().toLowerCase();

  if (!LUIN_BOX_RE.test(box) || (id && !LUIN_ID_RE.test(id))) {
    logEvent("luin_bad_key");
    return errorResponse("bad_key", 400);
  }
  if (!env.LOCATIONS || typeof env.LOCATIONS.list !== "function") {
    logEvent("kv_error", { reason: "missing_binding" });
    return errorResponse("bad_payload", 500);
  }

  const prefix = `luin:${box}:`;
  if (id) {
    const md = await env.LOCATIONS.get(prefix + id);
    if (md == null) {
      logEvent("luin_not_found");
      return errorResponse("not_found", 404);
    }
    logEvent("luin_200", { bytes: md.length });
    return new Response(md, {
      headers: { "Content-Type": "text/markdown; charset=utf-8", "Cache-Control": "no-store" },
    });
  }

  const listed = await env.LOCATIONS.list({ prefix, limit: 200 });
  const texts = listed.keys.map((k) => ({
    id: k.name.slice(prefix.length),
    t: k.metadata && Number.isFinite(Number(k.metadata.t)) ? Number(k.metadata.t) : 0,
  }));
  logEvent("luin_list", { n: texts.length });
  return jsonResponse({ v: 1, texts }, { headers: { "Cache-Control": "no-store" } });
}

// ---- Lisäominaisuus: kansio soittolistana -----------------------------
// Tavallinen keikka (audio + tracks) ei käytä mitään tämän osion koodista.
//
// Keikaksi voi tallentaa audio-linkin ja biisilistan sijaan jaetun kansion
// linkin ({ title, folder }), Dropboxista tai Google Drivesta. Kansion
// äänitiedostot ovat kappaleita nimen mukaisessa (numero)järjestyksessä, ja
// jokainen alikansio on oma settinsä. Sisältö luetaan joka kerta, kun soitin
// avataan, joten kansioon lisätty tiedosto näkyy ilman uutta tallennusta.
// Käyttöönotto: soitin/kayttoonotto.html, liite.
//
// Dropbox: salaisuudet DROPBOX_APP_KEY, DROPBOX_APP_SECRET ja
// DROPBOX_REFRESH_TOKEN. Kansion pitää olla saman Dropbox-tilin omistama,
// jolle avain on tehty. Soittimelle annetaan Dropboxin tilapäiset suorat
// linkit (voimassa neljä tuntia), joten jokainen tiedosto maksaa pyynnön.
//
// Drive: salaisuus GOOGLE_API_KEY (Google Cloud -projektin API-avain, jossa
// Drive API on päällä). Kansion pitää olla jaettu "kaikki, joilla on linkki";
// kenen Drivessa se on, ei ole väliä. Tiedostojen linkit muodostetaan
// tunnisteista, joten ne eivät vanhene eikä avain päädy soittimelle.
const DROPBOX_FOLDER_RE = /^https:\/\/(?:www\.)?dropbox\.com\/(?:scl\/fo|sh)\/[^\s]+$/;
const DRIVE_FOLDER_RE = /^https:\/\/drive\.google\.com\/drive\/folders\/([A-Za-z0-9_-]{10,})(?:\?resourcekey=([A-Za-z0-9_-]+))?$/;
const FOLDER_RE = { test: (s) => DROPBOX_FOLDER_RE.test(s) || DRIVE_FOLDER_RE.test(s) };
const AUDIO_EXT_RE = /\.(mp3|m4a|mp4|aac|wav|flac|ogg|oga|opus|webm)$/i;
// Ilmaistasolla workerilla on 50 ulkoista pyyntöä kutsua kohden. Dropboxissa
// kuluu yksi kullekin tiedostolle ja muutama avaimelle ja listaukselle.
// Sama raja Drivelle, jotta ohje on yksi; soitin myös mittaa jokaisen
// tiedoston keston avautuessaan.
const MAX_FOLDER_FILES = 44;
const MAX_SUBFOLDERS = 20;

function folderError(code, detail) {
  const err = new Error(code);
  err.code = code;
  if (detail) err.detail = String(detail).slice(0, 300);
  return err;
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
const isAudioName = (name) => AUDIO_EXT_RE.test(name) && !name.startsWith(".");

// Yhteinen järjestys molemmille: juuren tiedostot ovat ensimmäinen setti,
// sitten alikansiot nimen mukaan. rootFiles: [{ name, ... }],
// subFolders: [{ name, files: [{ name, ... }] }]. Palauttaa kappalelistan,
// jossa tiedoston omat kentät ovat mukana (file).
function folderTracks(rootFiles, subFolders) {
  const groups = [];
  if (rootFiles.length) groups.push({ name: "", files: rootFiles.slice().sort(byName) });
  subFolders
    .filter((f) => f.files.length && f.name)
    .sort(byName)
    .forEach((f) => groups.push({ name: setTitle(f.name), files: f.files.slice().sort(byName) }));

  const list = [];
  groups.forEach((g, gi) => {
    g.files.forEach((file, fi) => {
      const o = { title: fileTitle(file.name).slice(0, 200), file };
      if (fi === 0 && gi > 0) o.set = true;
      if (fi === 0 && g.name) o.name = g.name.slice(0, 80);
      list.push(o);
    });
  });
  if (!list.length) throw folderError("folder_empty");
  if (list.length > MAX_FOLDER_FILES) throw folderError("too_many_files", list.length);
  return list;
}

function toPlayerFiles(list, urls) {
  return list.map((f, i) => {
    const o = { title: f.title, url: urls[i] };
    if (f.set) o.set = true;
    if (f.name) o.name = f.name;
    return o;
  });
}

function folderFiles(folderUrl, env, origin) {
  return DRIVE_FOLDER_RE.test(folderUrl) ? driveFolderFiles(folderUrl, env, origin) : dropboxFolderFiles(folderUrl, env);
}

// Virhekoodi, jolla avaimet puuttuvat, on palvelimen oma vika (500); muut
// ovat ulkoisen palvelun vastauksia (502).
function folderErrorStatus(code) {
  return /_not_configured$/.test(code) ? 500 : 502;
}

// -- Dropbox --

let dropboxToken = null; // { token, exp } – säilyy saman isolaatin kutsujen yli

async function dropboxAccessToken(env) {
  if (!env.DROPBOX_APP_KEY || !env.DROPBOX_APP_SECRET || !env.DROPBOX_REFRESH_TOKEN) {
    throw folderError("dropbox_not_configured");
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
  if (!res.ok) throw folderError("dropbox_auth", await res.text());
  const data = await res.json();
  if (!data || typeof data.access_token !== "string") throw folderError("dropbox_auth", "no access_token");
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
    throw folderError(res.status === 401 ? "dropbox_auth" : notFound ? "folder_not_found" : "dropbox_error",
      `${endpoint} ${res.status} ${text}`);
  }
  return JSON.parse(text);
}

async function dropboxFolderFiles(folderUrl, env) {
  const token = await dropboxAccessToken(env);
  const meta = await dropboxRpc(token, "sharing/get_shared_link_metadata", { url: folderUrl });
  if (!meta || meta[".tag"] !== "folder") throw folderError("not_a_folder");
  // path_lower on mukana vain, jos kansio on avaimen omistajan Dropboxissa.
  const root = meta.path_lower;
  if (typeof root !== "string" || !root) throw folderError("folder_not_owned");

  const entries = [];
  let page = await dropboxRpc(token, "files/list_folder", { path: root, recursive: true, limit: 2000 });
  entries.push(...page.entries);
  for (let i = 0; page.has_more && i < 3; i++) {
    page = await dropboxRpc(token, "files/list_folder/continue", { cursor: page.cursor });
    entries.push(...page.entries);
  }

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
    } else if (e[".tag"] === "file" && isAudioName(e.name)) {
      if (parts.length === 1) rootFiles.push(e);
      else if (parts.length === 2) {
        const key = `${root}/${parts[0]}`;
        const f = subFolders.get(key) || { files: [] };
        f.files.push(e);
        subFolders.set(key, f);
      }
    }
  }

  const list = folderTracks(rootFiles, [...subFolders.values()]);
  const links = await Promise.all(list.map((f) =>
    dropboxRpc(token, "files/get_temporary_link", { path: f.file.path_lower })));
  return toPlayerFiles(list, links.map((l) => l.link));
}

// Käyttöönoton tarkistus: /api/dropbox vastaa {"ok":true}, kun salaisuudet
// ovat paikallaan ja Dropbox hyväksyy ne. Mitään tiedostoja ei lueta.
async function dropboxCheck(env) {
  dropboxToken = null;
  await dropboxAccessToken(env);
}

// -- Google Drive --

const DRIVE_API = "https://www.googleapis.com/drive/v3/files";
const DRIVE_FOLDER_MIME = "application/vnd.google-apps.folder";

// Driven virhevastaus koodiksi. Väärä avain: 400 + API_KEY_INVALID (todettu).
// Rajapinta pois päältä: 403 + SERVICE_DISABLED / accessNotConfigured.
// Kansio, jota ei ole jaettu kaikille linkin saaneille, näkyy avaimelle 404:nä.
async function driveGet(path, params, key, resourceKeys) {
  const qs = new URLSearchParams({ ...params, key, supportsAllDrives: "true" });
  const headers = resourceKeys.length ? { "X-Goog-Drive-Resource-Keys": resourceKeys.join(",") } : {};
  const res = await fetch(`${DRIVE_API}${path}?${qs}`, { headers });
  const text = await res.text();
  if (!res.ok) {
    const code = /API_KEY_INVALID|API key not valid/.test(text) ? "drive_key_invalid"
      : /SERVICE_DISABLED|accessNotConfigured|has not been used/.test(text) ? "drive_api_disabled"
      : res.status === 404 ? "folder_not_found"
      : "drive_error";
    throw folderError(code, `${path} ${res.status} ${text}`);
  }
  return JSON.parse(text);
}

async function driveChildren(folderId, key, resourceKeys) {
  const files = [];
  let pageToken = "";
  for (let i = 0; i < 3; i++) {
    const params = {
      q: `'${folderId}' in parents and trashed = false`,
      fields: "nextPageToken,files(id,name,mimeType,resourceKey)",
      pageSize: "1000",
      includeItemsFromAllDrives: "true",
    };
    if (pageToken) params.pageToken = pageToken;
    const page = await driveGet("", params, key, resourceKeys);
    files.push(...(page.files || []));
    if (!page.nextPageToken) break;
    pageToken = page.nextPageToken;
  }
  return files;
}

// Soitin hakee Drive-tiedostot tämän workerin kautta (ks. Drive-tiedoston
// välitys), samoin kuin yhden tiedoston keikan Drive-linkin.
function driveFileUrl(file, origin) {
  return `${origin}/api/drive-file?id=${encodeURIComponent(file.id)}` +
    (file.resourceKey ? `&rk=${encodeURIComponent(file.resourceKey)}` : "");
}

const isDriveAudio = (f) => f.mimeType !== DRIVE_FOLDER_MIME &&
  (isAudioName(f.name) || (typeof f.mimeType === "string" && f.mimeType.startsWith("audio/")));

async function driveFolderFiles(folderUrl, env, origin) {
  const key = env.GOOGLE_API_KEY;
  if (!key) throw folderError("drive_not_configured");
  const m = DRIVE_FOLDER_RE.exec(folderUrl);
  const rootId = m[1];
  const rk = m[2] ? [`${rootId}/${m[2]}`] : [];

  const meta = await driveGet(`/${rootId}`, { fields: "id,name,mimeType" }, key, rk);
  if (!meta || meta.mimeType !== DRIVE_FOLDER_MIME) throw folderError("not_a_folder");

  const children = await driveChildren(rootId, key, rk);
  const rootFiles = children.filter(isDriveAudio);
  const folders = children.filter((f) => f.mimeType === DRIVE_FOLDER_MIME).sort(byName).slice(0, MAX_SUBFOLDERS);
  const subFolders = await Promise.all(folders.map(async (f) => {
    const keys = f.resourceKey ? rk.concat(`${f.id}/${f.resourceKey}`) : rk;
    const files = (await driveChildren(f.id, key, keys)).filter(isDriveAudio);
    return { name: f.name, files };
  }));

  const list = folderTracks(rootFiles, subFolders);
  return toPlayerFiles(list, list.map((f) => driveFileUrl(f.file, origin)));
}

// Käyttöönoton tarkistus: /api/drive. Kysytään olematonta tiedostoa: kelvollinen
// avain saa vastaukseksi 404, väärä avain 400 ja pois päältä oleva Drive API 403.
async function driveCheck(env) {
  if (!env.GOOGLE_API_KEY) throw folderError("drive_not_configured");
  try {
    await driveGet("/soitin-tarkistus-0000000000", { fields: "id" }, env.GOOGLE_API_KEY, []);
  } catch (err) {
    if (err.code !== "folder_not_found") throw err;
  }
}

async function handleFolderCheck(check, env) {
  try {
    await check(env);
    return jsonResponse({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    const code = err && err.code ? err.code : "folder_error";
    logEvent("folder_check", { code, detail: err && err.detail });
    return errorResponse(code, folderErrorStatus(code));
  }
}

// ---- Drive-tiedoston välitys ------------------------------------------
// Google palauttaa Driven latauslinkistä 403:n, kun selain hakee sen toiselta
// sivustolta (otsake Sec-Fetch-Site: cross-site, mitattu 14.10.2026). Siksi
// soitin hakee Drive-äänitiedoston tämän reitin kautta: worker hakee tiedoston
// ilman selaimen otsakkeita ja välittää kelauksen (Range) sellaisenaan.
// Vain äänitiedostot kelpaavat, jottei reitti ole yleinen välityspalvelu.
// Dropbox-linkit ja tavallinen keikka eivät käytä tätä.
const DRIVE_ID_RE = /^[A-Za-z0-9_-]{10,}$/;
const PASS_HEADERS = ["content-type", "content-length", "content-range", "accept-ranges", "last-modified", "etag"];

async function handleDriveFile(req) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id") || "";
  const rk = url.searchParams.get("rk") || "";
  if (!DRIVE_ID_RE.test(id) || (rk && !DRIVE_ID_RE.test(rk))) return errorResponse("bad_id", 400);

  const upstream = "https://drive.usercontent.google.com/download?id=" + encodeURIComponent(id) +
    "&export=download&confirm=t" + (rk ? "&resourcekey=" + encodeURIComponent(rk) : "");
  const headers = {};
  const range = req.headers.get("Range");
  if (range) headers.Range = range;
  const res = await fetch(upstream, { method: req.method === "HEAD" ? "HEAD" : "GET", headers });

  const type = (res.headers.get("content-type") || "").toLowerCase();
  if (!(res.status === 200 || res.status === 206 || res.status === 416)) {
    logEvent("drive_file_error", { status: res.status });
    return errorResponse(res.status === 404 ? "not_found" : "drive_file_error", res.status === 404 ? 404 : 502);
  }
  if (res.status !== 416 && !/^(audio\/|video\/mp4)/.test(type)) {
    logEvent("drive_file_type", { type });
    return errorResponse("not_audio", 415);
  }
  const out = new Headers();
  PASS_HEADERS.forEach((h) => { const v = res.headers.get(h); if (v) out.set(h, v); });
  out.set("Cache-Control", "private, max-age=3600");
  return new Response(req.method === "HEAD" ? null : res.body, { status: res.status, headers: out });
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
      if (url.pathname === "/api/drive-file") {
        return corsify(await handleDriveFile(req), {
          origin,
          requestHeaders: acrHeaders,
          allowedOrigins,
        });
      }
      if (url.pathname === "/api/dropbox" || url.pathname === "/api/drive") {
        const check = url.pathname === "/api/drive" ? driveCheck : dropboxCheck;
        return corsify(await handleFolderCheck(check, env), {
          origin,
          requestHeaders: acrHeaders,
          allowedOrigins,
        });
      }
      if (url.pathname === "/api/luin") {
        return corsify(await handleLuin(req, env), {
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
