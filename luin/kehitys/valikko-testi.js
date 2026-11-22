// Ponnahdusvalikko pienellä ruudulla (sijoitaPop()). Ajo repon juuressa:
//   NODE_PATH=$(npm root -g) node luin/kehitys/valikko-testi.js [kuvakansio]
// Tarkistaa: ruutua korkeampi valikko mahtuu ruudulle ja vierii (.vierii), sen alareuna leikkaa napin tekstin (35–50 % napista
// näkyvissä), kosketusveto vierittää valikkoa eikä sivua, alin nappi on napautettavissa ja vahvistus jää näkyviin; peräkkäiset
// valikot saavat luonnollisen leveytensä eivätkä osu ruudun reunaan; mahtuva valikko ei vieri; kierto sovittaa avoimen valikon;
// näppäimistön noustessa (visualViewport) luokittelu mahtuu näkyvään alueeseen ja Valmis. on ulottuvilla; työpöydällä rulla
// vierittää matalan ikkunan valikkoa eikä sivua.
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

// Näppäimistön jäljitelmä: oma visualViewport, jonka korkeuden testi asettaa (window.__vvH).
function vvJaljitelma() {
  const vv = new EventTarget(); vv.offsetTop = 0; vv.offsetLeft = 0; vv.scale = 1;
  Object.defineProperty(vv, 'height', { get() { return window.__vvH || innerHeight; } });
  Object.defineProperty(vv, 'width', { get() { return innerWidth; } });
  Object.defineProperty(window, 'visualViewport', { value: vv, configurable: true });
}

