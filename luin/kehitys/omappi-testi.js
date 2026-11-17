// Ö-mappien mappi ö ja cellarin campihyllystön otsikon kampi (käyttäjän pyyntö 17.11.2026). Ajo repon juuressa:
//   NODE_PATH=$(npm root -g) node luin/kehitys/omappi-testi.js [kuvakansio]
// Tarkistaa: linkit (pinosta kellariin, kellarista ö-mappiin vain kun siellä on jotain), siirto ja palautus nimikkeen ja
// valittujen valikosta, ö-mapin tekstit eivät näy pinossa eikä kellarissa, lukijan paluumerkki, otsikon kammen napa
// samalla korkeudella perusviivasta kuin kellarilinkin kammen napa.
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const JUURI = path.resolve(__dirname, '../..'), KUVAT = process.argv[2];
const TYYPIT = { '.html': 'text/html', '.js': 'text/javascript', '.md': 'text/markdown', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png' };
const palvelin = http.createServer((q, r) => {
  const p = path.join(JUURI, decodeURIComponent(q.url.split(/[?#]/)[0]));
  if (!p.startsWith(JUURI) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': TYYPIT[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(r);
});
let vik = 0; const t = (n, ok, x) => { if (!ok) vik++; console.log((ok ? 'OK   ' : 'VIKA ') + n + (x ? ' – ' + x : '')); };
(async () => {
  await new Promise(r => palvelin.listen(0, r));
  const U = 'http://localhost:' + palvelin.address().port + '/';
  const b = await chromium.launch();
  const page = await (await b.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 2 })).newPage();
  const virheet = []; page.on('pageerror', e => virheet.push(e.message));
  await page.goto(U + 'luin.html#');
  await page.evaluate(() => {
    localStorage.clear();
    const lista = [];
    [['a', 'Ensimmäinen', { luettu: 3 }], ['b', 'Toinen', { luettu: 2 }], ['c', 'Pinossa', {}]].forEach(([id, ot, l], i) => {
      localStorage.setItem('luin-teksti:p-' + id, JSON.stringify('# ' + ot + '\n\nTeksti.\n'));
      lista.push(Object.assign({ id: 'p-' + id, title: ot, added: 1000 + i, src: 'paikallinen', ala: '' }, l));
    });
    localStorage.setItem('luin-lista', JSON.stringify(lista));
  });
  await page.reload(); await page.waitForTimeout(300);
  t('pino: kellarilinkki näkyy', await page.isVisible('#ark-linkki'));
  t('pino: ö-linkki piilossa', !(await page.isVisible('#om-linkki')));
  if (KUVAT) await page.locator('#ark-linkki').screenshot({ path: KUVAT + '/linkki.png' });
  // Merkin keskikohdan (kammessa napa, viewBoxin y .953 / 2) korkeus perusviivasta.
  const napa = (sel, f = .953 / 2) => page.evaluate(([sel, f]) => {
    const s = document.querySelector(sel), el = s.parentNode, pr = document.createElement('span');
    pr.style.cssText = 'display:inline-block;width:0;height:0'; el.appendChild(pr);
    const bl = pr.getBoundingClientRect().bottom; pr.remove(); const r = s.getBoundingClientRect();
    return bl - (r.top + r.height * f);
  }, [sel, f]);
  // Rako: merkin vasen reuna viimeisen kirjaimen musteesta (Range-laatikko ilman loppuharvennusta).
  const rako = (sel) => page.evaluate(sel => {
    const s = document.querySelector(sel), tn = s.parentNode.firstChild, rg = document.createRange();
    rg.setStart(tn, tn.length - 1); rg.setEnd(tn, tn.length);
    const ls = parseFloat(getComputedStyle(s.parentNode).letterSpacing);
    return { px: s.getBoundingClientRect().left - (rg.getBoundingClientRect().right - ls), em: parseFloat(getComputedStyle(s).fontSize) };
  }, sel);
  const linkinNapa = await napa('#ark-linkki svg.veivi');
  t('pino: otsikko', (await page.textContent('#lista-ots')) === 'Pino');
  const pNapa = await napa('h2.ots svg.pinom', .5), pRako = await rako('h2.ots svg.pinom');
  t('pinon otsikon pinomerkki versaalien keskellä', Math.abs(pNapa - linkinNapa) < .3, pNapa.toFixed(2) + ' / ' + linkinNapa.toFixed(2) + ' px perusviivasta');
  t('pinomerkin rako 1 em', Math.abs(pRako.px / pRako.em - 1) < .02, (pRako.px / pRako.em).toFixed(3) + ' em');
  t('pinomerkki ei kasvata otsikkoriviä', (await page.evaluate(() => document.querySelector('.ots-rivi').getBoundingClientRect().height)) <= 31);
  if (KUVAT) await page.locator('.ots-rivi').screenshot({ path: KUVAT + '/otsikko-pino.png' });
  await page.click('#ark-linkki a'); await page.waitForTimeout(200);
  t('kellari: otsikko', (await page.textContent('#lista-ots')) === 'Cellarin campihyllystö');
  t('kellari: ö-linkki piilossa (tyhjä)', !(await page.isVisible('#om-linkki')));
  if (KUVAT) await page.locator('.ots-rivi').screenshot({ path: KUVAT + '/otsikko.png' });
  const m = await page.evaluate(() => {
    const r = s => document.querySelector(s).getBoundingClientRect();
    const k = r('h2.ots svg.kampi'), sp = r('h2.ots .ots-merkki');
    return { kTop: k.top - sp.top, kLeft: k.left - sp.right, kH: k.height, spH: sp.height, rivi: r('.ots-rivi').height, oikea: k.right, ruutu: innerWidth };
  });
  const otsNapa = await napa('h2.ots svg.kampi');
  t('otsikon kammen napa linkin kammen korkeudella', Math.abs(otsNapa - linkinNapa) < .3, otsNapa.toFixed(2) + ' / ' + linkinNapa.toFixed(2) + ' px perusviivasta');
  t('kampi ei kasvata otsikkoriviä', m.rivi <= 31, m.rivi + ' px');
  const kRako = await rako('h2.ots svg.kampi');
  t('kammen rako 1 em', Math.abs(kRako.px / kRako.em - 1) < .02, (kRako.px / kRako.em).toFixed(3) + ' em');
  await page.click('#nimikkeet li.nimike >> nth=0 >> button.jako');
  const nap = await page.$$eval('#pop button', bs => bs.map(x => x.textContent));
  t('valikossa poiminta ja siirto', nap.includes('Poimi cellarin campihyllystöstä.') && nap.includes('Siirrä ö-mappien mappiin ö.'), nap.slice(-4).join(' | '));
  if (KUVAT) await page.screenshot({ path: KUVAT + '/valikko.png' });
  await page.click('#pop button[data-k="omappi"]'); await page.click('#pop button[data-k="ok"]'); await page.waitForTimeout(150);
  t('siirron viesti', (await page.textContent('#viesti')) === 'Teksti siirtyi ö-mappien mappiin ö.');
  t('kellarissa 1 nimike', (await page.$$('#nimikkeet li.nimike')).length === 1);
  t('kellari: ö-linkki näkyy', await page.isVisible('#om-linkki'));
  // Mappisulkimen renkaat (käyttäjän pyyntö 17.11.2026): sama säde kuin kellarilinkin kammessa, alareuna alleviivauksen tasolla,
  // alleviivaus renkaan alakärjestä toiseen, ei nuolta.
  const om = await page.evaluate(() => {
    const a = document.querySelector('#om-linkki a'), ar = a.getBoundingClientRect(), r = [...a.querySelectorAll('svg.orengas')].map(x => x.getBoundingClientRect()),
      ps = getComputedStyle(a, '::before'), em = parseFloat(getComputedStyle(a).fontSize);
    return { n: r.length, lev: r.map(x => x.width / em), vas: r[0].left - ar.left, oik: ar.right - r[1].right, ala: r.map(x => x.bottom - ar.bottom),
      viiva: [parseFloat(ps.left) / em, parseFloat(ps.right) / em, ps.borderBottomWidth, ps.bottom], oma: getComputedStyle(a).borderBottomColor,
      nuoli: !!a.querySelector('svg.nuoli'), teksti: a.getAttribute('aria-label') };
  });
  t('ö-linkin renkaat kammen kokoisia', om.n === 2 && om.lev.every(x => Math.abs(x - 1.788) < .01), JSON.stringify(om.lev));
  t('renkaat ääripäissä, alareuna kuten kammessa', Math.abs(om.vas) < .5 && Math.abs(om.oik) < .5 && om.ala.every(x => Math.abs(x) < .1), JSON.stringify(om));
  t('alleviivaus renkaiden alakärjestä toiseen, ei nuolta', Math.abs(om.viiva[0] - .894) < .01 && Math.abs(om.viiva[1] - .894) < .01 && om.viiva[2] === '1px' &&
    om.oma === 'rgba(0, 0, 0, 0)' && !om.nuoli && om.teksti === 'ö-mappien mappi ö', JSON.stringify(om));
  if (KUVAT) await page.locator('#om-linkki').screenshot({ path: KUVAT + '/om-linkki.png' });
  if (KUVAT) await page.screenshot({ path: KUVAT + '/kellari.png', fullPage: true });
  await page.click('#om-linkki a'); await page.waitForTimeout(200);
  t('ö-mappi: hash', page.url().endsWith('#omappi'));
  t('ö-mappi: otsikko', (await page.textContent('#lista-ots')) === 'Ö-mappien mappi ö');
  t('ö-mappi: 1 nimike', (await page.$$('#nimikkeet li.nimike')).length === 1);
  t('ö-mappi: linkit piilossa', !(await page.isVisible('#om-linkki')) && !(await page.isVisible('#ark-linkki')) && !(await page.isVisible('#jarj-rivi')));
  t('ö-mappi: ei Takaisin pinoon -tekstiä eikä pinomerkkiä', !(await page.isVisible('#ark-takaisin')) && !(await page.isVisible('#ark-koti')));
  // Otsikon perässä pelkkä ö (käyttäjän pyyntö 17.11.2026): musteen keskikohta versaalien keskellä kuten kammessa, rako 1 em.
  const oM = await page.evaluate(async () => {
    const s = document.querySelector('h2.ots .omerkki'), cs = getComputedStyle(s), pr = document.createElement('span');
    pr.style.cssText = 'display:inline-block;width:0;height:0'; s.appendChild(pr); const bl = pr.getBoundingClientRect().bottom, x0 = pr.getBoundingClientRect().left; pr.remove();
    // Kankaan mitat pyöristyvät pikseleiksi, joten mitataan 100 px:n koossa ja skaalataan.
    const c = document.createElement('canvas').getContext('2d'), k = parseFloat(cs.fontSize) / 100; c.font = cs.fontWeight + ' 100px ' + cs.fontFamily;
    const m0 = c.measureText('ö'), m = { actualBoundingBoxLeft: m0.actualBoundingBoxLeft * k, actualBoundingBoxAscent: m0.actualBoundingBoxAscent * k,
      actualBoundingBoxDescent: m0.actualBoundingBoxDescent * k }, hp = s.parentNode, p2 = document.createElement('span');
    p2.style.cssText = 'display:inline-block;width:0;height:0'; hp.insertBefore(p2, s); const hbl = p2.getBoundingClientRect().bottom; p2.remove();
    const tn = hp.firstChild, rg = document.createRange(); rg.setStart(tn, tn.length - 1); rg.setEnd(tn, tn.length);
    const ls = parseFloat(getComputedStyle(hp).letterSpacing), em = parseFloat(getComputedStyle(hp).fontSize);
    // Pelkän ö:n x0 on spanin alku (välilyönti romahtaa absoluuttisen laatikon alussa).
    const vasen = s.getBoundingClientRect().left - m.actualBoundingBoxLeft;
    return { napa: hbl - (bl - (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2), rako: (vasen - (rg.getBoundingClientRect().right - ls)) / em,
      koko: parseFloat(cs.fontSize) / em, paino: cs.fontWeight, iso: cs.textTransform };
  });
  t('ö-mappi: otsikon ö versaalien keskellä', Math.abs(oM.napa - linkinNapa) < .3, oM.napa.toFixed(2) + ' / ' + linkinNapa.toFixed(2) + ' px perusviivasta');
  t('ö-mappi: otsikon ö:n rako 1 em', Math.abs(oM.rako - 1) < .03, oM.rako.toFixed(3) + ' em');
  t('ö-mappi: otsikon ö isompi ja paksumpi, pieni ö', oM.koko > 1 && +oM.paino > 400 && oM.iso === 'none', JSON.stringify(oM));
  t('ö-mappi: ö ei kasvata otsikkoriviä', (await page.evaluate(() => document.querySelector('.ots-rivi').getBoundingClientRect().height)) <= 31);
  // Peilattu kellarilinkki vasemmassa alakulmassa: nuoli vasemmalla, kampi tekstin oikealla puolella.
  t('ö-mappi: paluulinkki näkyy', await page.isVisible('#ark-paluu'));
  const pl = await page.evaluate(() => {
    const a = document.querySelector('#ark-paluu a').getBoundingClientRect(), v = document.querySelector('#ark-paluu svg.veivi'),
      n = document.querySelector('#ark-paluu svg.nuoli').getBoundingClientRect(), sis = document.querySelector('#ark-paluu').getBoundingClientRect();
    return { vasen: a.left - sis.left, nuoli: n.left - a.left, kampi: v.getBoundingClientRect().left - a.right, peili: getComputedStyle(v).transform };
  });
  t('ö-mappi: paluulinkki peilattu', Math.abs(pl.vasen) < 1 && pl.nuoli < 1 && pl.kampi > 0 && /^matrix\(-1, 0, 0, 1/.test(pl.peili), JSON.stringify(pl));
  if (KUVAT) await page.screenshot({ path: KUVAT + '/omappi.png', fullPage: true });
  await page.click('#valitse-kaikki'); await page.click('#val-valikko');
  const v = await page.$$eval('#pop button', bs => bs.map(x => x.textContent));
  t('valittujen valikko ö-mapissa', v.includes('Palauta cellarin campihyllystöön.') && !v.some(x => /Poimi|Luin\./.test(x)), v.join(' | '));
  t('pino ei näytä ö-mappia', await page.evaluate(() => { location.hash = ''; return new Promise(r => setTimeout(() => r(document.querySelectorAll('#nimikkeet li.nimike').length === 1), 200)); }));
  await page.goto(U + 'luin.html#id=p-a'); await page.waitForTimeout(400);
  t('lukijan paluu ö-mappiin', (await page.getAttribute('.takaisin', 'href')) === '#omappi');
  await page.goto(U + 'luin.html#omappi'); await page.waitForTimeout(200);
  await page.click('#nimikkeet li.nimike >> nth=0 >> button.jako');
  await page.click('#pop button[data-k="omappi"]'); await page.click('#pop button[data-k="ok"]'); await page.waitForTimeout(150);
  t('palautus', (await page.textContent('#viesti')) === 'Teksti palasi cellarin campihyllystöön.' && (await page.$$('#nimikkeet li.nimike')).length === 0);
  await page.goto(U + 'luin.html#arkisto'); await page.waitForTimeout(200);
  t('kellarissa taas 2', (await page.$$('#nimikkeet li.nimike')).length === 2);
  await page.click('#valitse-kaikki'); await page.click('#val-valikko');
  const v2 = await page.$$eval('#pop button', bs => bs.map(x => x.textContent));
  t('valittujen valikko kellarissa', v2.includes('Siirrä ö-mappien mappiin ö.') && v2.includes('Poimi cellarin campihyllystöstä.'), v2.join(' | '));
  t('ei sivuvirheitä', !virheet.length, virheet.join('; '));
  await b.close(); palvelin.close(); process.exit(vik ? 1 : 0);
})();
