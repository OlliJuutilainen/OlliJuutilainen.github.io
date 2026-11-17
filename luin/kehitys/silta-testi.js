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
  // Painallusten väli 200 ms: alle 120 ms:n välein tuleva saman näppäimen keydown on toistoa (osioToisto).
  const tauko = (ms) => page.evaluate((ms) => new Promise(r => setTimeout(r, ms)), ms);
  await page.keyboard.press('PageDown'); await tauko(200);
  await page.keyboard.press('PageDown'); await tauko(200);
  const s2 = await page.evaluate(() => window.__luin.tila.sivu);
  await page.keyboard.press('PageUp'); await tauko(200);
  const s1 = await page.evaluate(() => window.__luin.tila.sivu);
  tulos('PageDown kahdesti ja PageUp kerran: sivu +2 ja −1', s2 === s0 + 2 && s1 === s0 + 1, [s0, s2, s1].join(' → '));

  // Pitkä painallus (äänenvoimakkuusnapin toisto: keydown toistona ja lopuksi keyup) hyppää osioon.
  await page.keyboard.down('PageDown');
  for (let i = 0; i < 12; i++) { await page.evaluate(() => new Promise(r => setTimeout(r, 100))); await page.keyboard.down('PageDown'); }
  await page.keyboard.up('PageDown');
  const sh = await page.evaluate(() => window.__luin.tila.sivu);
  tulos('pitkä PageDown (1,3 s toistoineen): hyppy yli yhden sivun', sh > s1 + 1, s1 + ' → ' + sh);

  // WebView ei välttämättä merkitse toistoa (e.repeat), ja jokin laite voi toistaa alas–ylös-pareina (Light Phone
  // 16.11.2026: pitkä painallus juoksutti sivuja). Tapahtumat syötetään suoraan, jotta repeat-lipun saa pois.
  const syota = (sarja) => page.evaluate((sarja) => new Promise(valmis => {
    let i = 0;
    (function seur() {
      if (i >= sarja.length) return setTimeout(valmis, 50);
      const [tyyppi, avain, viive, toisto] = sarja[i++];
      document.dispatchEvent(new KeyboardEvent(tyyppi, { key: avain, repeat: !!toisto, bubbles: true, cancelable: true }));
      setTimeout(seur, viive);
    })();
  }), sarja);
  const sivuNyt = () => page.evaluate(() => window.__luin.tila.sivu);
  // Alku sivulta 4, jotta hyppy erottuu sivunkäännöstä (sivulta 0 seuraava luku alkaa jo sivulla 1).
  const alku = async () => {
    await page.keyboard.press('Home'); await tauko(200);
    for (let i = 0; i < 4; i++) { await page.keyboard.press('PageDown'); await tauko(200); }
    return sivuNyt();
  };
  // a) toisto ilman lippua: keydown 500 ms:n päästä ja sitten 50 ms välein, keyup lopuksi (1,5 s)
  let a0 = await alku();
  const toistoA = [['keydown', 'PageDown', 500]];
  for (let i = 0; i < 20; i++) toistoA.push(['keydown', 'PageDown', 50]);
  toistoA.push(['keyup', 'PageDown', 0]);
  await syota(toistoA);
  const a1 = await sivuNyt();
  // vertailu: sama aidolla toistolipulla
  let b0 = await alku();
  await syota([['keydown', 'PageDown', 500]].concat(Array.from({ length: 20 }, () => ['keydown', 'PageDown', 50, true]), [['keyup', 'PageDown', 0]]));
  const b1 = await sivuNyt();
  tulos('pitkä painallus ilman repeat-lippua hyppää samaan kuin lipun kanssa', a0 === b0 && a1 === b1 && b1 > b0 + 1, [a0 + ' → ' + a1, b0 + ' → ' + b1].join(', '));
  // b) toisto alas–ylös-pareina 50 ms välein (1,5 s)
  let c0 = await alku();
  const pari = [['keydown', 'PageDown', 10], ['keyup', 'PageDown', 490]];
  for (let i = 0; i < 20; i++) pari.push(['keydown', 'PageDown', 10], ['keyup', 'PageDown', 40]);
  await syota(pari);
  const c1 = await sivuNyt();
  tulos('pitkä painallus alas–ylös-pareina hyppää samaan', c0 === b0 && c1 === b1, c0 + ' → ' + c1);
  // c) erilliset painallukset 200 ms välein kääntävät kukin sivun (ei hyppyä, ei nielaisua)
  let d0 = await alku();
  const erill = [];
  for (let i = 0; i < 5; i++) erill.push(['keydown', 'PageDown', 80], ['keyup', 'PageDown', 120]);
  await syota(erill);
  const d1 = await sivuNyt();
  tulos('viisi erillistä painallusta 200 ms välein: viisi sivua', d1 === d0 + 5, d0 + ' → ' + d1);
  // d) PageUp heti PageDownin jälkeen ei ole toistoa
  await syota([['keydown', 'PageDown', 30], ['keyup', 'PageDown', 30], ['keydown', 'PageUp', 30], ['keyup', 'PageUp', 0]]);
  tulos('PageDown ja heti PageUp: takaisin samalle sivulle', (await sivuNyt()) === d1, d1 + ' → ' + (await sivuNyt()));
  // e) Sivu kääntyy vasta näppäimen noustessa (käyttäjän pyyntö 17.11.2026): pitkässä painalluksessa sivu ei käänny
  // ennen hyppyä (Light Phone kävi välisivulla), ja alle 1,1 s:n pito toistoineen kääntää yhden sivun noustessaan.
  const seuraa = (sarja) => page.evaluate((sarja) => new Promise(valmis => {
    const nahty = [window.__luin.tila.sivu], kello = setInterval(() => { const v = window.__luin.tila.sivu; if (v !== nahty[nahty.length - 1]) nahty.push(v); }, 5);
    let i = 0;
    (function seur() {
      if (i >= sarja.length) return setTimeout(() => { clearInterval(kello); valmis(nahty); }, 60);
      const [tyyppi, avain, viive, toisto] = sarja[i++];
      document.dispatchEvent(new KeyboardEvent(tyyppi, { key: avain, repeat: !!toisto, bubbles: true, cancelable: true }));
      setTimeout(seur, viive);
    })();
  }), sarja);
  await alku();
  const pito = await seuraa([['keydown', 'PageDown', 500]].concat(Array.from({ length: 20 }, () => ['keydown', 'PageDown', 50, true]), [['keyup', 'PageDown', 0]]));
  tulos('pitkä painallus: hyppy suoraan ilman välisivua', pito.length === 2 && pito[1] > pito[0] + 1, pito.join(' → '));
  const lyhyt = await seuraa([['keydown', 'PageDown', 150], ['keyup', 'PageDown', 0]]);
  const kesken = await page.evaluate(() => new Promise(r => {
    const L = window.__luin, s = L.tila.sivu;
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true, cancelable: true }));
    setTimeout(() => { const v = L.tila.sivu; document.dispatchEvent(new KeyboardEvent('keyup', { key: 'PageDown', bubbles: true, cancelable: true })); setTimeout(() => r([s, v, L.tila.sivu]), 50); }, 100);
  }));
  await tauko(200);
  const puoli = await seuraa([['keydown', 'PageDown', 500]].concat(Array.from({ length: 6 }, () => ['keydown', 'PageDown', 50, true]), [['keyup', 'PageDown', 0]]));
  const taakse = await seuraa([['keydown', 'PageUp', 150], ['keyup', 'PageUp', 0]]);
  tulos('lyhyt painallus kääntää vasta noustessa, 0,8 s:n pito yhden sivun, PageUp takaisin',
    lyhyt.length === 2 && lyhyt[1] === lyhyt[0] + 1 && kesken[1] === kesken[0] && kesken[2] === kesken[0] + 1 &&
    puoli.length === 2 && puoli[1] === puoli[0] + 1 && taakse.length === 2 && taakse[1] === taakse[0] - 1,
    JSON.stringify({ lyhyt, kesken, puoli, taakse }));

  // Sivunkäännön tavat: sovelluksessa kaikki saa sammuttaa, koska napit kääntävät aina (käyttäjän pyyntö 16.11.2026);
  // selaimessa viimeinen jää päälle.
  const sammutaTavat = (p) => p.evaluate(() => {
    const a = window.__luin.aset; a.sivuReuna = a.sivuPyyhka = a.sivunapit = 1;
    document.querySelector('#lukija .ratas, .ratas:not([hidden])').click();
    for (const k of ['sivuReuna', 'sivuPyyhka', 'sivunapit']) document.querySelector('#asetukset button[data-kytkin="' + k + '"]').click();
    const tulos = [a.sivuReuna, a.sivuPyyhka, a.sivunapit].join('');
    a.sivuReuna = a.sivuPyyhka = a.sivunapit = 1;
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    return tulos;
  });
  const tavatSov = await sammutaTavat(page);
  const sel = await (await selain.newContext({ viewport: { width: 393, height: 829 }, isMobile: true, hasTouch: true })).newPage();
  await sel.goto(U + 'luin.html#u=luin/tekstit/kant-ja-elainetiikka.md');
  await sel.waitForFunction(() => window.__luin && window.__luin.tila.sivuja > 3);
  const tavatSel = await sammutaTavat(sel);
  await sel.context().close();
  tulos('sivunkäännön tavat: sovelluksessa kaikki pois, selaimessa viimeinen jää', tavatSov === '000' && tavatSel === '001', 'sovellus ' + tavatSov + ', selain ' + tavatSel);

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
  // Pelkkä ankkurin vaihto ei lataa sivua, joten asetus luettaisiin vasta uudelleenlatauksessa.
  await page.reload();
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
