// Postilaatikon ja merkintäpostin selaintesti. Ajo repon juuressa:
//   NODE_PATH=$(npm root -g) node luin/kehitys/posti-testi.js [kuvakansio]
// Kaksi laitetta (erilliset selainkontekstit, eri localStorage) ja yksi laatikko: workerin oikea koodi
// (worker/src/index.js) muistissa olevalla KV:llä, johon sivujen kutsut reititetään. Tarkistaa: koodin siistiminen ja
// 24 merkin alaraja (Luin, Latomo), pikaohje, asetusten kerrokset (koodi → Lähetä myös merkinnät → lajit), lähetys
// lukulistaan palattaessa, vastaanotto toisessa laitteessa (alleviivaus, kirjaus, kirjanmerkki, lukukohta), poiston
// kulku poistomerkintänä, tekstikohtainen valinta ja Latomon Lähetä myös merkinnät.
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

// Worker ES-moduulina väliaikaiskansiosta (repossa ei ole package.jsonia, joten .js olisi CommonJS:ää).
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
  const kutsut = [];
  async function workerille(route) {
    const q = route.request(), h = await q.allHeaders();
    const req = new Request(q.url(), { method: q.method(), headers: h, body: ['GET', 'HEAD', 'OPTIONS'].includes(q.method()) ? undefined : q.postData() });
    const res = await worker.fetch(req, env, {});
    kutsut.push(q.method() + ' ' + q.url().replace(API, '') + ' ' + res.status);
    const otsakkeet = {};
    res.headers.forEach((v, k) => { otsakkeet[k] = v; });
    await route.fulfill({ status: res.status, headers: otsakkeet, body: Buffer.from(await res.arrayBuffer()) });
  }
  const KANT = fs.readFileSync(path.join(JUURI, 'luin/tekstit/kant-ja-elainetiikka.md'), 'utf8');
  // Teksti laatikkoon kuten Latomosta (worker suoraan).
  const r0 = await worker.fetch(new Request(API, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: env.ALLOWED_ORIGINS },
    body: JSON.stringify({ l: KOODI, id: 'kant-ja-elainetiikka', md: KANT }) }), env, {});
  tulos('worker: teksti laatikkoon', r0.status === 200);

  const selain = await chromium.launch();
  async function laite(nimi) {
    const ctx = await selain.newContext({ viewport: { width: 412, height: 860 }, deviceScaleFactor: 1 });
    await ctx.route(API + '*', workerille);
    await ctx.route(/fonts\.googleapis|wikipedia|wiktionary/, r => r.abort());
    const sivu = await ctx.newPage();
    sivu.on('pageerror', e => tulos(nimi + ': ei sivuvirheitä', false, e.message));
    return { ctx, sivu };
  }
  const A = await laite('A'), B = await laite('B');
  const odota = ms => new Promise(v => setTimeout(v, ms));
  const LS = (s, k) => s.evaluate(k => JSON.parse(localStorage.getItem(k)), k);

  // --- 1. Koodin syöttö Luinin asetuksissa: alaraja, siistiminen, pikaohje, kerrokset ---
  const a = A.sivu;
  await a.goto(OSOITE + 'luin.html');
  await a.click('#lista .ratas');
  await a.click('#laatikko-osio summary');
  const kerros0 = await a.evaluate(() => !document.querySelector('#posti-merk').hidden);
  await a.click('#laatikko-kysy');
  const ohje = await a.evaluate(() => ({ auki: !document.querySelector('#laatikko-ohje').hidden, t: document.querySelector('#laatikko-ohje').textContent }));
  tulos('pikaohje ?-napista: vähintään 24, kirjaimet riittävät, isot ja pienet, vinkki', ohje.auki && /vähintään 24 merkkiä/.test(ohje.t) &&
    /Pelkät kirjaimet riittävät/.test(ohje.t) && /Isoja ja pieniä kirjaimia ei erotella/.test(ohje.t) && /torikaffeillaonhemmetinmukavaa/.test(ohje.t), ohje.t.slice(0, 90));
  await a.fill('#laatikko-koodi', 'lyhytkoodi');
  await a.click('#laatikko-tallenna');
  const lyhyt = await a.evaluate(() => ({ t: document.querySelector('#laatikko-tieto').textContent, ls: localStorage.getItem('luin-laatikko') }));
  tulos('Luin: lyhyt koodi hylätään', /vähintään 24 merkkiä \(nyt 10\)/.test(lyhyt.t) && lyhyt.ls === null, lyhyt.t);
  tulos('Luin: Lähetä myös merkinnät ei näy ilman koodia', !kerros0);
  await a.fill('#laatikko-koodi', 'Torikaffeilla on hemmetin mukavaa.');
  await a.click('#laatikko-tallenna');
  await a.waitForFunction(() => /tallennettu/.test(document.querySelector('#laatikko-tieto').textContent));
  const tall = await a.evaluate(() => ({ k: JSON.parse(localStorage.getItem('luin-laatikko')), kentta: document.querySelector('#laatikko-koodi').value,
    t: document.querySelector('#laatikko-tieto').textContent, merk: !document.querySelector('#posti-merk').hidden,
    lajit: !document.querySelector('#posti-lajit').hidden, nappi: document.querySelector('#posti-paalla button').textContent }));
  tulos('Luin: lause siistitään koodiksi ja laatikon teksti tulee', tall.k === KOODI && tall.kentta === KOODI && /Laatikossa 1 teksti/.test(tall.t), JSON.stringify(tall));
  tulos('kerros 2: Lähetä myös merkinnät näkyy, lajit piilossa', tall.merk && !tall.lajit && tall.nappi === 'Lähetä myös merkinnät');
  await a.click('#posti-paalla button');
  const kerros3 = await a.evaluate(() => ({ lajit: [...document.querySelectorAll('#posti-lajit button')].map(b => b.textContent + ':' + b.getAttribute('aria-pressed')),
    nakyy: !document.querySelector('#posti-lajit').hidden, aset: JSON.parse(localStorage.getItem('luin-asetukset')).postiMerk }));
  tulos('kerros 3: lajit auki, oletuksena kaikki', kerros3.nakyy && kerros3.aset === 1 &&
    kerros3.lajit.join() === 'Alleviivaukset:true,Kirjaukset:true,Kirjanmerkit:true,Edistymisen tilanne:true', kerros3.lajit.join());
  if (KUVAT) await a.screenshot({ path: path.join(KUVAT, 'posti-asetukset-lista.png') });

  // --- 2. Laite A: merkinnät tekstiin ja lähetys lukulistaan palattaessa ---
  await a.goto(OSOITE + 'luin.html#id=p-kant-ja-elainetiikka');
  await a.waitForFunction(() => window.__luin.nyt() && window.__luin.nyt().blocks.length > 20);
  const merkA = await a.evaluate(() => {
    const L = window.__luin, n = L.nyt();
    const b1 = n.txt.findIndex((t, i) => i > 5 && t && t.length > 120), b2 = n.txt.findIndex((t, i) => i > b1 + 3 && t && t.length > 120);
    n.merk.al.push({ id: 'a1', segs: [{ b: b1, s: 0, e: 30, x: n.txt[b1].slice(0, 30) }], t: Date.now(), n: 'Laitteen A kirjaus' });
    n.merk.al.push({ id: 'a2', segs: [{ b: b2, s: 0, e: 25, x: n.txt[b2].slice(0, 25) }], t: Date.now() });
    n.merk.km.push({ id: 'k1', b: b2, o: 0, s: n.txt[b2].slice(0, 40), t: Date.now(), osio: '' });
    L.tallennaMerkit();
    return { b1, b2, likainen: Object.keys(JSON.parse(localStorage.getItem('luin-posti-likaiset') || '{}')) };
  });
  tulos('A: muutos merkitsee tekstin lähetettäväksi', merkA.likainen.join() === 'p-kant-ja-elainetiikka', merkA.likainen.join());
  // Lukukohta eteenpäin.
  await a.evaluate(b => { window.__luin.hyppaa({ b, o: 0 }); }, merkA.b2 + 4);
  await odota(900);
  const ankA = await a.evaluate(() => window.__luin.tila.ankkuri);
  await a.evaluate(() => { location.hash = ''; });
  await a.waitForFunction(() => !document.querySelector('#lista').hidden);
  for (let i = 0; i < 40 && !KV.m.has('luinm:' + KOODI + ':kant-ja-elainetiikka'); i++) await odota(100);
  const laatikossa = KV.m.has('luinm:' + KOODI + ':kant-ja-elainetiikka') && JSON.parse(KV.m.get('luinm:' + KOODI + ':kant-ja-elainetiikka').v);
  tulos('A: merkinnät laatikossa palattaessa lukulistaan', laatikossa && laatikossa.al.length === 2 && laatikossa.km.length === 1 &&
    laatikossa.al[0].n === 'Laitteen A kirjaus' && laatikossa.pos && laatikossa.pos.b === ankA.b && ankA.b > 5 && laatikossa.posT > 0,
    laatikossa ? JSON.stringify({ al: laatikossa.al.length, km: laatikossa.km.length, pos: laatikossa.pos, pct: laatikossa.pct }) : 'ei');
  const likaiset = await LS(a, 'luin-posti-likaiset');
  tulos('A: lähetetty, ei enää odottavia', Object.keys(likaiset || {}).length === 0, JSON.stringify(likaiset));

  // --- 3. Laite B: vastaanotto ilman omaa lähetysvalintaa ---
  const b = B.sivu;
  await b.goto(OSOITE + 'luin.html#l=' + encodeURIComponent('TORIKAFFEILLA on hemmetin mukavaa'));
  await b.waitForFunction(() => /teksti|käytössä/.test(document.querySelector('#viesti').textContent));
  for (let i = 0; i < 40; i++) { if ((await LS(b, 'luin-merkit:p-kant-ja-elainetiikka'))) break; await odota(100); }
  const mB = await LS(b, 'luin-merkit:p-kant-ja-elainetiikka'), eB = (await LS(b, 'luin-lista')).filter(e => e.id === 'p-kant-ja-elainetiikka')[0];
  tulos('B: Lisää-kentän koodi siistitty', (await LS(b, 'luin-laatikko')) === KOODI);
  tulos('B: alleviivaukset, kirjaus ja kirjanmerkki tulivat', mB && mB.al.length === 2 && mB.km.length === 1 && mB.al.filter(h => h.n === 'Laitteen A kirjaus').length === 1,
    mB ? JSON.stringify({ al: mB.al.map(h => h.id + (h.n ? '+' : '')), km: mB.km.map(k => k.id) }) : 'ei');
  tulos('B: lukukohta tuli', eB && eB.pos && eB.pos.b === ankA.b && eB.pct === laatikossa.pct && eB.pct > 0, eB && JSON.stringify(eB.pos) + ' ' + eB.pct + ' %');
  await b.goto(OSOITE + 'luin.html#id=p-kant-ja-elainetiikka');
  await b.waitForFunction(() => window.__luin.nyt() && window.__luin.nyt().blocks.length > 20);
  await odota(400);
  const nakyvat = await b.evaluate(() => ({ marks: document.querySelectorAll('#teksti mark.ali').length, ankkuri: window.__luin.tila.ankkuri }));
  tulos('B: alleviivaukset näkyvät ja teksti avautui lukukohtaan', nakyvat.marks >= 2 && Math.abs(nakyvat.ankkuri.b - laatikossa.pos.b) <= 2, JSON.stringify(nakyvat));

  // --- 4. B: tekstikohtainen lähetys, poisto ja uusi kirjaus ---
  await b.click('#lukija .ratas');
  await b.click('#laatikko-osio summary');
  const kirjaNappi = await b.evaluate(() => document.querySelector('#posti-paalla button').textContent + ':' + document.querySelector('#posti-paalla button').getAttribute('aria-pressed'));
  tulos('B: tekstin asetuksissa oma valinta, oletus pois', kirjaNappi === 'Lähetä myös tämän tekstin merkinnät:false', kirjaNappi);
  await b.click('#posti-paalla button');
  if (KUVAT) await b.screenshot({ path: path.join(KUVAT, 'posti-asetukset-teksti.png') });
  const omaB = await LS(b, 'luin-posti:p-kant-ja-elainetiikka');
  tulos('B: tekstikohtainen valinta tallessa, yleinen ennallaan', omaB && omaB.on === 1 && !(await LS(b, 'luin-asetukset') || {}).postiMerk, JSON.stringify(omaB));
  await b.evaluate(() => {
    const L = window.__luin, n = L.nyt();
    n.merk.al = n.merk.al.filter(h => h.id !== 'a2');
    const h = n.merk.al.filter(h => h.id === 'a1')[0];
    h.n = 'Laitteen B muokkaama kirjaus';
    L.tallennaMerkit();
  });
  await b.evaluate(() => { document.querySelector('#asetukset .sulje').click(); location.hash = ''; });
  await b.waitForFunction(() => !document.querySelector('#lista').hidden);
  for (let i = 0; i < 40; i++) { const p = JSON.parse(KV.m.get('luinm:' + KOODI + ':kant-ja-elainetiikka').v); if (p.del && p.del.a2) break; await odota(100); }
  const l2 = JSON.parse(KV.m.get('luinm:' + KOODI + ':kant-ja-elainetiikka').v);
  tulos('B: poisto ja muokkaus laatikossa', l2.del && l2.del.a2 && l2.del.a2.k === 'al' && l2.al.length === 1 && l2.al[0].n === 'Laitteen B muokkaama kirjaus', JSON.stringify({ del: l2.del, al: l2.al.map(h => h.id + ':' + h.n) }));

  // --- 5. A: B:n poisto ja muokkaus tulevat; poistettu ei palaa ---
  await a.reload();
  await a.waitForFunction(() => !document.querySelector('#lista').hidden);
  for (let i = 0; i < 40; i++) { const m = await LS(a, 'luin-merkit:p-kant-ja-elainetiikka'); if (m && m.al.length === 1) break; await odota(100); }
  const mA2 = await LS(a, 'luin-merkit:p-kant-ja-elainetiikka');
  tulos('A: poistettu alleviivaus poistui ja kirjaus päivittyi', mA2.al.length === 1 && mA2.al[0].n === 'Laitteen B muokkaama kirjaus' && mA2.del && mA2.del.a2,
    JSON.stringify(mA2.al.map(h => h.id + ':' + h.n)));
  // A lähettää uudelleen (esim. uusi kirjanmerkki): poistettu ei saa palata laatikkoon.
  await a.goto(OSOITE + 'luin.html#id=p-kant-ja-elainetiikka');
  await a.waitForFunction(() => window.__luin.nyt() && window.__luin.nyt().blocks.length > 20);
  await a.evaluate(() => { const L = window.__luin, n = L.nyt(); n.merk.km.push({ id: 'k2', b: 3, o: 0, s: n.txt[3].slice(0, 40), t: Date.now(), osio: '' }); L.tallennaMerkit(); });
  await a.evaluate(() => window.__luin.postiLaheta());
  const l3 = JSON.parse(KV.m.get('luinm:' + KOODI + ':kant-ja-elainetiikka').v);
  tulos('A: uusi lähetys ei palauta poistettua', l3.al.length === 1 && l3.km.length === 2 && l3.del.a2, JSON.stringify({ al: l3.al.map(h => h.id), km: l3.km.map(k => k.id) }));

  // --- 6. Latomo: koodin raja ja Lähetä myös merkinnät ---
  await a.goto(OSOITE + 'luin/latomo.html');
  await a.fill('#md', KANT);
  await a.dispatchEvent('#md', 'input');
  await a.waitForFunction(() => window.__latomo.tulos());
  // Tyhjä kenttä ennen avausta, ettei muistissa oleva koodi lähetä heti.
  await a.evaluate(() => { document.querySelector('#laatikko-koodi').value = ''; });
  await a.click('#laheta');
  await a.fill('#laatikko-koodi', 'liian-lyhyt');
  const lat1 = await a.evaluate(() => ({ v: document.querySelector('#laatikko-virhe').textContent, nappi: document.querySelector('#kk-laheta').disabled }));
  tulos('Latomo: lyhyt koodi ei kelpaa', /vähintään 24 merkkiä \(nyt 11\)/.test(lat1.v) && lat1.nappi, lat1.v);
  await a.click('#laatikko-kysy');
  const lat2 = await a.evaluate(() => document.querySelector('#laatikko-ohje').textContent);
  tulos('Latomo: pikaohje ?-napista', /vähintään 24 merkkiä/.test(lat2) && /torikaffeillaonhemmetinmukavaa/.test(lat2));
  await a.fill('#laatikko-koodi', 'Torikaffeilla on hemmetin MUKAVAA');
  const lat3 = await a.evaluate(() => ({ nappi: document.querySelector('#kk-laheta').disabled, merk: !document.querySelector('#kk-merk').hidden,
    on: document.querySelector('#kk-merk-on').getAttribute('aria-pressed'), maara: document.querySelector('#kk-merk-maara').textContent,
    linkki: document.querySelector('#laatikko-linkki').textContent }));
  tulos('Latomo: lause kelpaa, merkintärivi näkyy Luinin valinnalla', !lat3.nappi && lat3.merk && lat3.on === 'true' && /luin\.html#l=torikaffeillaonhemmetinmukavaa$/.test(lat3.linkki) &&
    /1 alleviivaus, 1 kirjaus, 2 kirjanmerkkiä/.test(lat3.maara), JSON.stringify(lat3));
  if (KUVAT) await a.locator('#laatikko').screenshot({ path: path.join(KUVAT, 'posti-latomo.png') });
  // Laatikon versioon kirjaus, jota Latomon selaimessa ei ole: yhdistyy eikä katoa.
  const l4 = JSON.parse(KV.m.get('luinm:' + KOODI + ':kant-ja-elainetiikka').v);
  l4.al.push({ id: 'z9', segs: [{ b: merkA.b1 + 1, s: 0, e: 12, x: 'x' }], t: Date.now(), n: 'Vain laatikossa', nt: Date.now() });
  KV.m.set('luinm:' + KOODI + ':kant-ja-elainetiikka', { v: JSON.stringify(l4), meta: { t: Date.now() } });
  await a.click('#kk-laheta');
  await a.waitForFunction(() => /^Lähetetty|ei onnistunut|ilman/.test(document.querySelector('#kk-tila').textContent + document.querySelector('#kk-virhe').textContent));
  const lat4 = await a.evaluate(() => document.querySelector('#kk-tila').textContent || document.querySelector('#kk-virhe').textContent);
  const l5 = JSON.parse(KV.m.get('luinm:' + KOODI + ':kant-ja-elainetiikka').v);
  tulos('Latomo: teksti merkintöineen', /merkintöineen/.test(lat4) && l5.al.some(h => h.id === 'z9') && l5.km.length === 2 && !!l5.del.a2, lat4);

  if (KUVAT) {
    await b.goto(OSOITE + 'luin.html');
    await b.click('#lista .ratas'); await b.click('#laatikko-osio summary'); await b.click('#laatikko-kysy');
    await b.screenshot({ path: path.join(KUVAT, 'posti-pikaohje.png') });
  }
  console.log(kutsut.length + ' kutsua workeriin');
  await selain.close(); palvelin.close();
  console.log(virheita ? virheita + ' virhettä' : 'Kaikki kunnossa.');
  process.exit(virheita ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
