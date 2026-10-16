// Keikkasoittimen pikakäyttöönotto, osa 2 (soitin/pikakayttoonotto.html). asenna.sh lataa
// Node.js:n ja Wranglerin kansioon ~/.soitin ja ajaa tämän.
//
// Wrangler kirjautuu Cloudflareen selaimessa (OAuth), joten API-avainta ei tehdä eikä
// tallenneta avainnippuun. Kirjautumistunnistetta käytetään vain tämän ajon aikana
// Cloudflaren rajapintaan (tietokanta ja workers.dev-osoite), eikä sitä tulosteta.
//
// Ajo on toistettava: tehdyt vaiheet tunnistetaan ja ohitetaan, ja worker viedään aina
// uudelleen, joten sama komento myös päivittää workerin.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";

const DIR = path.join(os.homedir(), ".soitin");
const CONFIG = path.join(DIR, "wrangler.json");
const VALMIS = path.join(DIR, ".valmis");
const WRANGLER = path.join(DIR, "node_modules", "wrangler", "bin", "wrangler.js");
// Workerin nimi näkyy keikkalinkeissä: soitin/#tunnus@soitin.<osoite>. Tietokannan nimi on
// sama kuin kayttoonotto.html:n reitillä, joten sillä tehty tietokanta otetaan käyttöön.
const WORKER = "soitin";
const KV_TITLE = "soitin";
// Testeissä rajapinnan voi korvata; Wrangler lukee saman muuttujan.
const API = process.env.CLOUDFLARE_API_BASE_URL || "https://api.cloudflare.com/client/v4";
const GENERATOR = "https://ollijuutilainen.github.io/soitin/uusi.html";

const vaihe = (s) => console.log(`\n\x1b[1m${s}\x1b[0m`);
function virhe(s) {
  console.error(`\n\x1b[31m${s}\x1b[0m`);
  process.exit(1);
}

// Vastaukset jonoon: putkesta luettaessa (testit) rivit tulevat kerralla ennen kysymyksiä.
// Kysely suljetaan ennen Wranglerin käynnistystä, jotta pääte ei jää raakatilaan.
let rl = null, odottaja = null, loppui = false;
const rivit = [];
function kysy(s) {
  if (loppui) {
    process.stdout.write(s);
    return Promise.resolve(rivit.length ? rivit.shift() : null);
  }
  if (!rl) {
    rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.on("line", (l) => {
      if (odottaja) { const o = odottaja; odottaja = null; o(l); } else rivit.push(l);
    });
    rl.on("close", () => {
      loppui = true;
      if (odottaja) { const o = odottaja; odottaja = null; o(null); }
    });
  }
  rl.setPrompt(s);
  rl.prompt();
  if (rivit.length) return Promise.resolve(rivit.shift());
  if (loppui) return Promise.resolve(null);
  return new Promise((r) => { odottaja = r; });
}
async function vastaus(s) {
  const v = await kysy(s);
  if (v === null) virhe("\nVastaus jäi saamatta. Aja asennuskomento uudelleen.");
  return v;
}
function lopetaKysely() {
  if (!rl) return;
  const r = rl;
  rl = null;
  r.removeAllListeners("close");
  r.close();
}

function wrangler(args, { capture = false } = {}) {
  const r = spawnSync(process.execPath, [WRANGLER, ...args], {
    cwd: DIR,
    stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
    encoding: "utf8",
    env: { ...process.env, WRANGLER_SEND_METRICS: "false" }
  });
  if (r.error) virhe("Wranglerin käynnistys epäonnistui: " + r.error.message);
  return r;
}

// JSON-tulosteen edessä voi olla Wranglerin ilmoituksia.
function json(text) {
  const i = (text || "").indexOf("{"), j = (text || "").lastIndexOf("}");
  try { return JSON.parse(text.slice(i, j + 1)); } catch (e) { return null; }
}

