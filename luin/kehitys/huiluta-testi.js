// Huiluta laatikkoon -testi (käyttäjän pyyntö 18.11.2026). Ajo repon juuressa:
//   NODE_PATH=$(npm root -g) node luin/kehitys/huiluta-testi.js [kuvakansio]
// Kaksi laitetta (erilliset selainkontekstit) ja workerin oikea koodi muistissa olevalla KV:llä kuten posti-testi.js.
// Tarkistaa: virheet ilman lausetta ja lukukoodilla, pinon tekstin runko laatikkoon samalla tunnuksella, merkinnät
// perässä vain valittuina, oma lähetys ei palaa omaan pinoon (eikä nosta cellarin campihyllystöstä), toinen laite saa
// tekstin ja merkinnät, osoitteesta avattu teksti kulkee osoite:-rivin kanssa, merkinnät osuvat samoihin kohtiin ja
// saman osoitteen avaus toisella laitteella ei tee toista kappaletta; 429:n viesti.
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { chromium } = require('playwright');

const JUURI = path.resolve(__dirname, '../..');
const KUVAT = process.argv[2];
const TYYPIT = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.md': 'text/markdown', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png' };
const API = 'https://tusinasaa-worker.ollijuutilainen.workers.dev/api/luin';
const KOODI = 'torikaffeillaonhemmetinmukavaa';

let virheita = 0;
function tulos(nimi, ok, tieto) { if (!ok) virheita++; console.log((ok ? 'OK   ' : 'VIKA ') + nimi + (tieto ? ' – ' + tieto : '')); }

async function lataaWorker() {
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'luin-worker-')), 'index.mjs');
  fs.writeFileSync(f, fs.readFileSync(path.join(JUURI, 'worker/src/index.js')));
  return (await import(f)).default;
}
function muistiKV() {
  const m = new Map();
  return {
    m,
    async put(k, v, o) { m.set(k, { v: String(v), meta: o && o.metadata }); },
    async get(k) { return m.has(k) ? m.get(k).v : null; },
    async list({ prefix, limit }) {
      return { keys: [...m.keys()].filter(k => k.startsWith(prefix)).slice(0, limit || 1000).map(k => ({ name: k, metadata: m.get(k).meta })) };
    }
  };
}

