// Android-kääreen silta (android/luin/src/main/assets/silta.js) Luinin oikeilla sivuilla. Ajo repon juuressa:
//   NODE_PATH=$(npm root -g) node luin/kehitys/silta-testi.js [kuvakansio]
// Selain on kosketusnäytöllinen puhelin (393 × 829, kuten Android-emulaattori), ja window.LuinApp on tallentava väärennös.
// Silta syötetään sivulle latauksen jälkeen kuten MainActivity.sivuValmis. Tarkistaa: tila (lukija, tekstikenttä, taustaväri
// vaaleassa ja tummassa teemassa); aidot PageDown/PageUp (joiksi sovellus muuttaa äänenvoimakkuusnapit) kääntävät sivua,
// pitkä painallus hyppää osioon ja vierityksessä PageDown vierittää; Lataa md, merkintöjen vienti ja zip tallentuvat sillan
// kautta tavulleen; kopiointi kulkee sillan kautta (teksti ja HTML); latomoon jaettu teksti täyttyy ja latomo reagoi.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const JUURI = path.resolve(__dirname, '../..');
const SILTA = fs.readFileSync(path.join(JUURI, 'android/luin/src/main/assets/silta.js'), 'utf8');
const KUVAT = process.argv[2];
const TYYPIT = { '.html': 'text/html', '.js': 'text/javascript', '.md': 'text/markdown', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png' };
const palvelin = http.createServer((q, r) => {
  const p = path.join(JUURI, decodeURIComponent(q.url.split(/[?#]/)[0]));
  if (!p.startsWith(JUURI) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': TYYPIT[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(r);
});

let virheita = 0;
function tulos(nimi, ok, tieto) { if (!ok) virheita++; console.log((ok ? 'OK   ' : 'VIKA ') + nimi + (tieto !== undefined && tieto !== '' ? ' – ' + tieto : '')); }

// Väärennetty sovellus: kirjaa kutsut window.__app-olioon.
const SOVELLUS = () => {
  window.__app = { tila: [], tallenna: [], kopioi: [], jaettu: null };
  window.LuinApp = {
    tila: (l, k, v) => window.__app.tila.push({ l, k, v }),
    tallenna: (n, t, b) => window.__app.tallenna.push({ n, t, b }),
    kopioi: (t, h) => window.__app.kopioi.push({ t, h }),
    jaettu: () => { const t = window.__app.jaettu; window.__app.jaettu = null; return t; },
  };
};

(async () => {
  await new Promise(r => palvelin.listen(0, r));
  const U = 'http://localhost:' + palvelin.address().port + '/';
  const selain = await chromium.launch();
  const ctx = await selain.newContext({ viewport: { width: 393, height: 829 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await ctx.addInitScript(SOVELLUS);
  const page = await ctx.newPage();
  const virheet = [];
  page.on('pageerror', e => virheet.push(e.message));
  const app = () => page.evaluate(() => window.__app);
  const viimeinen = async () => { const t = (await app()).tila; return t[t.length - 1]; };
  const silta = () => page.evaluate(SILTA);
  const odota = (f, a) => page.waitForFunction(f, a, { timeout: 15000 });

  // 1. Pino: tila ja vaalean teeman paperi.
  await page.goto(U + 'luin.html');
  await page.waitForSelector('#lista:not([hidden])');
  await silta();
  await page.evaluate(() => new Promise(r => setTimeout(r, 50)));
  let t = await viimeinen();
  tulos('pino: lukija pois, ei kenttää, paperi rgb(250, 245, 234)', t && !t.l && !t.k && t.v === 'rgb(250, 245, 234)', JSON.stringify(t));
  await silta();
  tulos('toinen syöttö ei asenna siltaa uudelleen', (await app()).tila.length === 1, (await app()).tila.length);

  // 2. Lukija sivutettuna: tila ja PageDown/PageUp.
  await page.goto(U + 'luin.html#u=luin/tekstit/kant-ja-elainetiikka.md');
  await page.waitForSelector('#lukija:not([hidden])', { state: 'attached' });
  await silta();
  await odota(() => window.__luin && window.__luin.tila.sivuja > 3);
  await page.evaluate(() => new Promise(r => setTimeout(r, 300)));
  t = await viimeinen();
  const sivut = await page.evaluate(() => [window.__luin.aset.sivutus, document.body.classList.contains('sivutus'), window.__luin.tila.sivu, window.__luin.tila.sivuja]);
  tulos('lukija: tila ilmoitettu, sivutettu oletuksena kosketusnäytöllä', t.l && !t.k && sivut[0] === 'sivut' && sivut[1], JSON.stringify([t, sivut]));
  if (KUVAT) await page.screenshot({ path: path.join(KUVAT, 'silta-lukija.png') });
  const s0 = sivut[2];
  await page.keyboard.press('PageDown');
  await page.keyboard.press('PageDown');
  const s2 = await page.evaluate(() => window.__luin.tila.sivu);
  await page.keyboard.press('PageUp');
  const s1 = await page.evaluate(() => window.__luin.tila.sivu);
  tulos('PageDown kahdesti ja PageUp kerran: sivu +2 ja −1', s2 === s0 + 2 && s1 === s0 + 1, [s0, s2, s1].join(' → '));

  // Pitkä painallus (äänenvoimakkuusnapin toisto: keydown toistona ja lopuksi keyup) hyppää osioon.
  await page.keyboard.down('PageDown');
  for (let i = 0; i < 12; i++) { await page.evaluate(() => new Promise(r => setTimeout(r, 100))); await page.keyboard.down('PageDown'); }
  await page.keyboard.up('PageDown');
  const sh = await page.evaluate(() => window.__luin.tila.sivu);
  tulos('pitkä PageDown (1,3 s toistoineen): hyppy yli yhden sivun', sh > s1 + 1, s1 + ' → ' + sh);

  // Tekstikenttä aktiivisena: tila kertoo sen (sovellus jättää napit äänenvoimakkuudelle).
  await page.evaluate(() => { const i = document.createElement('input'); i.id = 'koekentta'; i.style.position = 'fixed'; document.body.appendChild(i); i.focus(); });
  await page.evaluate(() => new Promise(r => setTimeout(r, 50)));
  const tk = await viimeinen();
  await page.evaluate(() => { document.getElementById('koekentta').blur(); document.getElementById('koekentta').remove(); });
  await page.evaluate(() => new Promise(r => setTimeout(r, 50)));
  const tk2 = await viimeinen();
  tulos('tekstikenttä: kentta tosi kohdistettuna, epätosi sen jälkeen', tk.k && !tk2.k && tk2.l, JSON.stringify([tk, tk2]));

  // 3. Kirjanmerkki zip-vientiä varten (vienti tarvitsee merkintöjä).
  const id = await page.evaluate(() => window.__luin.nyt().e.id);
  await page.evaluate((id) => {
    const n = window.__luin.nyt(), b = n.txt.findIndex((x, i) => i > 2 && x && x.length > 40);
    localStorage.setItem('luin-merkit:' + id, JSON.stringify({ km: [], al: [{ segs: [{ b, s: 0, e: 12, x: n.txt[b].slice(0, 12) }] }] }));
  }, id);

  // 4. Pino: Lataa md ja lähdeviitteen kopiointi.
  await page.goto(U + 'luin.html#');
  await page.waitForSelector('#nimikkeet li');
  await silta();
  await page.click(`#nimikkeet button.jako[data-id="${id}"]`);
  await page.click('#pop button[data-k="lataa"]');
  await odota(() => window.__app.tallenna.length > 0);
  const tall = (await app()).tallenna[0];
  const alkup = await page.evaluate(id => JSON.parse(localStorage.getItem('luin-teksti:' + id)), id);
  const sama = Buffer.from(tall.b, 'base64').toString('utf8') === alkup;
  tulos('Lataa md: nimi, tyyppi ja sisältö tavulleen sillan kautta', sama && /\.md$/.test(tall.n) && /^text\/markdown/.test(tall.t), tall.n + ' ' + tall.t + ' ' + Buffer.from(tall.b, 'base64').length + ' t');
  const ladatut = await page.evaluate(() => document.querySelectorAll('a[download]').length);
  tulos('latauslinkki ei jäänyt sivulle eikä selain ladannut', ladatut === 0);

  await page.click(`#nimikkeet button.jako[data-id="${id}"]`);
  await page.click('#pop button[data-k="viite"]');
  await odota(() => window.__app.kopioi.length > 0);
  const kop = (await app()).kopioi[0];
  tulos('Kopioi lähdeviite: teksti ja HTML sillan kautta', kop.t.length > 20 && /<em>/.test(kop.h), JSON.stringify(kop).slice(0, 160));

  // 5. Zip-vienti (valittujen valikko) sillan kautta.
  // Kopioinnin kuittaus voi olla auki, ja ohi napautus vain sulkee sen (nielaise), joten ensin Esc.
  await page.keyboard.press('Escape');
  await page.evaluate(() => new Promise(r => setTimeout(r, 100)));
  await page.click(`#nimikkeet button.valitse[data-id="${id}"]`);
  await page.waitForSelector('#val-valikko:not([hidden])');
  await page.click('#val-valikko');
  await page.click('#pop button[data-k="zip"]');
  await odota(() => window.__app.tallenna.length > 1).catch(async () => console.log('viesti:', await page.textContent('#viesti')));
  const zip = (await app()).tallenna[1];
  const zb = Buffer.from(zip.b, 'base64');
  tulos('zip: nimi luin-merkinnat-*.zip, tiedosto alkaa PK', /^luin-merkinnat-\d{4}-\d\d-\d\d\.zip$/.test(zip.n) && zb.slice(0, 2).toString() === 'PK', zip.n + ' ' + zb.length + ' t');

  // 6. Tumma teema: taustaväri.
  await page.evaluate(() => { const a = JSON.parse(localStorage.getItem('luin-asetukset') || '{}'); a.teema = 'tumma'; localStorage.setItem('luin-asetukset', JSON.stringify(a)); });
  await page.reload();
  await page.waitForSelector('#lista:not([hidden])');
  await silta();
  await page.evaluate(() => new Promise(r => setTimeout(r, 50)));
  t = await viimeinen();
  tulos('tumma teema: rgb(18, 14, 11)', t.v === 'rgb(18, 14, 11)', JSON.stringify(t));

  // 7. Vierityksessä PageDown vierittää (selaimen oma toiminto).
  await page.evaluate(() => { const a = JSON.parse(localStorage.getItem('luin-asetukset')); a.sivutus = 'vieritys'; a.teema = 'vaalea'; localStorage.setItem('luin-asetukset', JSON.stringify(a)); });
  await page.goto(U + 'luin.html#u=luin/tekstit/kant-ja-elainetiikka.md');
  await page.waitForSelector('#lukija:not([hidden])', { state: 'attached' });
  await silta();
  await page.evaluate(() => new Promise(r => setTimeout(r, 500)));
  const y0 = await page.evaluate(() => scrollY);
  await page.keyboard.press('PageDown');
  await page.evaluate(() => new Promise(r => setTimeout(r, 600)));
  const y1 = await page.evaluate(() => scrollY);
  tulos('vieritys: PageDown vierittää ruudullisen verran', y1 - y0 > 400, y0 + ' → ' + y1);

  // 8. Latomo: jaettu teksti.
  const JAETTU = '# Jaettu koe\n\nKappale, joka tuli Jaa-valikosta.\n';
  await page.goto(U + 'luin/latomo.html');
  await page.waitForSelector('#md');
  await page.evaluate(t => { window.__app.jaettu = t; }, JAETTU);
  await silta();
  await page.evaluate(() => new Promise(r => setTimeout(r, 300)));
  const lat = await page.evaluate(() => [document.getElementById('md').value, window.__app.jaettu, document.getElementById('avaa') && !document.getElementById('avaa').disabled]);
  tulos('latomo: jaettu teksti kentässä, annettu kerran, Avaa lukimessa käytössä', lat[0] === JAETTU && lat[1] === null && lat[2], JSON.stringify(lat));
  if (KUVAT) await page.screenshot({ path: path.join(KUVAT, 'silta-latomo.png') });
  await page.click('#avaa');
  await page.waitForSelector('#lukija:not([hidden])', { state: 'attached' });
  const otsikko = await page.evaluate(() => window.__luin.nyt().e.title);
  tulos('latomosta lukimeen: jaettu teksti pinossa', otsikko === 'Jaettu koe', otsikko);

  tulos('ei sivuvirheitä', !virheet.length, virheet.join(' | '));
  await selain.close(); palvelin.close();
  console.log(virheita ? virheita + ' vikaa' : 'Kaikki kunnossa');
  process.exit(virheita ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