function whoami() {
  const r = wrangler(["whoami", "--json"], { capture: true });
  const w = r.status === 0 ? json(r.stdout) : null;
  return w && w.loggedIn ? w : null;
}

let token = "";
async function cf(method, p, body) {
  let res;
  try {
    res = await fetch(API + p, {
      method,
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined
    });
  } catch (e) {
    virhe("Cloudflaren rajapintaan ei saatu yhteyttä: " + e.message);
  }
  const j = await res.json().catch(() => null);
  if (!j) virhe(`Cloudflaren rajapinta vastasi odottamattomasti (${method} ${p}, HTTP ${res.status}).`);
  return j;
}
const koodit = (j) => (j.errors || []).map((e) => e.code);
const viesti = (j) => (j.errors || []).map((e) => `${e.code} ${e.message}`).join("; ") || "tuntematon virhe";

let asetukset = {};
try { asetukset = JSON.parse(fs.readFileSync(CONFIG, "utf8")); } catch (e) { /* ensimmäinen ajo */ }

// ---- 1. Kirjautuminen ja tili --------------------------------------------

vaihe("1/5 Kirjautuminen Cloudflareen");
let kayttaja = whoami();
if (!kayttaja) {
  console.log("Selaimeen aukeaa Cloudflaren sivu. Kirjaudu, jos se kysyy, ja paina Allow.");
  console.log("Palaa sitten tähän ikkunaan.\n");
  if (wrangler(["login"]).status === 0) kayttaja = whoami();
  if (!kayttaja) virhe("Kirjautuminen ei onnistunut. Aja asennuskomento uudelleen.");
}
console.log("Kirjautunut: " + (kayttaja.email || "(sähköposti ei näy)"));

const tilit = kayttaja.accounts || [];
let tili = tilit.find((t) => t.id === asetukset.account_id) || (tilit.length === 1 ? tilit[0] : null);
if (!tili && tilit.length > 1) {
  console.log("Käyttäjälläsi on useampi Cloudflare-tili:");
  tilit.forEach((t, i) => console.log(`  ${i + 1}. ${t.name}`));
  while (!tili) tili = tilit[Number(await vastaus(`Mille tilille soitin tehdään (1–${tilit.length})? `)) - 1];
}
if (!tili) virhe("Kirjautuneella käyttäjällä ei ole Cloudflare-tiliä.");

token = (json(wrangler(["auth", "token", "--json"], { capture: true }).stdout) || {}).token;
if (!token) virhe("Wrangler ei antanut kirjautumistunnistetta. Aja asennuskomento uudelleen.");

// ---- 2. Tietokanta -------------------------------------------------------

vaihe("2/5 Tietokanta");
const lista = await cf("GET", `/accounts/${tili.id}/storage/kv/namespaces?per_page=100`);
if (!lista.success || !Array.isArray(lista.result)) virhe("Tietokantojen haku epäonnistui: " + viesti(lista));
const vanha = ((asetukset.kv_namespaces || [])[0] || {}).id;
let kv = lista.result.find((n) => n.id === vanha) || lista.result.find((n) => n.title === KV_TITLE);
if (kv) {
  console.log(`Käytetään tietokantaa ${kv.title}.`);
} else {
  const luotu = await cf("POST", `/accounts/${tili.id}/storage/kv/namespaces`, { title: KV_TITLE });
  if (!luotu.success) virhe("Tietokannan luonti epäonnistui: " + viesti(luotu));
  kv = luotu.result;
  console.log(`Tehtiin tietokanta ${kv.title}.`);
}

// Sama päiväys kuin Ollin workerissa (wrangler.toml). Kytkennän nimi LOCATIONS on
// workerin koodissa.
asetukset = {
  name: WORKER,
  main: "worker/index.js",
  compatibility_date: "2025-09-28",
  account_id: tili.id,
  workers_dev: true,
  kv_namespaces: [{ binding: "LOCATIONS", id: kv.id }]
};
fs.writeFileSync(CONFIG, JSON.stringify(asetukset, null, 2) + "\n");