(async () => {
  const palvelin = http.createServer((q, r) => {
    const p = path.join(JUURI, decodeURIComponent(q.url.split(/[?#]/)[0]));
    if (!p.startsWith(JUURI) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'Content-Type': TYYPIT[path.extname(p)] || 'application/octet-stream' });
    fs.createReadStream(p).pipe(r);
  });
  await new Promise(v => palvelin.listen(0, v));
  const OSOITE = 'http://localhost:' + palvelin.address().port + '/';
  const worker = await lataaWorker();
  const KV = muistiKV(), env = { LOCATIONS: KV, ALLOWED_ORIGINS: OSOITE.replace(/\/$/, '') };
  let pakota429 = false;
  async function workerille(route) {
    const q = route.request(), h = await q.allHeaders();
    if (pakota429 && q.method() === 'POST') {
      pakota429 = false;
      return route.fulfill({ status: 429, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'rate_limited' }) });
    }
    const req = new Request(q.url(), { method: q.method(), headers: h, body: ['GET', 'HEAD', 'OPTIONS'].includes(q.method()) ? undefined : q.postData() });
    const res = await worker.fetch(req, env, {});
    const otsakkeet = {};
    res.headers.forEach((v, k) => { otsakkeet[k] = v; });
    await route.fulfill({ status: res.status, headers: otsakkeet, body: Buffer.from(await res.arrayBuffer()) });
  }
  const KANT = fs.readFileSync(path.join(JUURI, 'luin/tekstit/kant-ja-elainetiikka.md'), 'utf8');
  const PID = 'p-kant-ja-elainetiikka', AV = 'kant-ja-elainetiikka';

  const selain = await chromium.launch();
  async function laite(nimi) {
    const ctx = await selain.newContext({ viewport: { width: 412, height: 860 }, deviceScaleFactor: 1 });
    await ctx.route(API + '*', workerille);
    await ctx.route(/fonts\.googleapis|wikipedia|wiktionary/, r => r.abort());
    const sivu = await ctx.newPage();
    sivu.on('pageerror', e => tulos(nimi + ': ei sivuvirheitä', false, e.message));
    return sivu;
  }
  const a = await laite('A'), b = await laite('B');
  const odota = ms => new Promise(v => setTimeout(v, ms));
  const LS = (s, k) => s.evaluate(k => JSON.parse(localStorage.getItem(k)), k);
  const nimike = async (s, id) => (await LS(s, 'luin-lista')).filter(e => e.id === id)[0];
  async function lista(s) {
    await s.evaluate(() => { location.hash = ''; });
    await s.waitForFunction(() => !document.querySelector('#lista').hidden);
  }
  // Valikon Huiluta laatikkoon ja lopputulos napin tekstinä.
  async function huiluta(s, id) {
    await s.click(`#nimikkeet button.jako[data-id="${id}"]`);
    const nappi = s.locator('#pop button[data-k="huiluta"]');
    const ennen = await nappi.textContent();
    await nappi.click();
    await s.waitForFunction(() => { const n = document.querySelector('#pop button[data-k="huiluta"]'); return n && n.textContent !== 'Huilutetaan…' && n.textContent !== 'huiluta laatikkoon'; }, null, { timeout: 5000 }).catch(() => {});
    const t = await nappi.textContent();
    if (KUVAT) await s.screenshot({ path: path.join(KUVAT, 'huiluta-' + id.slice(0, 12) + '-' + Date.now() + '.png') });
    await s.keyboard.press('Escape');
    await s.evaluate(() => { const p = document.querySelector('#pop'); if (p && !p.hidden) document.body.click(); });
    return { ennen, t };
  }
  async function asetaLause(s) {
    await s.click('#lista .ratas');
    await s.click('#laatikko-osio summary');
    await s.fill('#laatikko-koodi', KOODI);
    await s.click('#laatikko-tallenna');
    await s.waitForFunction(() => /tallennettu/.test(document.querySelector('#laatikko-tieto').textContent));
  }
  async function suljeAsetukset(s) { await s.goto(s.url().split('#')[0]); await s.waitForFunction(() => !document.querySelector('#lista').hidden); }

  // --- 1. Laite A: teksti pinoon latomon tapaan, merkinnät ---
  await a.goto(OSOITE + 'luin.html');
  await a.evaluate(md => localStorage.setItem('luin-tuonti', JSON.stringify({ md, nimi: 'kant' })), KANT);
  await a.goto(OSOITE + 'luin.html#tuo');
  await a.waitForFunction(() => window.__luin.nyt() && window.__luin.nyt().blocks.length > 20);
  const merkA = await a.evaluate(() => {
    const L = window.__luin, n = L.nyt();
    const b1 = n.txt.findIndex((t, i) => i > 5 && t && t.length > 120), b2 = n.txt.findIndex((t, i) => i > b1 + 3 && t && t.length > 120);
    n.merk.al.push({ id: 'a1', segs: [{ b: b1, s: 0, e: 30, x: n.txt[b1].slice(0, 30) }], t: Date.now(), n: 'A:n kirjaus' });
    n.merk.al.push({ id: 'a2', segs: [{ b: b2, s: 0, e: 25, x: n.txt[b2].slice(0, 25) }], t: Date.now() });
    n.merk.km.push({ id: 'k1', b: b2, o: 0, s: n.txt[b2].slice(0, 40), t: Date.now(), osio: '' });
    L.tallennaMerkit();
    return { b1, b2, x1: n.txt[b1].slice(0, 30) };
  });
  await lista(a);

  // --- 2. Virheet: ei lausetta, lukukoodi ---
  let h = await huiluta(a, PID);
  tulos('valikossa huiluta laatikkoon', h.ennen === 'huiluta laatikkoon', h.ennen);
  tulos('ilman lausetta: neuvo', h.t === 'Anna ensin laatikkolause pinon postihuiluun.', h.t);
  await a.evaluate(() => localStorage.setItem('luin-laatikko', JSON.stringify('lyhytkoodi')));
  await a.reload(); await a.waitForFunction(() => !document.querySelector('#lista').hidden);
  h = await huiluta(a, PID);
  tulos('lukukoodilla: vain lukea', /voi vain lukea/.test(h.t), h.t);
  tulos('virheissä laatikko tyhjä', KV.m.size === 0, [...KV.m.keys()].join());
  await a.evaluate(() => localStorage.removeItem('luin-laatikko'));
  await a.reload(); await a.waitForFunction(() => !document.querySelector('#lista').hidden);

  // --- 3. Lause ja huilutus ilman merkintäpostia ---
  await asetaLause(a);
  await suljeAsetukset(a);
  pakota429 = true;
  h = await huiluta(a, PID);
  tulos('429: viesti, ei kirjoitusta', /Liian monta lähetystä/.test(h.t) && !KV.m.has('luin:' + KOODI + ':' + AV), h.t);
  h = await huiluta(a, PID);
  const md1 = KV.m.get('luin:' + KOODI + ':' + AV);
  tulos('huilutettu: kuittaus ja merkinnät jäivät', /^Huilutettu klo \d+\.\d\d\. Merkinnät jäivät: Huiluta myös merkintöjä ei ole valittu\.$/.test(h.t), h.t);
  tulos('laatikossa teksti samalla tunnuksella, tavulleen sama', md1 && md1.v === KANT, md1 ? md1.v.length + ' / ' + KANT.length : 'ei');
  tulos('merkinnät eivät lähteneet', !KV.m.has('luinm:' + KOODI + ':' + AV));
  const nahdyt = await LS(a, 'luin-laatikko-nahdyt');
  tulos('oma lähetys kirjattu nähdyksi', nahdyt && nahdyt[KOODI + ':' + AV] === md1.meta.t, JSON.stringify(nahdyt));

  // --- 4. Merkintäposti päälle, huilutus cellarin campihyllystöstä ---
  await a.click('#lista .ratas');
  await a.click('#laatikko-osio summary');
  await a.click('#posti-paalla button');
  await suljeAsetukset(a);
  await a.evaluate(id => { const l = JSON.parse(localStorage.getItem('luin-lista')); l.filter(e => e.id === id)[0].luettu = Date.now(); localStorage.setItem('luin-lista', JSON.stringify(l)); }, PID);
  await a.goto(OSOITE + 'luin.html#arkisto'); await a.reload();
  await a.waitForSelector(`#nimikkeet button.jako[data-id="${PID}"]`);
  h = await huiluta(a, PID);
  tulos('cellarista: huilutettu, merkinnät seuraavat', /^Huilutettu klo \d+\.\d\d\. Merkinnät seuraavat\.$/.test(h.t), h.t);
  for (let i = 0; i < 40 && !KV.m.has('luinm:' + KOODI + ':' + AV); i++) await odota(100);
  const m1 = KV.m.has('luinm:' + KOODI + ':' + AV) && JSON.parse(KV.m.get('luinm:' + KOODI + ':' + AV).v);
  tulos('merkinnät laatikossa', m1 && m1.al.length === 2 && m1.km.length === 1, m1 ? JSON.stringify({ al: m1.al.length, km: m1.km.length }) : 'ei');
  await a.evaluate(() => window.__luin.haeLaatikko());
  await odota(300);
  const eA = await nimike(a, PID);
  tulos('A: oma huilutus ei palaa omaan pinoon', eA && eA.src === 'paikallinen' && eA.luettu > 0 && (await LS(a, 'luin-lista')).length === 1, eA && JSON.stringify({ src: eA.src, luettu: !!eA.luettu }));

  // --- 5. Laite B: teksti ja merkinnät ---
  await b.goto(OSOITE + 'luin.html');
  await b.click('#lisaa-ots');
  await b.fill('#lisaa-syote', KOODI);
  await b.press('#lisaa-syote', 'Enter');
  await b.waitForFunction(() => /kantautui/.test(document.querySelector('#viesti').textContent));
  for (let i = 0; i < 40; i++) { if (await LS(b, 'luin-merkit:' + PID)) break; await odota(100); }
  const eB = await nimike(b, PID), mdB = await LS(b, 'luin-teksti:' + PID), mB = await LS(b, 'luin-merkit:' + PID);
  tulos('B: teksti pinossa samalla tunnuksella', eB && eB.src === 'laatikko' && !eB.luettu && mdB === KANT, eB && eB.id);
  tulos('B: merkinnät tulivat', mB && mB.al.length === 2 && mB.km.length === 1 && mB.al.some(x => x.n === 'A:n kirjaus'), mB ? JSON.stringify({ al: mB.al.length, km: mB.km.length }) : 'ei');
  await b.goto(OSOITE + 'luin.html#id=' + PID);
  await b.waitForFunction(() => window.__luin.nyt() && window.__luin.nyt().blocks.length > 20);
  const osuu = await b.evaluate(() => { const n = window.__luin.nyt(); return n.merk.al.every(h => h.segs.every(s => n.txt[s.b].slice(s.s, s.e) === s.x)); });
  tulos('B: alleviivaukset osuvat samoihin kohtiin', osuu);

  // --- 6. Osoitteesta avattu teksti ---
  const U = 'luin/mika-on-markdown.md';
  await a.goto(OSOITE + 'luin.html#u=' + U);
  await a.waitForFunction(() => window.__luin.nyt() && window.__luin.nyt().blocks.length > 5);
  const uA = await a.evaluate(() => {
    const L = window.__luin, n = L.nyt(), bb = n.txt.findIndex((t, i) => i > 2 && t && t.length > 80);
    n.merk.al.push({ id: 'u1', segs: [{ b: bb, s: 4, e: 40, x: n.txt[bb].slice(4, 40) }], t: Date.now() });
    L.tallennaMerkit();
    return { id: n.e.id, bb, x: n.txt[bb].slice(4, 40) };
  });
  await lista(a);
  h = await huiluta(a, uA.id);
  tulos('u-teksti huilutettu', /^Huilutettu klo/.test(h.t), uA.id + ': ' + h.t);
  const uKV = KV.m.get('luin:' + KOODI + ':' + uA.id);
  tulos('u-teksti laatikossa osoite:-rivin kanssa', uKV && uKV.v.includes('osoite: ' + OSOITE + U), uKV ? uKV.v.slice(0, 120).replace(/\n/g, ' | ') : 'ei');
  const mdOmaA = await LS(a, 'luin-teksti:' + uA.id);
  const tied = fs.readFileSync(path.join(JUURI, U), 'utf8');
  tulos('A: oma kappale ennallaan (osoite vain lähetettyyn)', !/^---\nosoite:/.test(mdOmaA) && mdOmaA === tied);
  for (let i = 0; i < 40 && !KV.m.has('luinm:' + KOODI + ':' + uA.id); i++) await odota(100);
  await b.goto(OSOITE + 'luin.html');
  await b.evaluate(() => window.__luin.haeLaatikko());
  for (let i = 0; i < 40; i++) { if (await LS(b, 'luin-merkit:p-' + uA.id)) break; await odota(100); }
  const uB = await nimike(b, 'p-' + uA.id);
  tulos('B: u-teksti pinossa lähteen osoitteen kanssa', uB && uB.osoite === OSOITE + U, uB && uB.osoite);
  await b.goto(OSOITE + 'luin.html');
  await b.click(`#nimikkeet button.jako[data-id="p-${uA.id}"]`);
  const valikkoB = await b.$$eval('#pop button[data-k]', bs => bs.map(x => x.dataset.k).join());
  tulos('B: valikossa kopioi linkki', /,linkki,/.test(valikkoB), valikkoB);
  await b.keyboard.press('Escape');
  await b.goto(OSOITE + 'luin.html#u=' + U);
  await b.waitForFunction(id => window.__luin.nyt() && window.__luin.nyt().e.id === id && window.__luin.nyt().blocks.length > 5, 'p-' + uA.id, { timeout: 8000 }).catch(() => {});
  const avB = await b.evaluate(() => { const n = window.__luin.nyt(); return { id: n.e.id, al: n.merk.al.map(h => h.segs.every(s => n.txt[s.b].slice(s.s, s.e) === s.x)) }; });
  const listaB = (await LS(b, 'luin-lista')).map(e => e.id);
  tulos('B: saman osoitteen avaus avaa huilutetun eikä tee toista', avB.id === 'p-' + uA.id && !listaB.includes(uA.id), JSON.stringify({ auki: avB.id, lista: listaB }));
  tulos('B: u-tekstin alleviivaus osuu samaan kohtaan (osoite: ei siirrä lohkoja)', avB.al.length === 1 && avB.al[0], JSON.stringify(avB.al));

  // --- 7. Sama osoite jo auki toisella laitteella: huilutus päivittää sen eikä tee p-u-kappaletta ---
  const U2 = 'luin/tekstit/dialectic-of-enlightenment.md';
  await b.goto(OSOITE + 'luin.html#u=' + U2);
  await b.waitForFunction(u => window.__luin.nyt() && window.__luin.nyt().e.url === u && window.__luin.nyt().blocks.length > 2, U2);
  const u2 = await b.evaluate(() => window.__luin.nyt().e.id);
  await a.goto(OSOITE + 'luin.html#u=' + U2);
  await a.waitForFunction(u => window.__luin.nyt() && window.__luin.nyt().e.url === u && window.__luin.nyt().blocks.length > 2, U2);
  await lista(a);
  h = await huiluta(a, u2);
  tulos('u2 huilutettu', /^Huilutettu klo/.test(h.t), h.t);
  await b.goto(OSOITE + 'luin.html');
  await b.evaluate(() => window.__luin.haeLaatikko());
  await odota(300);
  const lista2 = (await LS(b, 'luin-lista')).map(e => e.id), e2 = await nimike(b, u2);
  tulos('B: olemassa oleva u-teksti päivittyi, ei p-u-kappaletta', !lista2.includes('p-' + u2) && e2 && e2.src === 'laatikko' && e2.url === U2,
    JSON.stringify({ lista: lista2, src: e2 && e2.src, url: e2 && e2.url }));

  await selain.close(); palvelin.close();
  console.log(virheita ? virheita + ' virhettä' : 'Kaikki kunnossa.');
  process.exit(virheita ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
