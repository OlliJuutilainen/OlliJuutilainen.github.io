// Kokoruutu (luin.html krAvaus, kr-nappi). Ajo repon juuressa:
//   NODE_PATH=$(npm root -g) node luin/kehitys/kokoruutu-testi.js
// Kosketusnäytöllä nappi muistaa valinnan: tekstin avauksen jälkeinen ensimmäinen napautus vie kokoruutuun, myös
// kun kokoruudusta poistuttiin muuten kuin napista. Tietokoneella (hiiri) Luin ei mene kokoruutuun itsestään:
// vain nappi vie sinne, eikä avaus, napsautus tai näppäin vie takaisin Escin (selaimen oman poistumisen) jälkeen.
const fs = require('fs'), path = require('path'), http = require('http');
const { chromium } = require('playwright');
const JUURI = path.resolve(__dirname, '../..');
const TYYPIT = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.md': 'text/markdown', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
let virheita = 0;
function tulos(nimi, ok, tieto) { if (!ok) virheita++; console.log((ok ? 'OK   ' : 'VIKA ') + nimi + (tieto ? ' – ' + tieto : '')); }
const palvelin = http.createServer((q, r) => {
  const p = path.join(JUURI, decodeURIComponent(q.url.split(/[?#]/)[0]));
  if (!p.startsWith(JUURI) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': TYYPIT[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(r);
});
const TEKSTI = n => `# Teksti ${n}\n\n` + 'Kappale, jossa on muutama sana ja vähän enemmänkin tekstiä sivun täytteeksi.\n\n'.repeat(80);

(async () => {
  await new Promise(r => palvelin.listen(0, r));
  const U = `http://localhost:${palvelin.address().port}/`;
  const selain = await chromium.launch();
  const virheet = [];

  async function koe(nimi, asetukset) {
    const page = await (await selain.newContext(asetukset)).newPage();
    page.on('pageerror', e => virheet.push(nimi + ': ' + e.message));
    await page.goto(U + 'luin.html#'); await page.waitForFunction(() => window.LuinTekstit);
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('luin-lista', JSON.stringify([{ id: 'p-a', added: 2, title: 'Teksti A', src: 'paikallinen', ala: '' }, { id: 'p-b', added: 1, title: 'Teksti B', src: 'paikallinen', ala: '' }]));
      localStorage.setItem('luin-asetukset', JSON.stringify({ av: 11, sivutus: 'sivut' }));
    });
    await page.evaluate(([a, b]) => Promise.all([window.LuinTekstit.kirjoita('p-a', a), window.LuinTekstit.kirjoita('p-b', b)]), [TEKSTI('A'), TEKSTI('B')]);
    const avaa = async (id, lataa) => {
      if (lataa) { await page.goto(U + 'luin.html#'); await page.reload(); }
      await page.waitForFunction(() => window.__luin);
      await page.evaluate(i => { location.hash = '#id=' + i; }, id);
      await page.waitForFunction(i => { const n = window.__luin.nyt(); return n && n.e.id === i && window.__luin.tila.asetteluja > 0; }, id);
      await page.waitForTimeout(300);
    };
    const kr = () => page.evaluate(() => !!document.fullscreenElement);
    const valinta = () => page.evaluate(() => (JSON.parse(localStorage.getItem('luin-asetukset')) || {}).kokoruutu || 0);
    const napauta = async () => {
      const b = await page.evaluate(() => { const r = document.getElementById('teksti').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + 120 }; });
      if (asetukset.hasTouch) await page.touchscreen.tap(b.x, b.y); else await page.mouse.click(b.x, b.y);
      await page.waitForTimeout(300);
    };
    // Puhelimessa yläpalkki on piilossa, kunnes palkit avataan alakaistasta (#palkki-nuoli).
    const nappi = async () => {
      if (await page.evaluate(() => !document.querySelector('#kr-nappi').getClientRects().length)) {
        const k = await page.evaluate(() => { const r = document.querySelector('#palkki-nuoli').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
        await page.mouse.click(k.x, k.y); await page.waitForTimeout(200);
      }
      await page.click('#kr-nappi'); await page.waitForTimeout(300);
    };
    // Selaimen oma poistuminen (Esc, F11, Androidin takaisin-ele): ei napin kautta.
    const poistuSelaimella = async () => { await page.evaluate(() => document.exitFullscreen()); await page.waitForTimeout(300); };

    await avaa('p-a', true);
    tulos(nimi + ': avaus ilman valintaa ei vie kokoruutuun', !(await kr()));
    await nappi();
    tulos(nimi + ': nappi vie kokoruutuun', await kr());
    await poistuSelaimella();
    tulos(nimi + ': selaimen poistuminen toimii', !(await kr()));
    await napauta();
    tulos(nimi + ': saman tekstin napautus ei palauta', !(await kr()));
    await page.evaluate(() => { location.hash = '#'; }); await page.waitForTimeout(300);
    await avaa('p-b');
    await napauta();
    return { page, kr, valinta, avaa, napauta, poistuSelaimella, nappi };
  }

  // Kosketusnäyttö: valinta jää, uusi avaus ja napautus palauttaa kokoruudun (ennallaan).
  {
    const k = await koe('kosketus', { viewport: { width: 412, height: 860 }, isMobile: true, hasTouch: true });
    tulos('kosketus: valinta jää selaimen poistumisen jälkeen', (await k.valinta()) === 1);
    tulos('kosketus: seuraavan tekstin napautus palauttaa kokoruudun', await k.kr());
    await k.nappi();
    tulos('kosketus: napista poistuminen kumoaa valinnan', !(await k.kr()) && (await k.valinta()) === 0);
    await k.page.context().close();
  }
  // Tietokone: selaimen poistuminen kumoaa valinnan; avaus, napsautus ja näppäimet eivät vie kokoruutuun.
  {
    const k = await koe('tietokone', { viewport: { width: 1280, height: 800 } });
    tulos('tietokone: seuraavan tekstin napsautus ei vie kokoruutuun', !(await k.kr()));
    await k.page.keyboard.press('ArrowRight'); await k.page.waitForTimeout(300);
    tulos('tietokone: näppäin ei vie kokoruutuun', !(await k.kr()));
    await k.avaa('p-a', true); await k.napauta();
    await k.page.keyboard.press('ArrowRight'); await k.page.waitForTimeout(300);
    tulos('tietokone: uudelleenlatauksen jälkeen ei kokoruutua', !(await k.kr()));
    await k.nappi();
    tulos('tietokone: nappi vie yhä kokoruutuun', await k.kr());
    await k.nappi();
    tulos('tietokone: nappi poistuu kokoruudusta', !(await k.kr()));
    await k.page.context().close();
  }
  // Tietokone, jolle valinta on jo tallentunut: avaus, napsautus, nuoli ja Cmd-oikotie eivät vie kokoruutuun.
  {
    const page = await (await selain.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
    page.on('pageerror', e => virheet.push('tallessa: ' + e.message));
    await page.goto(U + 'luin.html#'); await page.waitForFunction(() => window.LuinTekstit);
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('luin-lista', JSON.stringify([{ id: 'p-a', added: 2, title: 'Teksti A', src: 'paikallinen', ala: '' }]));
      localStorage.setItem('luin-asetukset', JSON.stringify({ av: 11, sivutus: 'sivut', kokoruutu: 1 }));
    });
    await page.evaluate(a => window.LuinTekstit.kirjoita('p-a', a), TEKSTI('A'));
    const kr = () => page.evaluate(() => !!document.fullscreenElement);
    const tulokset = [];
    for (const ele of ['napsautus', 'ArrowRight', 'Meta+c']) {
      await page.goto(U + 'luin.html#'); await page.reload(); await page.waitForFunction(() => window.__luin);
      await page.evaluate(() => { location.hash = '#id=p-a'; });
      await page.waitForFunction(() => { const n = window.__luin.nyt(); return n && window.__luin.tila.asetteluja > 0; });
      await page.waitForTimeout(300);
      if (ele === 'napsautus') await page.mouse.click(640, 300); else await page.keyboard.press(ele);
      await page.waitForTimeout(300);
      tulokset.push(ele + ': ' + (await kr() ? 'kokoruutu' : 'ei'));
      if (await kr()) await page.evaluate(() => document.exitFullscreen());
    }
    tulos('tallessa: tietokone ei mene kokoruutuun itsestään', tulokset.every(t => / ei$/.test(t)), tulokset.join(', '));
    await page.context().close();
  }
  tulos('ei sivuvirheitä', !virheet.length, virheet.join(' | '));
  await selain.close(); palvelin.close();
  console.log(virheita ? virheita + ' vikaa' : 'kaikki kunnossa');
  process.exit(virheita ? 1 : 0);
})();
