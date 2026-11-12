// Laatikkolauseen arpojan testi (luin/laatikkolause.js). Ajo repon juuressa:
//   NODE_PATH=$(npm root -g) node luin/kehitys/laatikkolause-testi.js [kuvakansio]
// Tarkistaa ilman selainta: sanat ovat a–z ja yksikäsitteisiä, MAARA on sama kuin suora laskenta, tasajakauma
// (khiin neliö), arvotut lauseet kelpaavat posti.js:lle ja purkautuvat yksikäsitteisesti. Selaimessa: Latomon Arvo täyttää
// kentän, näyttää virkkeen ja piilottaa sen, kun kenttää muokataan. Sanojen kieliasun tarkistaa laatikkolause-sanat.py.
const http = require('http');
const fs = require('fs');
const path = require('path');

const JUURI = path.resolve(__dirname, '../..');
const KUVAT = process.argv[2];
let virheita = 0;
function tulos(nimi, ok, tieto) { if (!ok) virheita++; console.log((ok ? 'OK   ' : 'VIKA ') + nimi + (tieto ? ' – ' + tieto : '')); }

require(path.join(JUURI, 'luin/posti.js'));
require(path.join(JUURI, 'luin/laatikkolause.js'));
const P = globalThis.LuinPosti, L = globalThis.LuinLause, S = L.SANAT, JARJ = ['a', 's', 'v', 'n', 'o', 'p'];

// 1. Sanat
JARJ.forEach(k => {
  const ws = S[k], vaarat = ws.filter(w => !/^[a-z0-9]+$/.test(w)), kaks = ws.filter((w, i) => ws.indexOf(w) !== i);
  tulos('sanat ' + k + ': ' + ws.length + ', vain a–z/0–9 ja ei kaksoiskappaleita', ws.length > 90 && !vaarat.length && !kaks.length, vaarat.concat(kaks).join(' '));
});
tulos('luvut 2–99', S.n.length === 98 && S.n[0] === '2' && S.n[97] === '99');

// 2. MAARA toisin laskettuna: kolmen parin (a+s, v+n, o+p) pituushistogrammit sanapareista suoraan ja niiden kaikki
// yhdistelmät. Moduuli laskee saman paikka kerrallaan konvoluutiona; tulosten pitää olla samat.
{
  const pari = (k1, k2) => { const h = {}; for (const x of S[k1]) for (const y of S[k2]) { const z = x.length + y.length; h[z] = (h[z] || 0) + 1; } return h; };
  const [h1, h2, h3] = [pari('a', 's'), pari('v', 'n'), pari('o', 'p')];
  let m = 0, kaikki = 0;
  for (const x in h1) for (const y in h2) for (const z in h3) {
    const n = h1[x] * h2[y] * h3[z], pit = +x + +y + +z + 5;
    kaikki += n;
    if (pit >= P.MIN && pit <= P.MAX) m += n;
  }
  const tulo = JARJ.reduce((t, k) => t * S[k].length, 1);
  tulos('MAARA sama kuin toisin laskettu', m === L.MAARA && kaikki === tulo, m + ' / ' + L.MAARA + ' (' + L.BITIT.toFixed(2) + ' bittiä; kelpaa ' + (m / tulo * 100).toFixed(1) + ' %)');
}

// 3. Tasajakauma: kokonais(7) 70 000 kertaa; khiin neliö 6 vapausasteella, 0,1 %:n raja 22,46.
{
  const c = new Array(7).fill(0), N = 70000;
  for (let i = 0; i < N; i++) c[L.kokonais(7)]++;
  const chi = c.reduce((s, x) => s + (x - N / 7) ** 2 / (N / 7), 0);
  tulos('kokonais(7) tasajakautunut', chi < 22.46, 'χ² = ' + chi.toFixed(2) + ' ' + c.join(' '));
  const c2 = new Array(98).fill(0);
  for (let i = 0; i < 98000; i++) c2[L.kokonais(98)]++;
  tulos('kokonais(98) kattaa kaikki', c2.every(x => x > 800 && x < 1200), Math.min(...c2) + '–' + Math.max(...c2));
}

