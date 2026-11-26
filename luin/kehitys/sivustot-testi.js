// Tuettujen sivustojen sivun haku ja korit (luin/sivustot.html). Ajo repon juuressa:
//   NODE_PATH=$(npm root -g) node luin/kehitys/sivustot-testi.js [kuvakansio]
// Tarkistaa: kaikki sivustot alussa; korit mukaan (tai saman rivin sisällä, ja rivien välillä), pois karsii pääkorin tai
// pääkielen; tyhjät kirjainryhmät piiloon ja kirjain himmeäksi; haku tarkkeetta; tyhjennä; kirjainhyppy; 360 px ilman
// vaakavieritystä ja suodatus alle 400 px; ilman skriptiä lista sellaisenaan.
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const JUURI = path.resolve(__dirname, '../..'), ULOS = process.argv[2];
const palvelin = http.createServer((q, r) => { const p = path.join(JUURI, decodeURIComponent(q.url.split(/[?#]/)[0]));
  if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png' }[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(r); });
let viat = 0; const t = (n, ok, x) => { if (!ok) viat++; console.log((ok ? 'OK   ' : 'VIKA ') + n + (x ? ' – ' + x : '')); };
(async () => {
  await new Promise(r => palvelin.listen(0, r)); const U = 'http://localhost:' + palvelin.address().port + '/';
  const b = await chromium.launch(), virheet = [];
  const page = await (await b.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 2 })).newPage();
  page.on('pageerror', e => virheet.push(e.message));
  await page.goto(U + 'luin/sivustot.html'); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(200);
  const nak = () => page.$$eval('ul.sivustot li:not([hidden])', l => l.length);
  const nimet = () => page.$$eval('ul.sivustot li:not([hidden]) > a:first-of-type', l => l.map(x => x.textContent.trim()));
  const nappi = (f, v) => page.click('button.kori[data-f="' + f + '"][data-v="' + v + '"]');
  const kaikki = await page.$$eval('ul.sivustot li', l => l.length);
  t('alussa kaikki näkyvissä', await nak() === kaikki, String(kaikki));
  const m = await page.evaluate(() => { const r = document.getElementById('suodatus').getBoundingClientRect(); return { korkeus: Math.round(r.height), vaaka: document.documentElement.scrollWidth - innerWidth }; });
  t('360 px: suodatus ei vie koko ruutua, ei vaakavieritystä', m.korkeus < 400 && !m.vaaka, JSON.stringify(m));

  await nappi('aihe', 'filosofia');
  const filo = await nak(); t('filosofia mukaan', filo === 31, String(filo));
  await nappi('laji', 'alkuteksti'); await nappi('laji', 'kirjeet');
  t('filosofia × alkuteksti/kirjeet = 13', await nak() === 13, String(await nak()));
  t('tyhjät kirjainryhmät piilossa ja kirjain himmeä', await page.evaluate(() => { const h = [...document.querySelectorAll('h2.kirjain')]; const piilo = h.filter(x => x.hidden);
    return piilo.length > 0 && piilo.every(x => document.querySelector('nav.aakkoset a[href="#' + x.id + '"]').classList.contains('tyhja')); }));
  await page.click('#s-tyhjenna');
  t('tyhjennä palauttaa kaikki', await nak() === kaikki);
  await nappi('kieli', 'englanti'); await nappi('kieli', 'englanti');
  const eiEn = await nak(); t('englanti pois (pääkieli) jättää muut', eiEn > 30 && eiEn < kaikki, String(eiEn));
  t('Perseus jää (pääkieli kreikka)', (await nimet()).includes('Perseus Digital Library'));
  await page.click('#s-tyhjenna');
  await page.fill('#s-haku', 'nagarjuna'); await page.waitForTimeout(50);
  t('haku nagarjuna (tarkkeeton) löytää GRETILin', (await nimet()).join('|').includes('GRETIL'), (await nimet()).join(' | '));
  await page.fill('#s-haku', 'liettua'); await page.waitForTimeout(50);
  const lt = await nimet(); t('haku liettua: Wikipedia muilla kielillä mukana', lt.some(x => /Wikipedia/.test(x)) || (await page.$$eval('ul.sivustot li:not([hidden])', l => l.some(x => /Wikipedia muilla/.test(x.textContent)))), lt.join(' | '));
  await page.fill('#s-haku', 'kant'); await page.waitForTimeout(50);
  t('haku kant', (await nimet()).length >= 2, (await nimet()).join(' | '));
  await page.click('#s-tyhjenna');
  t('hakukenttä tyhjenee', await page.inputValue('#s-haku') === '' && await nak() === kaikki);
  // Kirjainhyppy toimii yhä.
  await page.click('nav.aakkoset a[href="#k-S"]'); await page.waitForTimeout(150);
  t('kirjainhyppy S', await page.evaluate(() => { const h = document.getElementById('k-S').getBoundingClientRect(); return h.top >= 0 && h.top < 300; }));
  await page.evaluate(() => scrollTo(0, 0));
  await nappi('aihe', 'perimmäisyys ja uskonnot');
  const clip = await page.evaluate(() => { const a = document.getElementById('suodatus').getBoundingClientRect(); return { x: 0, y: a.top + scrollY - 8, width: innerWidth, height: a.height + 330 }; });
  if (ULOS) await page.screenshot({ path: path.join(ULOS, 'sivustot-suodatus-360.png'), clip, fullPage: true });
  t('ei sivuvirheitä', !virheet.length, virheet.join(' | '));
  // Ilman skriptiä lista näkyy sellaisenaan.
  const p2 = await (await b.newContext({ javaScriptEnabled: false, viewport: { width: 360, height: 800 } })).newPage();
  await p2.goto(U + 'luin/sivustot.html');
  t('ilman skriptiä lista näkyy, suodatus piilossa', await p2.$$eval('#sivustot li', l => l.length) === kaikki && !(await p2.isVisible('#suodatus')));
  console.log(viat ? viat + ' vikaa.' : 'Kaikki kunnossa.');
  process.exitCode = viat ? 1 : 0;
  await b.close(); palvelin.close();
})();