// ---- 3. workers.dev-osoite -----------------------------------------------

vaihe("3/5 workers.dev-osoite");
let sub = "";
const s = await cf("GET", `/accounts/${tili.id}/workers/subdomain`);
if (s.success && s.result && s.result.subdomain) {
  sub = s.result.subdomain;
} else if (koodit(s).includes(10007)) {
  console.log("Tilillä ei vielä ole workers.dev-osoitetta. Valitse sille lyhyt nimi. Se näkyy");
  console.log("keikkalinkkien lopussa, esimerkiksi …/soitin/#tunnus@soitin.nimi.");
  while (!sub) {
    const nimi = (await vastaus("Nimi: ")).trim().toLowerCase();
    if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(nimi)) {
      console.log("Nimessä saa olla vain a–z, 0–9 ja väliviiva, ei väliviivaa alussa eikä lopussa.");
      continue;
    }
    const p = await cf("PUT", `/accounts/${tili.id}/workers/subdomain`, { subdomain: nimi });
    if (p.success) sub = (p.result && p.result.subdomain) || nimi;
    else if (koodit(p).includes(10031)) console.log("Nimi on jo jonkun muun käytössä. Kokeile toista.");
    else virhe("Osoitteen rekisteröinti epäonnistui: " + viesti(p));
  }
} else {
  virhe("workers.dev-osoitteen haku epäonnistui: " + viesti(s));
}
const host = `${WORKER}.${sub}`;
console.log(`Workerin osoite: https://${host}.workers.dev`);
// soitin.sh näyttää tästä kirjanmerkin ja tarkistaa Drive-avaimen.
fs.writeFileSync(path.join(DIR, "osoite"), host + "\n");

// ---- 4. Worker -----------------------------------------------------------

vaihe("4/5 Workerin vienti Cloudflareen");
lopetaKysely();
if (wrangler(["deploy"]).status !== 0) {
  virhe("Workerin vienti epäonnistui. Virhe on yllä. Jos Wrangler kehottaa päivittämään itsensä, se on\n" +
    "väärä hälytys; älä päivitä. Aja asennuskomento uudelleen.");
}

// ---- 5. Tarkistus --------------------------------------------------------

vaihe("5/5 Tarkistus");
const testi = `https://${host}.workers.dev/api/gig?k=testi1`;
process.stdout.write("Odotetaan, että worker vastaa");
let vastaa = false;
for (let i = 0; i < 36 && !vastaa; i++) {
  let b = null;
  try { b = await (await fetch(testi, { cache: "no-store" })).json(); } catch (e) { /* osoite ei vielä näy */ }
  if (b && b.error === "not_found") vastaa = true;
  else if (b && b.error === "bad_payload") virhe("\nWorker vastaa, mutta ei löydä tietokantaa. Aja asennuskomento uudelleen.");
  else {
    process.stdout.write(".");
    await new Promise((r) => setTimeout(r, 5000));
  }
}
console.log(vastaa ? " vastaa." : " ei vielä vastaa.");
if (!vastaa) {
  console.log("Uuden osoitteen näkyminen voi kestää muutaman minuutin. Avaa myöhemmin selaimessa");
  console.log(`  ${testi}`);
  console.log('Vastauksen pitää olla {"error":"not_found"}.');
}

const kirjanmerkki = `${GENERATOR}#w=${host}&tapa=pika`;
console.log(`\n\x1b[1mValmis.\x1b[0m Keikkageneraattori omilla asetuksillasi (tallenna kirjanmerkiksi):`);
console.log(`  ${kirjanmerkki}`);
console.log("Kirjanmerkin ja muut komennot näet myöhemmin komennolla ~/.soitin/soitin");
if (!fs.existsSync(VALMIS)) {
  fs.writeFileSync(VALMIS, "");
  if (process.platform === "darwin") spawnSync("open", [kirjanmerkki]);
}