async function kylva(page, U) {
  await page.goto(U + 'luin.html#');
  await page.evaluate(() => {
    const l = [];
    for (let i = 0; i < 12; i++) l.push({ id: 'p-t' + i, added: 100 - i, title: 'Koeteksti numero ' + i + (i % 3 ? '' : ' jolla on melko pitkä nimi'), src: 'paikallinen', asiasanat: ['sana' + i, 'etiikka', 'logiikka'] });
    localStorage.setItem('luin-lista', JSON.stringify(l));
    for (const e of l) localStorage.setItem('luin-teksti:' + e.id, JSON.stringify('---\ntekijä: Testi Kirjoittaja\nteos: Kokoelma\n---\n\n# ' + e.title + '\n\nKappale.\n'));
  });
  await page.reload(); await page.waitForSelector('#nimikkeet li');
}
const popTila = (page) => page.evaluate(() => {
  const p = document.getElementById('pop'), r = p.getBoundingClientRect(), vv = window.visualViewport;
  return { auki: !p.hidden, vierii: p.classList.contains('vierii'), st: p.scrollTop, top: Math.round(r.top), bottom: Math.round(r.bottom),
    left: Math.round(r.left), right: Math.round(r.right), ch: p.clientHeight, sh: p.scrollHeight, ih: innerHeight, iw: innerWidth, vvH: vv ? Math.round(vv.height) : innerHeight };
});
async function veda(cdp, x, y0, y1) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: y0 }] });
  for (let i = 1; i <= 12; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y0 + (y1 - y0) * i / 12 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

(async () => {
  await new Promise(r => palvelin.listen(0, r));
  const U = 'http://localhost:' + palvelin.address().port + '/';
  const selain = await chromium.launch();
  const virheet = [];

  // 1. Matala kosketusruutu (puhelin vaakana): nimikkeen valikko vierii.
  {
    const ctx = await selain.newContext({ viewport: { width: 640, height: 360 }, hasTouch: true, isMobile: true });
    const page = await ctx.newPage(); page.on('pageerror', e => virheet.push(e.message));
    const cdp = await ctx.newCDPSession(page);
    await kylva(page, U);
    await page.evaluate(() => document.querySelector('#nimikkeet button.jako[data-id="p-t5"]').scrollIntoView({ block: 'center' }));
    await page.tap('#nimikkeet button.jako[data-id="p-t5"]');
    let t = await popTila(page);
    tulos('640×360: valikko vierii ja mahtuu ruudulle', t.auki && t.vierii && t.top >= 8 && t.bottom <= t.ih - 8 && t.sh > t.ch, JSON.stringify(t));
    const leikattu = await page.evaluate(() => {
      const p = document.getElementById('pop'), reuna = p.getBoundingClientRect().bottom - 1;
      return [...p.querySelectorAll('button')].map(b => b.getBoundingClientRect()).filter(r => r.top < reuna && r.bottom > reuna).map(r => (reuna - r.top) / r.height);
    });
    tulos('640×360: alareuna leikkaa napin tekstin (35–50 % näkyvissä)', leikattu.length === 1 && leikattu[0] >= .34 && leikattu[0] <= .51, leikattu.map(x => x.toFixed(2)).join());
    if (KUVAT) await page.screenshot({ path: path.join(KUVAT, 'valikko-vierii.png') });
    const sy0 = await page.evaluate(() => scrollY);
    await veda(cdp, (t.left + t.right) / 2, t.top + (t.bottom - t.top) * .7, t.top + 20);
    await page.waitForTimeout(1500);
    const t2 = await popTila(page), sy1 = await page.evaluate(() => scrollY);
    tulos('640×360: kosketusveto vierittää valikkoa, ei sivua', t2.auki && t2.st > 0 && sy1 === sy0, 'valikko ' + t2.st + ', sivu ' + sy0 + '→' + sy1);
    const p = await page.evaluate(() => {
      const b = document.querySelector('#pop button[data-k="poista"]'), r = b.getBoundingClientRect();
      const o = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, osuu: b.contains(o) };
    });
    tulos('640×360: alin nappi (poista) ulottuvilla', p.osuu, JSON.stringify(p));
    if (p.osuu) {
      await page.touchscreen.tap(p.x, p.y);
      const v = await page.evaluate(() => {
        const b = document.querySelector('#pop button[data-k="poista"]'), r = b.getBoundingClientRect(), q = document.getElementById('pop').getBoundingClientRect();
        return { teksti: b.textContent, nakyy: r.top >= q.top && r.bottom <= q.bottom, oikea: Math.round(q.right), iw: innerWidth };
      });
      tulos('640×360: vahvistus näkyvissä ja valikko ruudulla', /^Vahvista/.test(v.teksti) && v.nakyy && v.oikea <= v.iw - 8, JSON.stringify(v));
      if (KUVAT) await page.screenshot({ path: path.join(KUVAT, 'valikko-vahvistus.png') });
    }
    await ctx.close();
  }

  // 2. Puhelin pystyssä: mahtuva valikko ei vieri, peräkkäiset valikot luonnollisen levyisiä, kierto sovittaa.
  {
    const ctx = await selain.newContext({ viewport: { width: 360, height: 740 }, hasTouch: true, isMobile: true });
    const page = await ctx.newPage(); page.on('pageerror', e => virheet.push(e.message));
    await kylva(page, U);
    const leveydet = [];
    for (const i of [0, 4, 6, 8, 10]) {
      const s = '#nimikkeet button.jako[data-id="p-t' + i + '"]';
      await page.evaluate(s => document.querySelector(s).scrollIntoView({ block: 'center' }), s);
      await page.tap(s);
      const t = await popTila(page);
      leveydet.push({ i, ...t });
      await page.evaluate(() => { document.getElementById('pop').hidden = true; });
    }
    const huono = leveydet.filter(t => t.vierii || t.left < 8 || t.right > t.iw - 8 || t.bottom > t.ih);
    tulos('360×740: valikot mahtuvat eivätkä vieri tai osu ruudun reunaan', !huono.length, JSON.stringify(huono.length ? huono : leveydet.map(t => [t.left, t.right])));
    // Sama valikko kahdesti: sama paikka ja koko (leveys ei riipu edellisestä valikosta).
    await page.tap('#nimikkeet button.jako[data-id="p-t10"]');
    const a = await popTila(page);
    await page.evaluate(() => { document.getElementById('pop').hidden = true; });
    await page.tap('#nimikkeet button.jako[data-id="p-t10"]');
    const b = await popTila(page);
    tulos('360×740: sama valikko toistuu samana', a.left === b.left && a.right === b.right && a.bottom === b.bottom, JSON.stringify([a.left, a.right, a.bottom, b.left, b.right, b.bottom]));
    await page.setViewportSize({ width: 740, height: 360 }); await page.waitForTimeout(300);
    let t = await popTila(page);
    tulos('kierto vaakaan: avoin valikko vierii ja mahtuu', t.auki && t.vierii && t.top >= 8 && t.bottom <= t.ih - 8 && t.right <= t.iw - 8, JSON.stringify(t));
    await page.setViewportSize({ width: 360, height: 740 }); await page.waitForTimeout(300);
    t = await popTila(page);
    tulos('kierto takaisin: valikko ei enää vieri', t.auki && !t.vierii && t.bottom <= t.ih && t.right <= t.iw - 8, JSON.stringify(t));
    await ctx.close();
  }

  // 3. Näppäimistö: luokittelun tekstikenttä ja kutistuva näkyvä alue.
  {
    const ctx = await selain.newContext({ viewport: { width: 360, height: 740 }, hasTouch: true, isMobile: true });
    await ctx.addInitScript(vvJaljitelma);
    const page = await ctx.newPage(); page.on('pageerror', e => virheet.push(e.message));
    await kylva(page, U);
    await page.tap('#nimikkeet button.jako[data-id="p-t2"]');
    await page.tap('#pop button[data-k="luokittele"]');
    await page.focus('#pop .lk-uusi');
    await page.evaluate(() => { window.__vvH = 300; visualViewport.dispatchEvent(new Event('resize')); });
    let t = await popTila(page);
    const kentta = await page.evaluate(() => {
      const r = document.querySelector('#pop .lk-uusi').getBoundingClientRect(), p = document.getElementById('pop').getBoundingClientRect();
      return r.top >= p.top && r.bottom <= p.bottom;
    });
    tulos('näppäimistö: luokittelu mahtuu näkyvään alueeseen ja tekstikenttä näkyy', t.auki && t.vierii && t.top >= 8 && t.bottom <= t.vvH - 8 && kentta, JSON.stringify(t));
    const valmis = await page.evaluate(() => {
      const p = document.getElementById('pop'); p.scrollTop = p.scrollHeight;
      const b = document.querySelector('#pop button[data-k="ok"]'), r = b.getBoundingClientRect();
      const o = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return b.contains(o) && r.bottom <= window.__vvH;
    });
    tulos('näppäimistö: Valmis. ulottuvilla', valmis);
    if (KUVAT) await page.screenshot({ path: path.join(KUVAT, 'valikko-nappaimisto.png') });
    // Kenttä menettää kohdistuksen ja näppäimistö laskeutuu: vain näkyvän alueen resize (ei ikkunan).
    await page.evaluate(() => { document.activeElement.blur(); window.__vvH = 0; visualViewport.dispatchEvent(new Event('resize')); });
    t = await popTila(page);
    tulos('näppäimistön laskettua luokittelu ei vieri', t.auki && !t.vierii && t.bottom <= t.ih, JSON.stringify(t));
    await ctx.close();
  }

  // 4. Työpöytä, matala ikkuna: rulla vierittää valikkoa eikä sivua.
  {
    const ctx = await selain.newContext({ viewport: { width: 1100, height: 360 } });
    const page = await ctx.newPage(); page.on('pageerror', e => virheet.push(e.message));
    await kylva(page, U);
    await page.click('#nimikkeet button.jako[data-id="p-t0"]');
    const t = await popTila(page);
    tulos('työpöytä 1100×360: valikko vierii ja mahtuu', t.vierii && t.top >= 8 && t.bottom <= t.ih - 8, JSON.stringify(t));
    const sy0 = await page.evaluate(() => scrollY);
    await page.mouse.move((t.left + t.right) / 2, (t.top + t.bottom) / 2);
    await page.mouse.wheel(0, 400); await page.waitForTimeout(300);
    const t2 = await popTila(page), sy1 = await page.evaluate(() => scrollY);
    tulos('työpöytä: rulla vierittää valikkoa, ei sivua', t2.st > 0 && sy1 === sy0, 'valikko ' + t2.st + ', sivu ' + sy0 + '→' + sy1);
    await page.click('#pop button[data-k="poista"]', { timeout: 3000 }).catch(() => {});
    const teksti = await page.$eval('#pop button[data-k="poista"]', b => b.textContent);
    tulos('työpöytä: alin nappi klikattavissa', /^Vahvista/.test(teksti), teksti);
    await ctx.close();
  }

  tulos('ei sivuvirheitä', !virheet.length, virheet.join(' | '));
  await selain.close(); palvelin.close();
  console.log(virheita ? virheita + ' vikaa' : 'Kaikki kunnossa');
  process.exit(virheita ? 1 : 0);
})();
