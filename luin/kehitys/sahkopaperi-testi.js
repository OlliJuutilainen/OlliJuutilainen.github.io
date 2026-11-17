// Korkea kontrasti ja sähköpapyrosointi (käyttäjän pyyntö 17.11.2026). Ajo repon juuressa:
//   NODE_PATH=$(npm root -g) node luin/kehitys/sahkopaperi-testi.js [kuvakansio]
// Tarkistaa: 1) Sähköpapyrosoi asetukset -nappi on Ulkoasu-otsikon rivillä (työpöytä ja 360 px), ei peitä asetusten raksia;
// 2) painallus asettaa taulun asetukset, nappi on käänteinen PAPYRUS_MS ajan ja palaa, toinen painallus kesken ei tee
// mitään, ja jo papyrosoiduilla asetuksilla nappi sanoo *Jo sähköpapyrosoitu*; 3) korkeassa kontrastissa tausta on täysin
// valkoinen tai musta, eikä yhdenkään näkyvän tekstin, reunuksen tai taustan tehollinen sävy (läpikuultavuus laskettuna)
// ole taustan puoleisella puolella sähköpaperin mustavalkokynnystä (luminanssi 128) asetuksissa eikä lukimessa.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const JUURI = path.resolve(__dirname, '../..');
const KUVAT = process.argv[2];
const TYYPIT = { '.html': 'text/html', '.js': 'text/javascript', '.md': 'text/markdown', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png' };
const palvelin = http.createServer((q, r) => {
  const p = path.join(JUURI, decodeURIComponent(q.url.split(/[?#]/)[0]));
  if (!p.startsWith(JUURI) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': TYYPIT[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(r);
});

let virheita = 0;
function tulos(nimi, ok, tieto) { if (!ok) virheita++; console.log((ok ? 'OK   ' : 'VIKA ') + nimi + (tieto ? ' – ' + tieto : '')); }

const MD = `# Koeteksti

*Alaotsikko kokeeksi*

## Ensimmäinen luku

Ensimmäinen kappale, jossa on alaviite.[^1] Katso [toinen luku](#toinen-luku).

> Lainaus, joka on tarpeeksi pitkä erottuakseen leipätekstistä.

### Osio

${'Täytettä kappaleeksi. '.repeat(60)}

## Toinen luku

Toinen kappale.

[^1]: Alaviitteen teksti.
`;
const SAHKOPAPERI = { teema: 'vaalea', kontrasti: 1, sivutus: 'sivut', sivuReuna: 1, sivuPyyhka: 0, sivunapit: 1 };

// Näkyvien elementtien tehollinen sävy: väri sekoitettuna taustaan oman alfan ja esivanhempien läpikuultavuuden mukaan.
// Palauttaa luminanssit, jotka ovat taustan puolella kynnystä, ja niiden lähteet.
function tarkastaSavyt(juuriSel) {
  const lum = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;
  const rgb = s => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const v = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: v[0], g: v[1], b: v[2], a: v.length > 3 ? v[3] : 1 }; };
  const pohja = rgb(getComputedStyle(document.body).backgroundColor);
  const pL = lum(pohja.r, pohja.g, pohja.b), vaalea = pL > 128;
  const huonot = [];
  const juuri = document.querySelector(juuriSel);
  const opas = el => { let o = 1; for (let e = el; e && e.nodeType === 1; e = e.parentElement) o *= +getComputedStyle(e).opacity; return o; };
  const tarkista = (el, mika, c) => {
    const v = rgb(c); if (!v || v.a === 0) return;
    const a = v.a * opas(el), L = lum(v.r, v.g, v.b) * a + pL * (1 - a);
    if (Math.abs(L - pL) < 0.5) return; // sama kuin tausta: ei näy
    if (vaalea ? L > 128 : L < 128) huonot.push({ L: Math.round(L), mika, el: el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : ''), teksti: (el.textContent || '').trim().slice(0, 30) });
  };
  for (const el of juuri.querySelectorAll('*')) {
    if (!el.getClientRects().length) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden') continue;
    const r = el.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) continue;
    if ([...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) tarkista(el, 'teksti', cs.color);
    if (el instanceof SVGElement) {
      if (cs.fill && cs.fill !== 'none' && el.tagName !== 'svg') tarkista(el, 'fill', cs.fill);
      if (cs.stroke && cs.stroke !== 'none' && el.tagName !== 'svg') tarkista(el, 'stroke', cs.stroke);
    }
    for (const s of ['Top', 'Right', 'Bottom', 'Left'])
      if (parseFloat(cs['border' + s + 'Width']) > 0 && cs['border' + s + 'Style'] !== 'none') tarkista(el, 'reunus', cs['border' + s + 'Color']);
    tarkista(el, 'tausta', cs.backgroundColor);
  }
  return { pohja: Math.round(pL), huonot };
}

async function aja(selain, U, kosketus) {
  const laji = kosketus ? '360 px kosketus' : 'työpöytä';
  const ctx = await selain.newContext(kosketus ? { viewport: { width: 360, height: 740 }, hasTouch: true, isMobile: true }
    : { viewport: { width: 1100, height: 900 } });
  const page = await ctx.newPage();
  const virheet = [];
  page.on('pageerror', e => virheet.push(e.message));
  await page.goto(U + 'luin.html#');
  await page.evaluate((md) => {
    localStorage.clear();
    localStorage.setItem('luin-lista', JSON.stringify([{ id: 'p-koe', added: 1, title: 'Koeteksti', src: 'paikallinen' }]));
    localStorage.setItem('luin-teksti:p-koe', JSON.stringify(md));
    // Lähtötila tahallaan papyrosoinnin vastakohta: tumma, rullaus, pyyhkäisy päällä, painikkeet pois.
    localStorage.setItem('luin-asetukset', JSON.stringify({ teema: 'tumma', sivutus: 'vieritys', sivuReuna: 0, sivuPyyhka: 1, sivunapit: 0, av: 8 }));
  }, MD);
  await page.reload(); await page.waitForSelector('#nimikkeet li');
  const napauta = async (sel) => { if (kosketus) await page.tap(sel); else await page.click(sel); };

  await napauta('.lhead .ratas');
  await page.waitForSelector('#asetukset:not([hidden])');
  // 1. Paikka.
  const p = await page.evaluate(() => {
    const n = document.getElementById('papyrosoi'), h = document.querySelector('.aset-ots h3'), s = document.querySelector('#asetukset .sulje');
    const nr = n.getBoundingClientRect(), hr = h.getBoundingClientRect(), sr = s.getBoundingClientRect(), pr = document.getElementById('asetukset').getBoundingClientRect();
    const o = document.elementFromPoint(sr.left + sr.width / 2, sr.top + sr.height / 2);
    const cs = getComputedStyle(n);
    return { samaRivi: Math.abs((nr.top + nr.bottom) / 2 - (hr.top + hr.bottom) / 2) < 3, oikea: Math.round(pr.right - nr.right), leveys: Math.round(nr.width),
      raksi: !!(o && s.contains(o)), tyyli: [cs.fontStyle, cs.fontWeight, cs.textTransform, cs.color].join(' '), teksti: n.textContent };
  });
  tulos(`${laji}: nappi Ulkoasu-otsikon rivillä`, p.samaRivi, JSON.stringify(p));
  tulos(`${laji}: nappi ei peitä raksia`, p.raksi);
  tulos(`${laji}: kursiivi, ohut, versaali`, /^italic 380 uppercase/.test(p.tyyli), p.tyyli);
  // Mittarin kontrolli: tavallisessa tummassa teemassa viiva (#4b3e2f) on taustan puolella kynnystä, joten löydöksiä pitää olla.
  const kontrolli = await page.evaluate(tarkastaSavyt, '#asetukset');
  tulos(`${laji}: mittari löytää rajasävyt tavallisesta teemasta`, kontrolli.huonot.length > 5, kontrolli.huonot.length + ' kpl, esim. ' + JSON.stringify(kontrolli.huonot[0]));
  if (KUVAT) await page.screenshot({ path: path.join(KUVAT, `sahkopaperi-ennen-${kosketus ? 'kapea' : 'levea'}.png`) });

  // 2. Painallus.
  await napauta('#papyrosoi');
  const t0 = Date.now();
  const heti = await page.evaluate(() => ({ aset: Object.assign({}, window.__luin.aset), tehty: document.getElementById('papyrosoi').classList.contains('tehty'),
    teksti: document.getElementById('papyrosoi').textContent, kontrasti: document.documentElement.classList.contains('kontrasti'),
    pohja: getComputedStyle(document.body).backgroundColor, muste: getComputedStyle(document.body).color,
    tallessa: JSON.parse(localStorage.getItem('luin-asetukset')) }));
  const vaarat = Object.keys(SAHKOPAPERI).filter(k => heti.aset[k] !== SAHKOPAPERI[k] || heti.tallessa[k] !== SAHKOPAPERI[k]);
  tulos(`${laji}: asetukset papyrosoitu ja tallessa`, !vaarat.length, vaarat.join(', '));
  tulos(`${laji}: nappi käänteinen ja sanoo tehdyn`, heti.tehty && heti.teksti === '[Sähköpapyrosoitu]', heti.teksti);
  tulos(`${laji}: korkea kontrasti valkoisella`, heti.kontrasti && heti.pohja === 'rgb(255, 255, 255)' && heti.muste === 'rgb(0, 0, 0)', heti.pohja + ' ' + heti.muste);
  const kytkimet = await page.evaluate(() => [...document.querySelectorAll('#asetukset button[data-kytkin="kontrasti"], #asetukset button[data-kytkin^="sivu"], #asetukset .asetus[data-a="teema"] .valinnat button[data-arvo], #asetukset .asetus[data-a="sivutus"] .valinnat button[data-arvo]')].map(b => (b.dataset.kytkin || b.dataset.arvo) + '=' + b.getAttribute('aria-pressed')).join(' '));
  tulos(`${laji}: kytkimet näyttävät uuden tilan heti`, kytkimet === 'vaalea=true tumma=false kontrasti=true vieritys=false sivut=true sivuReuna=true sivuPyyhka=false sivunapit=true', kytkimet);
  if (KUVAT) await page.screenshot({ path: path.join(KUVAT, `sahkopaperi-painettu-${kosketus ? 'kapea' : 'levea'}.png`) });
  // Toinen painallus kesken ei pidennä eikä muuta.
  await page.waitForTimeout(500);
  await napauta('#papyrosoi');
  await page.waitForTimeout(Math.max(0, 1300 - (Date.now() - t0)));
  const kesken = await page.evaluate(() => document.getElementById('papyrosoi').textContent);
  tulos(`${laji}: toinen painallus kesken ei vaihda tekstiä`, kesken === '[Sähköpapyrosoitu]', kesken);
  await page.waitForTimeout(Math.max(0, 1700 - (Date.now() - t0)));
  const jalkeen = await page.evaluate(() => ({ tehty: document.getElementById('papyrosoi').classList.contains('tehty'), teksti: document.getElementById('papyrosoi').textContent }));
  tulos(`${laji}: palaa noin 1,5 s:n kuluttua`, !jalkeen.tehty && jalkeen.teksti === '[Sähköpapyrosoi asetukset]', JSON.stringify(jalkeen));
  await napauta('#papyrosoi');
  const jo = await page.evaluate(() => document.getElementById('papyrosoi').textContent);
  tulos(`${laji}: jo papyrosoidulla *Jo sähköpapyrosoitu*`, jo === '[Jo sähköpapyrosoitu]', jo);
  await page.waitForTimeout(1600);

  // 3. Sävyt asetuksissa ja lukimessa, vaalea ja tumma.
  let s = await page.evaluate(tarkastaSavyt, '#asetukset');
  tulos(`${laji}: asetuksissa ei haaleita sävyjä (vaalea)`, !s.huonot.length, JSON.stringify(s.huonot.slice(0, 6)));
  await napauta('#asetukset .sulje');
  await page.evaluate(() => { location.hash = '#id=p-koe'; });
  await page.waitForSelector('#lukija:not([hidden])', { state: 'attached' }); await page.waitForTimeout(600);
  // Palkkiopas tai palkit voivat olla auki; napautus tyhjään kohtaan ei kuulu tähän, joten suljetaan opas tarvittaessa.
  await page.evaluate(() => { const o = document.getElementById('palkkiopas'); if (o) o.hidden = true; });
  s = await page.evaluate(tarkastaSavyt, '#lukija');
  tulos(`${laji}: lukimessa ei haaleita sävyjä (vaalea)`, !s.huonot.length, JSON.stringify(s.huonot.slice(0, 6)));
  if (KUVAT) await page.screenshot({ path: path.join(KUVAT, `sahkopaperi-lukin-vaalea-${kosketus ? 'kapea' : 'levea'}.png`) });
  await page.goto(U + 'luin.html#'); await page.waitForSelector('#nimikkeet li');
  await napauta('.lhead .ratas'); await page.waitForSelector('#asetukset:not([hidden])');
  await napauta('#asetukset .asetus[data-a="teema"] button[data-arvo="tumma"]');
  s = await page.evaluate(tarkastaSavyt, '#asetukset');
  tulos(`${laji}: asetuksissa ei tummia rajasävyjä (tumma)`, !s.huonot.length, JSON.stringify(s.huonot.slice(0, 6)));
  if (KUVAT) await page.screenshot({ path: path.join(KUVAT, `sahkopaperi-asetukset-tumma-${kosketus ? 'kapea' : 'levea'}.png`) });
  await napauta('#asetukset .sulje');
  await page.evaluate(() => { location.hash = '#id=p-koe'; });
  await page.waitForSelector('#lukija:not([hidden])', { state: 'attached' }); await page.waitForTimeout(600);
  await page.evaluate(() => { const o = document.getElementById('palkkiopas'); if (o) o.hidden = true; });
  const tp = await page.evaluate(() => getComputedStyle(document.body).backgroundColor + ' ' + getComputedStyle(document.body).color);
  tulos(`${laji}: tumma korkea kontrasti mustalla`, tp === 'rgb(0, 0, 0) rgb(255, 255, 255)', tp);
  s = await page.evaluate(tarkastaSavyt, '#lukija');
  tulos(`${laji}: lukimessa ei tummia rajasävyjä (tumma)`, !s.huonot.length, JSON.stringify(s.huonot.slice(0, 6)));
  if (KUVAT) await page.screenshot({ path: path.join(KUVAT, `sahkopaperi-lukin-tumma-${kosketus ? 'kapea' : 'levea'}.png`) });
  tulos(`${laji}: ei sivuvirheitä`, !virheet.length, virheet.join(' | '));
  await ctx.close();
}

(async () => {
  await new Promise(r => palvelin.listen(0, r));
  const U = `http://127.0.0.1:${palvelin.address().port}/`;
  const selain = await chromium.launch();
  try { await aja(selain, U, false); await aja(selain, U, true); }
  finally { await selain.close(); palvelin.close(); }
  console.log(virheita ? `\n${virheita} vikaa` : '\nKaikki kunnossa');
  process.exit(virheita ? 1 : 0);
})();
