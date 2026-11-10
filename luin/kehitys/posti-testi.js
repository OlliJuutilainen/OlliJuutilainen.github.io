// Postilaatikon ja merkintäpostin selaintesti. Ajo repon juuressa:
//   NODE_PATH=$(npm root -g) node luin/kehitys/posti-testi.js [kuvakansio]
// Kaksi laitetta (erilliset selainkontekstit, eri localStorage) ja yksi laatikko: workerin oikea koodi
// (worker/src/index.js) muistissa olevalla KV:llä, johon sivujen kutsut reititetään. Tarkistaa: laatikkolauseen sääntö
// (24–40 merkkiä a–z, 0–9, -; muut merkit hylätään, isot pieniksi; Luin, Lisää-kenttä, Latomo), i-ohje, Postihuilun
// tekstit, asetusten kerrokset (lause → Huiluta myös merkintöjä → lajit), lähetys lukulistaan palattaessa, vastaanotto
// toisessa laitteessa (alleviivaus, kirjaus, kirjanmerkki, lukukohta), poiston kulku poistomerkintänä, tekstikohtainen
// valinta ja Latomon Postihuilu (vain teksti, ei merkintöjä).
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
  const osio = await a.evaluate(() => ({ ots: document.querySelector('#laatikko-osio summary').textContent,
    teksti: document.querySelector('#laatikko-osio .huomio.jatko').textContent, rivi: document.querySelector('#laatikko-osio .koodirivi').textContent.trim(),
    nappi: document.querySelector('#laatikko-tallenna').textContent, lista: document.querySelector('#lisaa-ots').textContent,
    paikka: document.querySelector('#lisaa-syote').placeholder, lisaa: document.querySelector('#lisaa-kentta button').textContent }));
  tulos('Postihuilu: asetusten ja lukulistan tekstit', osio.ots === 'Postihuilu' && osio.rivi === 'Laatikkolause:' && osio.nappi === 'Soita huilua!' &&
    osio.teksti === 'Huilun soittaminen yhdistää kaikki valitulla Laatikkolauseella varustetut lukulistat.' && osio.lista === 'Postihuilu' &&
    osio.paikka === 'Laatikkolause tai linkki' && osio.lisaa === 'Soita huilua!', JSON.stringify(osio));
  tulos('i-ohje: haarukka 24–40, muita merkkejä ei hyväksytä, esimerkit, 30 päivää', ohje.auki && /merkkihaarukka on 24–40/.test(ohje.t) &&
    /MUITA MERKKEJÄ JA VÄLILYÖNTEJÄ EI HYVÄKSYTÄ\./.test(ohje.t) && /tori-kaffeilla-on-hemmetin-mukavaa/.test(ohje.t) &&
    /torikaffeillaonhemmetinmukavaa/.test(ohje.t) && /kestää 30 päivää/.test(ohje.t), ohje.t.slice(0, 90));
  await a.fill('#laatikko-koodi', 'lyhytkoodi');
  await a.click('#laatikko-tallenna');
  const lyhyt = await a.evaluate(() => ({ t: document.querySelector('#laatikko-tieto').textContent, ls: localStorage.getItem('luin-laatikko') }));
  tulos('Luin: lyhyt koodi hylätään', /vähintään 24 merkkiä \(nyt 10\)/.test(lyhyt.t) && lyhyt.ls === null, lyhyt.t);
  tulos('Luin: Huiluta myös merkintöjä ei näy ilman lausetta', !kerros0);
  await a.fill('#laatikko-koodi', 'Torikaffeilla on hemmetin mukavaa.');
  await a.click('#laatikko-tallenna');
  const valit = await a.evaluate(() => ({ t: document.querySelector('#laatikko-tieto').textContent, ls: localStorage.getItem('luin-laatikko') }));
  tulos('Luin: välilyönnit ja välimerkit hylätään', /Ei kelpaa: välilyönti, ”\.”\.$/.test(valit.t) && valit.ls === null, valit.t);
  await a.fill('#laatikko-koodi', 'Torikaffeillaönhemmetinmukavaa');
  await a.click('#laatikko-tallenna');
  const aakk = await a.evaluate(() => document.querySelector('#laatikko-tieto').textContent);
  tulos('Luin: ääkköset hylätään', /Ei kelpaa: ”ö”\.$/.test(aakk), aakk);
  await a.fill('#laatikko-koodi', ' TorikaffeillaOnHemmetinMukavaa ');
  await a.click('#laatikko-tallenna');
  await a.waitForFunction(() => /tallennettu/.test(document.querySelector('#laatikko-tieto').textContent));
  const tall = await a.evaluate(() => ({ k: JSON.parse(localStorage.getItem('luin-laatikko')), kentta: document.querySelector('#laatikko-koodi').value,
    t: document.querySelector('#laatikko-tieto').textContent, merk: !document.querySelector('#posti-merk').hidden,
    lajit: !document.querySelector('#posti-lajit').hidden, nappi: document.querySelector('#posti-paalla button').textContent }));
  tulos('Luin: isot pieniksi, laatikon teksti tulee', tall.k === KOODI && tall.kentta === KOODI && tall.t === 'Laatikkolause tallennettu. Laatikossa 1 teksti, joista uusia 1.', JSON.stringify(tall));
  tulos('kerros 2: Huiluta myös merkintöjä näkyy, lajit piilossa', tall.merk && !tall.lajit && tall.nappi === 'Huiluta myös merkintöjä');
  await a.click('#posti-paalla button');
  const kerros3 = await a.evaluate(() => ({ lajit: [...document.querySelectorAll('#posti-lajit button')].map(b => b.textContent + ':' + b.getAttribute('aria-pressed')),
    nakyy: !document.querySelector('#posti-lajit').hidden, aset: JSON.parse(localStorage.getItem('luin-asetukset')).postiMerk,
    tieto: document.querySelector('#posti-tieto').textContent }));
  tulos('kerros 3: lajit auki, oletuksena kaikki, lukulistassa ei selitystä', kerros3.nakyy && kerros3.aset === 1 && kerros3.tieto === '' &&
    kerros3.lajit.join() === 'Alleviivaukset:true,Kirjaukset:true,Kirjanmerkit:true,Edistymisen tilanne:true', kerros3.lajit.join() + ' / ' + kerros3.tieto);
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
  await b.goto(OSOITE + 'luin.html');
  await b.fill('#lisaa-syote', 'torikaffeilla on hemmetin mukavaa');
  await b.press('#lisaa-syote', 'Enter');
  await b.waitForFunction(() => /Ei kelpaa/.test(document.querySelector('#viesti').textContent));
  tulos('B: Postihuilu-kenttä hylkää välilyönnit', (await LS(b, 'luin-laatikko')) === null);
  await b.fill('#lisaa-syote', 'https://ollijuutilainen.github.io/luin.html#l=' + encodeURIComponent('TORIKAFFEILLAonhemmetinmukavaa'));
  await b.press('#lisaa-syote', 'Enter');
  await b.waitForFunction(() => /teksti|käytössä/.test(document.querySelector('#viesti').textContent));
  const viestiB = await b.evaluate(() => document.querySelector('#viesti').textContent);
  tulos('B: ilmoitus Postihuilun kautta kantautui teksti', viestiB === 'Postihuilun kautta kantautui teksti.', viestiB);
  for (let i = 0; i < 40; i++) { if ((await LS(b, 'luin-merkit:p-kant-ja-elainetiikka'))) break; await odota(100); }
  const mB = await LS(b, 'luin-merkit:p-kant-ja-elainetiikka'), eB = (await LS(b, 'luin-lista')).filter(e => e.id === 'p-kant-ja-elainetiikka')[0];
  tulos('B: linkin lause pienillä', (await LS(b, 'luin-laatikko')) === KOODI);
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
  tulos('B: tekstin asetuksissa oma valinta, oletus pois', kirjaNappi === 'Huiluta myös tämän tekstin merkintöjä:false', kirjaNappi);
  await b.click('#posti-paalla button');
  const tietoB = await b.evaluate(() => document.querySelector('#posti-tieto').textContent);
  tulos('B: tekstin asetuksissa selitys', /^Merkinnät lähtevät, kun poistut tekstistä lukulistaan tai Luin jää taustalle\./.test(tietoB), tietoB);
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

  // --- 6. Latomo: laatikkolauseen sääntö ja Postihuilu (vain teksti; merkintäosio poistettu 10.11.2026) ---
  await a.goto(OSOITE + 'luin/latomo.html');
  await a.fill('#md', KANT);
  await a.dispatchEvent('#md', 'input');
  await a.waitForFunction(() => window.__latomo.tulos());
  // Tyhjä kenttä ennen avausta, ettei muistissa oleva lause lähetä heti.
  await a.evaluate(() => { document.querySelector('#laatikko-koodi').value = ''; });
  const lat0 = await a.evaluate(() => ({ nappi: document.querySelector('#laheta').textContent, soita: document.querySelector('#kk-laheta').textContent,
    label: document.querySelector('label[for="laatikko-koodi"]').textContent, merk: !!document.querySelector('#kk-merk') }));
  tulos('Latomo: Postihuilu, Laatikkolause, Soita huilua!, ei merkintäosiota', lat0.nappi === 'Postihuilu' && lat0.soita === 'Soita huilua!' &&
    lat0.label === 'Laatikkolause' && !lat0.merk, JSON.stringify(lat0));
  await a.click('#laheta');
  await a.fill('#laatikko-koodi', 'liian-lyhyt');
  const lat1 = await a.evaluate(() => ({ v: document.querySelector('#laatikko-virhe').textContent, nappi: document.querySelector('#kk-laheta').disabled }));
  tulos('Latomo: lyhyt lause ei kelpaa', /vähintään 24 merkkiä \(nyt 11\)/.test(lat1.v) && lat1.nappi, lat1.v);
  await a.click('#laatikko-kysy');
  const lat2 = await a.evaluate(() => document.querySelector('#laatikko-ohje').textContent);
  tulos('Latomo: i-ohje', /merkkihaarukka on 24–40/.test(lat2) && /tori-kaffeilla-on-hemmetin-mukavaa/.test(lat2) && /kestää 30 päivää/.test(lat2));
  await a.fill('#laatikko-koodi', 'Torikaffeilla on hemmetin MUKAVAA');
  const latV = await a.evaluate(() => ({ v: document.querySelector('#laatikko-virhe').textContent, nappi: document.querySelector('#kk-laheta').disabled }));
  tulos('Latomo: välilyönnit hylätään', /Ei kelpaa: välilyönti\.$/.test(latV.v) && latV.nappi, latV.v);
  const LAUSE2 = 'tori-kaffeilla-on-hemmetin-mukavaa';
  await a.fill('#laatikko-koodi', 'Tori-Kaffeilla-on-hemmetin-MUKAVAA');
  const lat3 = await a.evaluate(() => ({ nappi: document.querySelector('#kk-laheta').disabled, lause: document.querySelector('#laatikko-lause').textContent,
    linkki: document.querySelector('#laatikko-linkki').textContent, ohje: document.querySelector('#laatikko-ohje-linkki').textContent.replace(/\s+/g, ' ').trim(),
    nakyy: !document.querySelector('#laatikko-ohje-linkki').hidden }));
  tulos('Latomo: yhdysmerkillinen lause kelpaa, toisen laitteen ohje ja linkki', !lat3.nappi && lat3.nakyy && lat3.lause === LAUSE2 &&
    new RegExp('luin\\.html#l=' + LAUSE2 + '$').test(lat3.linkki) && /^TOISEN LAITTEEN PÄÄSSÄ: Teksti kotiutuu/.test(lat3.ohje) &&
    /ollessa tori-kaffeilla-on-hemmetin-mukavaa tai kopioimalla/.test(lat3.ohje) && /VAROITUS: Huilu lumoaa/.test(lat3.ohje), JSON.stringify(lat3));
  if (KUVAT) await a.locator('#laatikko').screenshot({ path: path.join(KUVAT, 'posti-latomo.png') });
  await a.click('#kk-laheta');
  await a.waitForFunction(() => /^Ladottu postitettavaksi|ei onnistunut/.test(document.querySelector('#kk-tila').textContent + document.querySelector('#kk-virhe').textContent));
  const lat4 = await a.evaluate(() => document.querySelector('#kk-tila').textContent || document.querySelector('#kk-virhe').textContent);
  tulos('Latomo: teksti laatikossa ilman merkintöjä', /^Ladottu postitettavaksi klo \d\d:\d\d: KANT JA ELÄINETIIKKA\.$/.test(lat4) &&
    KV.m.has('luin:' + LAUSE2 + ':kant-ja-elainetiikka') && !KV.m.has('luinm:' + LAUSE2 + ':kant-ja-elainetiikka') &&
    (await LS(a, 'luin-laatikko')) === LAUSE2, lat4);

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
