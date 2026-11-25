// Kellarin veivihyllystön haku (järjestysrivin etsi). Ajo repon juuressa:
//   NODE_PATH=$(npm root -g) node luin/kehitys/kellarihaku-testi.js [kuvakansio]
// Tarkistaa: pinossa ei hakua; etsi avaa kentän; sanan alku otsikosta, tekijästä, sivustosta tai asiasanasta osuu, tarkkeet ja
// kirjainkoko eivät vaikuta, sanan keskiosa ei; välikorttien luvut ja Valitse kaikki koskevat osumia; Ei osumia; tyhjennys,
// Esc ja toinen etsi-napautus palauttavat kaikki; haku säilyy tekstistä palatessa ja nollautuu pinossa käydessä; 360 px:n
// ruudulla ei vaakavieritystä ja kenttä on 16 px (iOS ei suurenna).
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

const T = (fm, ots) => '---\n' + fm + '\n---\n\n# ' + ots + '\n\nEnsimmäinen kappale on tässä.\n';
const NYT = Date.parse('2026-11-25T10:00:00Z'), P = 86400000;
const TEKSTIT = [
  ['k-naga', T('tekijä: Nāgārjuna\nasiasanat: perimmäisyys ja uskonnot, filosofia', 'Mūlamadhyamakakārikā'), { luettu: NYT - P }],
  ['k-hegel', T('tekijä: Terry Pinkard\nasiasanat: filosofia, Hegel', 'Hegel’s Phenomenology'), { luettu: NYT - 2 * P }],
  ['k-areio', T('tyyppi: blogi\nsivusto: Areiopagi\ntekijä: Olli-Pekka Vainio', 'Tiede ja usko'), { luettu: NYT - 3 * P }],
  ['k-seneca', T('tekijä: Lucius Annaeus Seneca\nasiasanat: antiikki, filosofia', 'Kirjeitä Luciliukselle'), { luettu: NYT - 4 * P }],
  ['k-pino', T('tekijä: Hegel', 'Pinossa oleva Hegel'), {}]
];

