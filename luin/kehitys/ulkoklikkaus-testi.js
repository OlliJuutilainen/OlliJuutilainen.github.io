// Auki olevan laatikon ulkopuolinen napautus vain sulkee sen (käyttäjän vaatimus 16.11.2026). Ajo repon juuressa:
//   NODE_PATH=$(npm root -g) node luin/kehitys/ulkoklikkaus-testi.js [kuvakansio]
// Tarkistaa hiirellä ja kosketuksella: pinossa nimikkeen valikon ja linkitysponnahduksen ohi napautettu nimike ei avaa
// tekstiä eikä asetuskiekko asetuksia; infolaatikon kiinnitetyn vihjeen ohi napautettu nimike ei avaa tekstiä; lukimessa
// alaviitteen ponnahduksen ohi napautettu sisäinen linkki ei hyppää. Lisäksi linkitysponnahduksen teksti ja Kopioi linkki
// -napin ja Luin.-napin vihje hiiren alla viiveellä (sisältö ja mahtuminen ruutuun).
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

## Ensimmäinen luku

Ensimmäinen kappale, jossa on alaviite.[^1] Katso [toinen luku](#toinen-luku).

${'Täytettä, jotta toinen luku on kaukana. '.repeat(400)}

## Toinen luku

Toinen kappale.

[^1]: Alaviitteen teksti.
`;
const LISTA = [
  { id: 'p-koeteksti', added: 3, title: 'Koeteksti', src: 'paikallinen' },
  { id: 'p-linkitetty', added: 2, title: 'Linkitetty', src: 'paikallinen', osoite: 'https://example.org/linkitetty.md' },
  { id: 'p-kolmas', added: 1, title: 'Kolmas', src: 'paikallinen' }];

async function aja(selain, U, kosketus) {
  const laji = kosketus ? 'kosketus' : 'hiiri';
  const ctx = await selain.newContext(kosketus ? { viewport: { width: 400, height: 800 }, hasTouch: true, isMobile: true }
    : { viewport: { width: 1100, height: 900 } });
  const page = await ctx.newPage();
  const virheet = [];
  page.on('pageerror', e => virheet.push(e.message));
  await page.goto(U + 'luin.html#');
  await page.evaluate(([md, l]) => {
    localStorage.setItem('luin-lista', JSON.stringify(l));
    l.forEach(e => localStorage.setItem('luin-teksti:' + e.id, JSON.stringify(md.replace('Koeteksti', e.title))));
  }, [MD, LISTA]);
  await page.reload(); await page.waitForSelector('#nimikkeet li');
  // Painetaan elementin kohtaan, jota ponnahdus ei peitä (kapealla ruudulla valikko peittää osan nimikkeistä).
  const paina = async (sel) => {
    const p = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      for (const r of el.getClientRects()) for (let d = 0; d < r.width / 2; d += 3) for (const x of [r.left + r.width / 2 - d, r.left + r.width / 2 + d]) {
        const y = r.top + r.height / 2, o = document.elementFromPoint(x, y);
        if (o && el.contains(o)) return { x, y };
      }
      return null;
    }, sel);
    if (!p) throw new Error('ei vapaata kohtaa: ' + sel + ' ' + await page.evaluate((sel) => { const r = document.querySelector(sel).getBoundingClientRect(), o = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return JSON.stringify(r) + ' ' + (o && o.outerHTML.slice(0, 120)); }, sel));
    if (kosketus) await page.touchscreen.tap(p.x, p.y); else await page.mouse.click(p.x, p.y);
    await page.waitForTimeout(80);
  };
  const tilanne = () => page.evaluate(() => ({ hash: location.hash, lukija: !document.getElementById('lukija').hidden,
    pop: !document.getElementById('pop').hidden, aset: !document.getElementById('asetukset').hidden }));

  // 1. Nimikkeen valikko auki, napautus toisen nimikkeen nimeen.
  await paina('#nimikkeet button.jako[data-id="p-koeteksti"]');
  let t0 = await tilanne();
  await paina('#nimikkeet a.avaa[href="#id=p-kolmas"]');
  let t = await tilanne();
  tulos(`${laji}: valikon ohi napautettu nimike vain sulkee valikon`, t0.pop && !t.pop && !t.lukija && t.hash === t0.hash, JSON.stringify(t));
  await paina('#nimikkeet a.avaa[href="#id=p-kolmas"]');
  await page.waitForTimeout(300);
  t = await tilanne();
  tulos(`${laji}: toinen napautus avaa nimikkeen`, t.lukija, JSON.stringify(t));
  await page.goto(U + 'luin.html#'); await page.waitForSelector('#nimikkeet li');

  // 2. Linkitysponnahdus: teksti ja ohi napautus (nimike ja asetuskiekko).
  await paina('#nimikkeet button.jako[data-id="p-koeteksti"]');
  await paina('#pop button[data-k="linkita"]');
  const kys = await page.textContent('#pop .kys');
  tulos(`${laji}: linkitysponnahduksen teksti`, kys === 'Liittämällä tähän linkin tekstin sisältämään tiedostoon, esimerkiksi pilvitallennustilasi julkisena linkkinä voit jatkossa pinossa jakaa tekstin muille luettavaksi lukimessa (puhtaana, ilman omia merkintöjäsi).', kys);
  if (KUVAT) await page.screenshot({ path: path.join(KUVAT, `ulko-linkita-${laji}.png`) });
  t0 = await tilanne();
  await paina('#nimikkeet a.avaa[href="#id=p-kolmas"]');
  t = await tilanne();
  tulos(`${laji}: linkitysponnahduksen ohi napautettu nimike vain sulkee sen`, t0.pop && !t.pop && !t.lukija && t.hash === t0.hash, JSON.stringify(t));
  await paina('#nimikkeet button.jako[data-id="p-koeteksti"]');
  await paina('#pop button[data-k="linkita"]');
  await paina('.lhead .ratas');
  t = await tilanne();
  tulos(`${laji}: linkitysponnahduksen ohi napautettu asetuskiekko vain sulkee sen`, !t.pop && !t.aset, JSON.stringify(t));

  // 3. Infolaatikon kiinnitetty vihje.
  await paina('button.info[aria-controls="tietoa"]');
  const sana = await page.$('#tietoa .t-sana.t-huilu');
  if (sana) {
    await sana.scrollIntoViewIfNeeded();
    if (kosketus) await sana.tap(); else await sana.click();
    const auki0 = await page.$eval('#tietoa', el => !!el.querySelector('.t-sana[aria-expanded="true"]'));
    // Infolaatikko peittää nimikkeet, joten ohi napautetaan asetuskiekkoa.
    await page.evaluate(() => scrollTo(0, 0));
    await paina('.lhead .ratas');
    t = await tilanne();
    const auki = await page.$eval('#tietoa', el => !!el.querySelector('.t-sana[aria-expanded="true"]'));
    tulos(`${laji}: infolaatikon vihjeen ohi napautettu asetuskiekko vain sulkee vihjeen`, auki0 && !auki && !t.aset, JSON.stringify({ auki0, auki, ...t }));
  } else tulos(`${laji}: infolaatikon vihje löytyy`, false);
  await page.goto(U + 'luin.html#'); await page.waitForSelector('#nimikkeet li');

  // 4. Kopioi linkki -napin vihje (vain hiirellä).
  if (!kosketus) {
    await paina('#nimikkeet button.jako[data-id="p-linkitetty"]');
    await page.hover('#pop button[data-k="linkki"]');
    // Vihje näkyy vasta pienen viiveen (0,6 s) jälkeen (käyttäjän pyyntö 17.11.2026).
    const nakyy = s => page.$eval(s, b => getComputedStyle(b, '::after').visibility);
    const heti = await nakyy('#pop button[data-k="linkki"]');
    await page.waitForTimeout(800);
    const myohemmin = await nakyy('#pop button[data-k="linkki"]');
    tulos('hiiri: kopioi linkki -napin vihje viiveellä', heti === 'hidden' && myohemmin === 'visible', heti + ' → ' + myohemmin);
    const v = await page.$eval('#pop button[data-k="linkki"]', b => {
      const cs = getComputedStyle(b, '::after');
      // Pseudo-elementin laatikko mitataan sen tyyleillä tehdystä kopiosta samassa paikassa.
      const k = document.createElement('span'); k.textContent = b.dataset.vihje;
      ['position', 'left', 'right', 'top', 'padding', 'whiteSpace', 'fontSize', 'fontFamily', 'lineHeight', 'border'].forEach(p => { k.style[p] = cs[p]; });
      b.appendChild(k); const r = k.getBoundingClientRect(); k.remove();
      const p = b.closest('#pop').getBoundingClientRect();
      return { content: cs.content, r: { l: r.left, r: r.right, t: r.top, b: r.bottom }, pop: { l: p.left, r: p.right }, vw: innerWidth };
    });
    tulos('hiiri: kopioi linkki -napin vihje', v.content === '"merkinnät eivät siirry jaettavassa linkissä"', v.content);
    tulos('hiiri: vihje valikon levyinen', v.r.l >= v.pop.l && v.r.r <= v.pop.r && v.r.r <= v.vw, JSON.stringify(v));
    if (KUVAT) await page.screenshot({ path: path.join(KUVAT, 'ulko-vihje.png') });
    // Luin.-napin vihje samoin viiveellä.
    await page.hover('#pop button[data-k="luin"]');
    const l0 = await nakyy('#pop button[data-k="luin"]');
    await page.waitForTimeout(800);
    const l1 = await page.$eval('#pop button[data-k="luin"]', b => { const c = getComputedStyle(b, '::after'); return c.visibility + ' ' + c.content; });
    tulos('hiiri: Luin.-napin vihje viiveellä', l0 === 'hidden' && l1 === 'visible "vie kellarin veivihyllystöön"', l0 + ' → ' + l1);
    if (KUVAT) await page.screenshot({ path: path.join(KUVAT, 'ulko-vihje-luin.png') });
    await page.keyboard.press('Escape');
    await page.goto(U + 'luin.html#'); await page.waitForSelector('#nimikkeet li');
  }

  // 5. Lukija sivutettuna (alaviite on ponnahdus): alaviitteen ponnahdus auki, napautus sisäiseen linkkiin.
  await page.evaluate(() => { const a = JSON.parse(localStorage.getItem('luin-asetukset') || '{}'); a.sivutus = 'sivut'; a.av = 7; localStorage.setItem('luin-asetukset', JSON.stringify(a)); });
  await page.reload(); await page.waitForSelector('#nimikkeet li');
  await paina('#nimikkeet a.avaa[href="#id=p-koeteksti"]');
  await page.waitForSelector('#teksti .fnref');
  // Luku alkaa uudelta sivulta: siirrytään alaviitteen kappaleeseen.
  await page.evaluate(() => window.__luin.hyppaa({ b: 2, o: 0 }, false, true));
  await page.waitForTimeout(300);
  const ennen = await page.evaluate(() => ({ y: scrollY, sivu: window.__luin && window.__luin.tila ? window.__luin.tila.sivu : null }));
  await paina('#teksti .fnref');
  await page.waitForTimeout(200);
  t0 = await tilanne();
  await paina('#teksti a[href="#toinen-luku"]');
  await page.waitForTimeout(300);
  t = await tilanne();
  const jalkeen = await page.evaluate(() => ({ y: scrollY, sivu: window.__luin && window.__luin.tila ? window.__luin.tila.sivu : null }));
  tulos(`${laji}: alaviitteen ohi napautettu linkki vain sulkee ponnahduksen`, t0.pop && !t.pop && JSON.stringify(ennen) === JSON.stringify(jalkeen), JSON.stringify({ t0pop: t0.pop, pop: t.pop, ennen, jalkeen }));
  await paina('#teksti a[href="#toinen-luku"]');
  await page.waitForTimeout(400);
  const hyppy = await page.evaluate(() => ({ y: scrollY, sivu: window.__luin && window.__luin.tila ? window.__luin.tila.sivu : null }));
  tulos(`${laji}: toinen napautus hyppää`, JSON.stringify(hyppy) !== JSON.stringify(jalkeen), JSON.stringify(hyppy));

  tulos(`${laji}: ei sivuvirheitä`, !virheet.length, virheet.join(' | '));
  await ctx.close();
}

(async () => {
  await new Promise(r => palvelin.listen(0, r));
  const U = 'http://localhost:' + palvelin.address().port + '/';
  const selain = await chromium.launch();
  try { await aja(selain, U, false); await aja(selain, U, true); }
  finally { await selain.close(); palvelin.close(); }
  console.log(virheita ? virheita + ' virhettä' : 'Kaikki kunnossa.');
  process.exit(virheita ? 1 : 0);
})();