// 4. Arvotut lauseet: kelpaavat, purkautuvat, pituusjakauma.
{
  const N = 20000, pit = [], ei = [], eri = new Set();
  for (let i = 0; i < N; i++) {
    const r = L.arvo(), osat = r.lause.split('-');
    pit.push(r.lause.length); eri.add(r.lause);
    const ok = !P.koodiVirhe(r.lause) && P.koodi(r.lause) === r.lause && osat.length === 6 && osat.every((w, j) => S[JARJ[j]].includes(w)) &&
      r.virke === osat.join(' ').replace(/^./, c => c.toUpperCase()) + '.';
    if (!ok && ei.length < 3) ei.push(r.lause);
  }
  tulos('arvotut lauseet kelpaavat ja purkautuvat', !ei.length, ei.join(' '));
  pit.sort((a, b) => a - b);
  tulos('pituudet 24–52', pit[0] >= P.MIN && pit[N - 1] <= P.MAX, 'min ' + pit[0] + ', mediaani ' + pit[N >> 1] + ', max ' + pit[N - 1]);
  tulos('ei toistoja 20 000 arvonnassa', eri.size === N, eri.size + '');
}

// 5. Latomo selaimessa
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { console.log('(playwright puuttuu: selainosa ohitetaan)'); }
if (!chromium) { console.log(virheita ? virheita + ' virhettä.' : 'Kaikki kunnossa.'); process.exit(virheita ? 1 : 0); }
const TYYPIT = { '.html': 'text/html', '.js': 'text/javascript', '.md': 'text/markdown', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png' };
const palvelin = http.createServer((q, r) => {
  const p = path.join(JUURI, decodeURIComponent(q.url.split(/[?#]/)[0]));
  if (!p.startsWith(JUURI) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': TYYPIT[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(r);
});
palvelin.listen(0, async () => {
  const BASE = 'http://localhost:' + palvelin.address().port + '/';
  const b = await chromium.launch();
  for (const leveys of [760, 360]) {
    const p = await (await b.newContext({ viewport: { width: leveys, height: 1000 } })).newPage();
    const virheet = [];
    p.on('pageerror', e => virheet.push(e.message));
    await p.route(/workers\.dev/, r => r.abort());
    await p.goto(BASE + 'luin/latomo.html');
    await p.evaluate(() => localStorage.clear());
    await p.reload();
    await p.fill('#md', '# Koe\n\nKappale.\n');
    await p.waitForTimeout(450);
    await p.click('#laheta');
    await p.click('#laatikko-arvo');
    const t = await p.evaluate(() => {
      const e = document.querySelector('#laatikko-arvottu'), k = document.querySelector('#laatikko-koodi');
      const re = e.getBoundingClientRect(), rk = k.getBoundingClientRect();
      return { lause: k.value, nakyy: !e.hidden && re.height > 0, teksti: e.textContent, kursiivi: (e.querySelector('i') || {}).textContent,
        nappi: document.querySelector('#kk-laheta').disabled, virhe: !document.querySelector('#laatikko-virhe').hidden,
        alla: re.top >= rk.bottom, leveys: document.documentElement.scrollWidth <= innerWidth,
        ls: JSON.parse(localStorage.getItem('luin-laatikko') || 'null') };
    });
    const osat = t.lause.split('-');
    tulos(leveys + ' px: Arvo täyttää kentän kelpaavalla lauseella', osat.length === 6 && !t.virhe && !t.nappi && t.ls === t.lause, t.lause);
    tulos(leveys + ' px: virke näkyy kentän alla', t.nakyy && t.alla && t.kursiivi === osat.join(' ').replace(/^./, c => c.toUpperCase()) + '.' &&
      / Arvottu noin \d+ biljoonan lauseen joukosta\.$/.test(t.teksti), t.teksti);
    tulos(leveys + ' px: ei vaakavieritystä', t.leveys);
    if (KUVAT) await p.locator('#laatikko').screenshot({ path: path.join(KUVAT, 'arvo-' + leveys + '.png') });
    await p.click('#laatikko-arvo');
    const t2 = await p.evaluate(() => document.querySelector('#laatikko-koodi').value);
    tulos(leveys + ' px: uusi Arvo antaa uuden lauseen', t2 !== t.lause && t2.split('-').length === 6, t2);
    await p.type('#laatikko-koodi', 'x');
    const t3 = await p.evaluate(() => document.querySelector('#laatikko-arvottu').hidden);
    tulos(leveys + ' px: muokkaus piilottaa virkkeen', t3);
    await p.press('#laatikko-koodi', 'Backspace');
    const t4 = await p.evaluate(() => !document.querySelector('#laatikko-arvottu').hidden);
    tulos(leveys + ' px: palautus näyttää sen taas', t4);
    tulos(leveys + ' px: ei sivuvirheitä', !virheet.length, virheet.join(' | '));
  }
  await b.close(); palvelin.close();
  console.log(virheita ? virheita + ' virhettä.' : 'Kaikki kunnossa.');
  process.exit(virheita ? 1 : 0);
});