(async () => {
  await new Promise(r => palvelin.listen(0, r));
  const U = 'http://localhost:' + palvelin.address().port + '/';
  const selain = await chromium.launch();
  const page = await (await selain.newContext({ viewport: { width: 360, height: 800 } })).newPage();
  const virheet = [];
  page.on('pageerror', e => virheet.push(e.message));
  await page.goto(U + 'luin.html#');
  await page.evaluate(([TEKSTIT]) => {
    localStorage.clear();
    const lista = [];
    TEKSTIT.forEach(([id, md, lisa], i) => {
      localStorage.setItem('luin-teksti:' + id, JSON.stringify(md));
      const d = LuinMD.parse(md);
      lista.push(Object.assign({ id, title: d.title, added: 1000 + i, src: 'paikallinen', author: d.author, sivusto: d.tiedot.sivusto || '' }, lisa));
    });
    localStorage.setItem('luin-lista', JSON.stringify(lista));
    localStorage.setItem('luin-asetukset', JSON.stringify({ kellariJarj: 'asiasana' }));
  }, [TEKSTIT]);
  let lkm = 0;
  const lataa = h => page.goto(U + 'luin.html?n=' + (++lkm) + h);
  const nimet = () => page.$$eval('#nimikkeet li.nimike .n-ots', l => [...new Set(l.map(x => x.textContent.trim()))].sort());
  const kortit = () => page.$$eval('#nimikkeet li.valiots', l => l.map(x => x.textContent.replace(/\s+/g, ' ').trim()));
  const kirjoita = async q => { await page.fill('#kk-haku input', q); await page.waitForTimeout(50); };

  await lataa('#');
  await page.waitForSelector('#nimikkeet li');
  tulos('pinossa ei etsiä eikä kenttää', !(await page.isVisible('#kk-etsi')) && await page.evaluate(() =>
    getComputedStyle(document.getElementById('jarj-rivi')).display === 'none' && getComputedStyle(document.getElementById('kk-haku')).display === 'none'));

  await lataa('#arkisto');
  await page.waitForSelector('#nimikkeet li.nimike');
  const alku = await nimet();
  tulos('kellarissa etsi näkyy, kenttä kiinni', await page.isVisible('#kk-etsi') && !(await page.isVisible('#kk-haku')), alku.join(' | '));
  await page.click('#kk-etsi');
  tulos('etsi avaa kentän ja kohdistaa sen', await page.isVisible('#kk-haku input') && await page.evaluate(() => document.activeElement === document.querySelector('#kk-haku input')) &&
    await page.getAttribute('#kk-etsi', 'aria-expanded') === 'true');
  const tapaukset = [['nagarjuna', ['Mūlamadhyamakakārikā']], ['HEGEL', ['Hegel’s Phenomenology']], ['areio', ['Tiede ja usko']],
    ['filo sen', ['Kirjeitä Luciliukselle']], ['antiikki', ['Kirjeitä Luciliukselle']], ['enology', []], ['usko tiede', ['Tiede ja usko']]];
  for (const [q, odotus] of tapaukset) {
    await kirjoita(q);
    const n = await nimet();
    tulos('haku ”' + q + '”', JSON.stringify(n) === JSON.stringify(odotus.slice().sort()), n.join(' | '));
  }
  await kirjoita('enology');
  tulos('ei osumia: viesti, ei tyhjän kellarin viestiä', await page.isVisible('#kk-ei') && !(await page.isVisible('#tyhja')));
  await kirjoita('filosofia');
  const kv = await kortit();
  tulos('välikorttien luvut osumista', kv.some(k => /^filosofia\s*3$/i.test(k)) && !kv.some(k => /ilman asiasanaa/i.test(k)), kv.join(' / '));
  await page.click('#valitse-kaikki');
  const val = await page.evaluate(() => document.getElementById('val-maara').textContent);
  tulos('valitse kaikki koskee osumia', /\b3\b/.test(val), val);
  await page.click('#valitse-kaikki');
  // Tekstistä palatessa haku säilyy.
  await page.click('#nimikkeet li.nimike a.avaa');
  await page.waitForSelector('#lukija:not([hidden])');
  await page.goBack();
  await page.waitForSelector('#nimikkeet li.nimike');
  tulos('haku säilyy tekstistä palatessa', await page.inputValue('#kk-haku input') === 'filosofia' && (await nimet()).length === 3, (await nimet()).join(' | '));
  await page.click('#kk-haku .h-tyhj');
  tulos('tyhjennys palauttaa kaikki ja pitää kentän auki', JSON.stringify(await nimet()) === JSON.stringify(alku) && await page.isVisible('#kk-haku input'));
  await kirjoita('hegel');
  await page.press('#kk-haku input', 'Escape');
  tulos('Esc sulkee ja palauttaa kaikki', !(await page.isVisible('#kk-haku')) && JSON.stringify(await nimet()) === JSON.stringify(alku));
  await page.click('#kk-etsi'); await kirjoita('seneca'); await page.click('#kk-etsi');
  tulos('toinen etsi-napautus sulkee ja palauttaa kaikki', !(await page.isVisible('#kk-haku')) && JSON.stringify(await nimet()) === JSON.stringify(alku));
  // Pinossa käynti nollaa haun.
  await page.click('#kk-etsi'); await kirjoita('seneca');
  await page.evaluate(() => { location.hash = '#'; });
  await page.waitForTimeout(200);
  await page.evaluate(() => { location.hash = '#arkisto'; });
  await page.waitForSelector('#nimikkeet li.nimike');
  await page.waitForTimeout(200);
  tulos('pinossa käynti nollaa haun', !(await page.isVisible('#kk-haku')) && JSON.stringify(await nimet()) === JSON.stringify(alku), (await nimet()).join(' | '));
  // Mitat 360 px:n ruudulla.
  await page.click('#kk-etsi');
  const m = await page.evaluate(() => ({ vaaka: document.documentElement.scrollWidth - innerWidth, fs: getComputedStyle(document.querySelector('#kk-haku input')).fontSize,
    rivi: document.getElementById('jarj-rivi').getBoundingClientRect().right, kentta: document.getElementById('kk-haku').getBoundingClientRect().right, lev: innerWidth }));
  tulos('360 px: ei vaakavieritystä, kenttä 16 px ja ruudun sisällä', m.vaaka === 0 && m.fs === '16px' && m.kentta <= m.lev && m.rivi <= m.lev, JSON.stringify(m));
  // Järjestys: nuoli ja järjestys, nimi aria-labelissa, pitkä järjestys enintään kahdella rivillä. Etsi otsikkorivillä viivan
  // yläpuolella, ei kammen päällä, otsikko yhdellä rivillä (360 px: pelkkä lasi; 320 px: otsikon alla; 412 px: lasi ja teksti).
  for (const j of ['asiasana', 'luettu']) {
    await page.evaluate(j => { const a = JSON.parse(localStorage.getItem('luin-asetukset')); a.kellariJarj = j; localStorage.setItem('luin-asetukset', JSON.stringify(a)); }, j);
    await lataa('#arkisto'); await page.waitForSelector('#nimikkeet li.nimike'); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(100);
    const n = await page.evaluate(() => { const a = document.getElementById('jarj-arvo'), b = document.getElementById('jarj'), r = document.createRange(); r.selectNodeContents(a);
      return { rivit: new Set([...r.getClientRects()].map(x => Math.round(x.top))).size, teksti: b.textContent, aria: b.getAttribute('aria-label') }; });
    tulos('360 px, ' + j + ': Järjestys on nuoli ja järjestys, nimi aria-labelissa', n.rivit <= 2 && !/Järjestys/.test(n.teksti) && n.aria === 'Järjestys: ' + n.teksti, JSON.stringify(n));
  }
  // Etsi Järjestyksen rivillä viivan alla, oikea reuna nimikkeiden valikkonapin salmiakkien vasemmalla (ei niiden kohdalla
  // x-akselilla), himmeämpi kuin nimikkeiden otsikot, ja samankorkuinen kuin Järjestys.
  for (const lev of [412, 360, 320]) {
    await page.setViewportSize({ width: lev, height: 800 }); await page.waitForTimeout(150);
    const e = await page.evaluate(() => { const r = x => x.getBoundingClientRect(), et = r(document.getElementById('kk-etsi')), rivi = r(document.querySelector('.ots-rivi')),
        s = r(document.querySelector('#nimikkeet li.nimike button.jako svg')), jb = r(document.getElementById('jarj'));
      return { rivilla: document.getElementById('jarj-rivi').contains(document.getElementById('kk-etsi')), viivanAlla: et.top >= rivi.bottom,
        rako: +(s.left - et.right).toFixed(1), samaKorkeus: Math.round(et.height) === Math.round(jb.height),
        vari: getComputedStyle(document.getElementById('kk-etsi')).color, otsikko: getComputedStyle(document.querySelector('#nimikkeet .n-ots')).color,
        vaaka: document.documentElement.scrollWidth - innerWidth }; });
    tulos(lev + ' px: Etsi viivan alla, salmiakkien vasemmalla, himmeä, Järjestyksen korkuinen', e.rivilla && e.viivanAlla && e.rako > 0 && e.samaKorkeus &&
      e.vari !== e.otsikko && !e.vaaka, JSON.stringify(e));
  }
  await page.setViewportSize({ width: 360, height: 800 }); await page.waitForTimeout(100);
  if (KUVAT) { await kirjoita('filosofia'); await page.screenshot({ path: path.join(KUVAT, 'kellarihaku-360.png') }); }
  tulos('ei sivuvirheitä', !virheet.length, virheet.join(' | '));
  await selain.close(); palvelin.close();
  console.log(virheita ? virheita + ' vikaa.' : 'Kaikki kunnossa.');
  process.exit(virheita ? 1 : 0);
})();
